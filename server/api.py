from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.permissions import HOST_ROLE, PLAYER_ROLE
from app.services import CampaignService
from domain.errors import DomainError
from domain.events import EventLogEntry
from domain.helpers import new_id
from domain.models import (
    Ability,
    ChatLink,
    EquipmentSlot,
    MessageSeverity,
    QuestStatus,
    chat_link_to_dict,
)
from storage.json_repo import serialize_campaign_state

from .auth import PairingManager
from .ws import WebSocketHub


class PairingRequest(BaseModel):
    pin: str = Field(..., min_length=1)


class GrantXpRequest(BaseModel):
    amount: int


class XpCurveRequest(BaseModel):
    base_xp: int = Field(..., ge=1)
    growth_rate: float = Field(..., gt=0)


class StatRuleRequest(BaseModel):
    base_per_level: int = Field(..., ge=0)
    bonus_every_5: int = Field(..., ge=0)
    bonus_every_10: int = Field(..., ge=0)


class SettingsUpdateRequest(BaseModel):
    xp_curve: XpCurveRequest
    stat_rule: StatRuleRequest


class ClassBonusUpdateRequest(BaseModel):
    per_level_bonus: Dict[str, int] = Field(default_factory=dict)


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


class CurrencyUpdateRequest(BaseModel):
    currency_id: str
    value: int


class ResourceUpdateRequest(BaseModel):
    resource_id: str
    current: int
    maximum: int


class ReputationUpdateRequest(BaseModel):
    reputation_id: str
    value: int


class AbilityUpsertRequest(BaseModel):
    id: Optional[str] = None
    name: str
    description: str = ""
    category_id: str = ""
    active: bool = True
    hidden: bool = False
    cooldown_s: Optional[int] = None
    cost: Optional[str] = None
    source: str = "manual"
    scope: str = "character"


class ContactRequest(BaseModel):
    display_name: str
    link_payload: Dict[str, Any] = Field(default_factory=dict)


class FriendRequestPayload(BaseModel):
    contact_id: str


class ChatLinkPayload(BaseModel):
    type: str
    id: str
    label: Optional[str] = None


class ChatMessageRequest(BaseModel):
    text: str
    links: List[ChatLinkPayload] = Field(default_factory=list)
    sender_contact_id: Optional[str] = None


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


def build_linkable_catalog(service: CampaignService) -> Dict[str, List[Dict[str, str]]]:
    state = service.state
    return {
        "npcs": [
            {"type": "npc", "id": contact.id, "label": contact.display_name}
            for contact in state.contacts.values()
        ],
        "quests": [
            {"type": "quest", "id": template.id, "label": template.name}
            for template in state.quest_templates.values()
        ],
        "items": [
            {"type": "item", "id": template.id, "label": template.name}
            for template in state.item_templates.values()
        ],
    }


def resolve_chat_links(
    links: List[ChatLinkPayload], service: CampaignService
) -> List[Dict[str, Any]]:
    state = service.state
    resolved: List[Dict[str, str]] = []
    for link in links:
        if link.type == "npc":
            contact = state.contacts.get(link.id)
            if not contact:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="NPC not found"
                )
            label = contact.display_name
        elif link.type == "quest":
            quest = state.quest_templates.get(link.id)
            if not quest:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Quest not found"
                )
            label = quest.name
        elif link.type == "item":
            item = state.item_templates.get(link.id)
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Item not found"
                )
            label = item.name
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported link type"
            )
        resolved.append(
            chat_link_to_dict(
                ChatLink(
                    kind=link.type,
                    id=link.id,
                    title=label,
                )
            )
        )
    return resolved


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


