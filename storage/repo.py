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
