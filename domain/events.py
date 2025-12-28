from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict


@dataclass
class EventLogEntry:
    seq: int
    ts: datetime
    actor: str
    kind: str
    payload: Dict[str, Any] = field(default_factory=dict)
