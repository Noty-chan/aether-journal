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

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seq": self.seq,
            "ts": self.ts.isoformat(),
            "actor": self.actor,
            "kind": self.kind,
            "payload": self.payload,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EventLogEntry":
        return cls(
            seq=int(data["seq"]),
            ts=datetime.fromisoformat(data["ts"]),
            actor=str(data["actor"]),
            kind=str(data["kind"]),
            payload=dict(data.get("payload", {})),
        )
