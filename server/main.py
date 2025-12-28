from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.services import CampaignService
from storage.json_repo import JsonCampaignRepository

from .api import ApiContext, router
from .auth import PairingManager
from .ws import WebSocketHub


def create_app() -> FastAPI:
    app = FastAPI(title="Aether Journal Host")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    repo_path = os.getenv("AETHER_CAMPAIGN_PATH", "data/campaign.json")
    repo = JsonCampaignRepository(repo_path)
    state = repo.load()
    service = CampaignService(state)
    pairing = PairingManager()
    hub = WebSocketHub()

    app.state.context = ApiContext(service=service, pairing=pairing, hub=hub, repo=repo)

    app.include_router(router)

    base_dir = Path(__file__).resolve().parent.parent
    player_ui = base_dir / "static" / "player"
    if player_ui.exists():
        app.mount("/player", StaticFiles(directory=player_ui, html=True), name="player")

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
