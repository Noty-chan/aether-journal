from __future__ import annotations

from typing import List, Protocol

from domain.events import EventLogEntry
from domain.models import CampaignState


class CampaignRepository(Protocol):
    def load(self) -> CampaignState:
        ...

    def save(self, state: CampaignState) -> None:
        ...

    def append_events(self, events: List[EventLogEntry]) -> List[EventLogEntry]:
        ...

    def list_events(self, after_seq: int = 0) -> List[EventLogEntry]:
        ...

    def get_last_seq(self) -> int:
        ...

    def export_data(self) -> dict:
        ...

    def import_data(self, data: dict) -> None:
        ...

    def export_templates(self) -> dict:
        ...

    def import_templates(self, data: dict) -> None:
        ...

    def export_log(self) -> dict:
        ...

    def import_log(self, data: dict) -> None:
        ...

    def export_chats(self) -> dict:
        ...

    def import_chats(self, data: dict) -> None:
        ...
