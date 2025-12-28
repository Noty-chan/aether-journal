from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Iterable, Set

from fastapi import WebSocket

from domain.events import EventLogEntry


@dataclass
class WebSocketHub:
    connections: Set[WebSocket] = field(default_factory=set)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self.lock:
            self.connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self.lock:
            self.connections.discard(websocket)

    async def broadcast_events(self, events: Iterable[EventLogEntry]) -> None:
        payloads = [event.to_dict() for event in events]
        if not payloads:
            return
        async with self.lock:
            connections = list(self.connections)
        await asyncio.gather(
            *[self._safe_send_json(ws, {"type": "events", "items": payloads}) for ws in connections]
        )

    async def _safe_send_json(self, websocket: WebSocket, payload: dict) -> None:
        try:
            await websocket.send_json(payload)
        except Exception:
            await self.disconnect(websocket)
