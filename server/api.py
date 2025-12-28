from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.permissions import HOST_ROLE, PLAYER_ROLE
from app.services import CampaignService
from domain.errors import DomainError
from domain.events import EventLogEntry
from domain.models import EquipmentSlot, MessageSeverity, QuestStatus
from storage.json_repo import serialize_campaign_state

from .auth import PairingManager
from .ws import WebSocketHub


class PairingRequest(BaseModel):
    pin: str = Field(..., min_length=1)


class GrantXpRequest(BaseModel):
    amount: int


class AddItemRequest(BaseModel):
    template_id: str
    qty: int = 1
    custom_name: Optional[str] = None


class EquipRequest(BaseModel):
    item_instance_id: str
    slot: EquipmentSlot


class QuestAssignRequest(BaseModel):
    template_id: str


class QuestStatusRequest(BaseModel):
    status: QuestStatus


class MessageRequest(BaseModel):
    title: str
    body: str
    severity: MessageSeverity = MessageSeverity.info
    collapsible: bool = True


class ChoiceRequest(BaseModel):
    option_id: str


class FreezeRequest(BaseModel):
    frozen: bool


class ImportRequest(BaseModel):
    snapshot: Dict[str, Any]
    events: List[Dict[str, Any]] = Field(default_factory=list)
    last_seq: int = 0
    schema_version: Optional[int] = None


@dataclass
class ApiContext:
    service: CampaignService
    pairing: PairingManager
    hub: WebSocketHub
    repo: Any


def get_api_context(request: Request) -> ApiContext:
    return request.app.state.context


def require_token_role(role: str):
    async def _dependency(
        authorization: str = Header(..., alias="Authorization"),
        context: ApiContext = Depends(get_api_context),
    ) -> str:
        token = authorization.replace("Bearer", "").strip()
        actor_role = context.pairing.get_role(token)
        if actor_role != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")
        return actor_role

    return _dependency


router = APIRouter(prefix="/api")


@router.post("/host/pairing")
def create_host_pairing(
    payload: PairingRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, str]:
    token = context.pairing.set_pin(payload.pin)
    return {"host_token": token}


@router.post("/player/pairing")
def create_player_pairing(
    payload: PairingRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, str]:
    try:
        token = context.pairing.pair_player(payload.pin)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return {"player_token": token}


@router.get("/snapshot")
def get_snapshot(
    context: ApiContext = Depends(get_api_context),
    authorization: str = Header(..., alias="Authorization"),
) -> Dict[str, Any]:
    token = authorization.replace("Bearer", "").strip()
    if context.pairing.get_role(token) is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")
    last_seq = context.repo.get_last_seq()
    return {
        "snapshot": serialize_campaign_state(context.service.state),
        "last_seq": last_seq,
    }


@router.get("/events")
def list_events(
    after_seq: int = 0,
    context: ApiContext = Depends(get_api_context),
    authorization: str = Header(..., alias="Authorization"),
) -> Dict[str, Any]:
    token = authorization.replace("Bearer", "").strip()
    if context.pairing.get_role(token) is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")
    events = context.repo.list_events(after_seq=after_seq)
    return {"events": [event.to_dict() for event in events]}


@router.post("/host/grant-xp", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def grant_xp(
    payload: GrantXpRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context, lambda: context.service.grant_xp(payload.amount, actor_role=HOST_ROLE)
    )


@router.post("/host/items", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def add_item(
    payload: AddItemRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.add_item_instance(
            template_id=payload.template_id,
            qty=payload.qty,
            custom_name=payload.custom_name,
            actor_role=HOST_ROLE,
        ),
    )


@router.delete(
    "/host/items/{item_instance_id}", dependencies=[Depends(require_token_role(HOST_ROLE))]
)
async def remove_item(
    item_instance_id: str, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.remove_item_instance(
            item_instance_id=item_instance_id, actor_role=HOST_ROLE
        ),
    )


@router.post("/host/equip", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def host_equip(
    payload: EquipRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.equip_item(
            item_instance_id=payload.item_instance_id,
            slot=payload.slot,
            actor_role=HOST_ROLE,
        ),
    )


@router.post("/player/equip-request", dependencies=[Depends(require_token_role(PLAYER_ROLE))])
async def player_equip_request(
    payload: EquipRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.request_equip_item(
            item_instance_id=payload.item_instance_id,
            slot=payload.slot,
            actor_role=PLAYER_ROLE,
        ),
    )


@router.post("/host/quests", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def assign_quest(
    payload: QuestAssignRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.assign_quest_from_template(
            template_id=payload.template_id, actor_role=HOST_ROLE
        ),
    )


@router.post(
    "/host/quests/{quest_id}/status",
    dependencies=[Depends(require_token_role(HOST_ROLE))],
)
async def set_quest_status(
    quest_id: str, payload: QuestStatusRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.update_quest_status(
            quest_id=quest_id, new_status=payload.status, actor_role=HOST_ROLE
        ),
    )


@router.post("/host/messages", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def send_message(
    payload: MessageRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.send_system_message(
            title=payload.title,
            body=payload.body,
            severity=payload.severity,
            collapsible=payload.collapsible,
            actor_role=HOST_ROLE,
        ),
    )


@router.post(
    "/player/messages/{message_id}/choice",
    dependencies=[Depends(require_token_role(PLAYER_ROLE))],
)
async def choose_message(
    message_id: str, payload: ChoiceRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.choose_message_option(
            message_id=message_id, option_id=payload.option_id, actor_role=PLAYER_ROLE
        ),
    )


@router.post("/host/freeze", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def freeze_player(
    payload: FreezeRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context, lambda: context.service.freeze_player(payload.frozen, actor_role=HOST_ROLE)
    )


@router.get("/host/export", dependencies=[Depends(require_token_role(HOST_ROLE))])
def export_campaign(context: ApiContext = Depends(get_api_context)) -> Dict[str, Any]:
    return context.repo.export_data()


@router.post("/host/import", dependencies=[Depends(require_token_role(HOST_ROLE))])
def import_campaign(
    payload: ImportRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    context.repo.import_data(payload.dict())
    context.service.state = context.repo.load()
    return {"status": "ok"}


async def _persist_and_broadcast(
    context: ApiContext, events: List[EventLogEntry]
) -> Dict[str, Any]:
    persisted = context.repo.append_events(events)
    context.repo.save(context.service.state)
    await context.hub.broadcast_events(persisted)
    return {"events": [event.to_dict() for event in persisted]}


async def _apply_service(context: ApiContext, call) -> Dict[str, Any]:
    try:
        events = call()
    except DomainError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return await _persist_and_broadcast(context, events)