@router.post("/host/settings", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def update_settings(
    payload: SettingsUpdateRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.update_settings(
            base_xp=payload.xp_curve.base_xp,
            growth_rate=payload.xp_curve.growth_rate,
            base_per_level=payload.stat_rule.base_per_level,
            bonus_every_5=payload.stat_rule.bonus_every_5,
            bonus_every_10=payload.stat_rule.bonus_every_10,
            actor_role=HOST_ROLE,
        ),
    )


@router.post(
    "/host/classes/{class_id}/per-level-bonus",
    dependencies=[Depends(require_token_role(HOST_ROLE))],
)
async def update_class_bonus(
    class_id: str, payload: ClassBonusUpdateRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.update_class_per_level_bonus(
            class_id=class_id,
            per_level_bonus=payload.per_level_bonus,
            actor_role=HOST_ROLE,
        ),
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


@router.post("/host/currencies", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def update_currency(
    payload: CurrencyUpdateRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.update_currency(
            currency_id=payload.currency_id,
            value=payload.value,
            actor_role=HOST_ROLE,
        ),
    )


@router.post("/host/resources", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def update_resource(
    payload: ResourceUpdateRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.update_resource(
            resource_id=payload.resource_id,
            current=payload.current,
            maximum=payload.maximum,
            actor_role=HOST_ROLE,
        ),
    )


@router.post("/host/reputations", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def update_reputation(
    payload: ReputationUpdateRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.update_reputation(
            reputation_id=payload.reputation_id,
            value=payload.value,
            actor_role=HOST_ROLE,
        ),
    )


@router.post("/host/abilities", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def upsert_ability(
    payload: AbilityUpsertRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    ability = Ability(
        id=payload.id or new_id("ability"),
        name=payload.name,
        description=payload.description,
        category_id=payload.category_id,
        active=payload.active,
        hidden=payload.hidden,
        cooldown_s=payload.cooldown_s,
        cost=payload.cost,
        source=payload.source,
    )
    return await _apply_service(
        context,
        lambda: context.service.upsert_ability(
            ability=ability,
            scope=payload.scope,
            actor_role=HOST_ROLE,
        ),
    )


@router.delete(
    "/host/abilities/{ability_id}", dependencies=[Depends(require_token_role(HOST_ROLE))]
)
async def remove_ability(
    ability_id: str,
    scope: str = "character",
    context: ApiContext = Depends(get_api_context),
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.remove_ability(
            ability_id=ability_id,
            scope=scope,
            actor_role=HOST_ROLE,
        ),
    )


@router.post("/host/contacts", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def add_chat_contact(
    payload: ContactRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.add_chat_contact(
            display_name=payload.display_name,
            link_payload=payload.link_payload,
            actor_role=HOST_ROLE,
        ),
    )


@router.post("/host/friend-requests", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def send_friend_request(
    payload: FriendRequestPayload, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.send_friend_request(
            contact_id=payload.contact_id, actor_role=HOST_ROLE
        ),
    )


@router.get("/host/linkables", dependencies=[Depends(require_token_role(HOST_ROLE))])
def list_host_linkables(context: ApiContext = Depends(get_api_context)) -> Dict[str, Any]:
    return build_linkable_catalog(context.service)


@router.post(
    "/player/friend-requests/{request_id}/accept",
    dependencies=[Depends(require_token_role(PLAYER_ROLE))],
)
async def accept_friend_request(
    request_id: str, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.accept_friend_request(
            request_id=request_id, actor_role=PLAYER_ROLE
        ),
    )


@router.get("/player/linkables", dependencies=[Depends(require_token_role(PLAYER_ROLE))])
def list_player_linkables(context: ApiContext = Depends(get_api_context)) -> Dict[str, Any]:
    return build_linkable_catalog(context.service)


@router.post("/host/chats/{chat_id}/messages", dependencies=[Depends(require_token_role(HOST_ROLE))])
async def send_host_chat_message(
    chat_id: str, payload: ChatMessageRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.send_chat_message(
            chat_id=chat_id,
            text=payload.text,
            links=resolve_chat_links(payload.links, context.service),
            sender_contact_id=payload.sender_contact_id,
            actor_role=HOST_ROLE,
        ),
    )


@router.post(
    "/player/chats/{chat_id}/messages",
    dependencies=[Depends(require_token_role(PLAYER_ROLE))],
)
async def send_player_chat_message(
    chat_id: str, payload: ChatMessageRequest, context: ApiContext = Depends(get_api_context)
) -> Dict[str, Any]:
    return await _apply_service(
        context,
        lambda: context.service.send_chat_message(
            chat_id=chat_id,
            text=payload.text,
            links=resolve_chat_links(payload.links, context.service),
            actor_role=PLAYER_ROLE,
        ),
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
