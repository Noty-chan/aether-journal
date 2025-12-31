from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.services import CampaignService
from domain.models import CampaignState
from storage.json_repo import JsonCampaignRepository

from .api import ApiContext, router
from .auth import PairingManager
from .ui import router as ui_router
from .ws import WebSocketHub


def _is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _is_campaign_empty(state: CampaignState | None) -> bool:
    if state is None:
        return True
    return not (
        state.item_templates
        or state.quest_templates
        or state.message_templates
        or state.active_quests
        or state.system_messages
        or state.chats
        or state.contacts
    )


def _load_demo_data_if_empty(
    repo: JsonCampaignRepository,
    state: CampaignState,
    base_dir: Path,
) -> CampaignState:
    if not _is_truthy(os.getenv("AETHER_LOAD_DEMO")):
        return state
    if not _is_campaign_empty(state):
        return state
    demo_path = Path(os.getenv("AETHER_DEMO_PATH", "storage/seed_demo.json"))
    if not demo_path.is_absolute():
        demo_path = base_dir / demo_path
    if not demo_path.exists():
        return state
    demo_data = json.loads(demo_path.read_text(encoding="utf-8"))
    repo.import_data(demo_data)
    return repo.load()


def create_app() -> FastAPI:
    app = FastAPI(title="Aether Journal Host")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    base_dir = Path(__file__).resolve().parent.parent
    repo_path = os.getenv("AETHER_CAMPAIGN_PATH", "data/campaign.json")
    repo = JsonCampaignRepository(repo_path)
    state = repo.load()
    state = _load_demo_data_if_empty(repo, state, base_dir)
    service = CampaignService(state)
    pairing = PairingManager()
    hub = WebSocketHub()

    app.state.context = ApiContext(service=service, pairing=pairing, hub=hub, repo=repo)

    app.include_router(router)
    app.include_router(ui_router)

    server_dir = Path(__file__).resolve().parent
    host_ui = base_dir / "static" / "host"
    player_ui = base_dir / "static" / "player"
    icons_dir = base_dir / "static" / "icons"
    fallback_host_ui = server_dir / "static" / "host"
    fallback_player_ui = server_dir / "static" / "player"
    fallback_icons_dir = server_dir / "static" / "icons"
    host_ui = host_ui if host_ui.exists() else fallback_host_ui
    player_ui = player_ui if player_ui.exists() else fallback_player_ui
    icons_dir = icons_dir if icons_dir.exists() else fallback_icons_dir
    if host_ui.exists():
        app.mount("/host", StaticFiles(directory=host_ui, html=True), name="host")
    if player_ui.exists():
        app.mount("/player", StaticFiles(directory=player_ui, html=True), name="player")
    if icons_dir.exists():
        app.mount("/icons", StaticFiles(directory=icons_dir), name="icons")

    @app.websocket("/ws")
    async def events_ws(websocket: WebSocket, token: str, after_seq: int = 0) -> None:
        role = pairing.get_role(token)
        if role is None:
            await websocket.close(code=1008)
            return
        await hub.connect(websocket)
        try:
            backlog = repo.list_events(after_seq=after_seq)
            if backlog:
                await websocket.send_json(
                    {"type": "events", "items": [event.to_dict() for event in backlog]}
                )
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await hub.disconnect(websocket)

    return app


app = create_app()
