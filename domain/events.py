from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict


class EventKind(str, Enum):
    xp_granted = "xp.granted"
    level_up = "level.up"
    inventory_added = "inventory.added"
    inventory_removed = "inventory.removed"
    equipment_equipped = "equipment.equipped"
    equipment_unequipped = "equipment.unequipped"
    equipment_requested = "equipment.requested"
    quest_assigned = "quest.assigned"
    quest_status = "quest.status"
    message_sent = "message.sent"
    message_choice = "message.choice"
    player_frozen = "player.freeze"
    currency_updated = "currency.updated"
    resource_updated = "resource.updated"
    reputation_updated = "reputation.updated"
    ability_added = "ability.added"
    ability_updated = "ability.updated"
    ability_removed = "ability.removed"
    settings_updated = "settings.updated"
    class_bonus_updated = "class.per_level_bonus.updated"
    item_template_upserted = "item.template.upserted"
    message_template_upserted = "message.template.upserted"
    stat_allocated = "stat.allocated"
    chat_contact_added = "chat.contact.added"
    chat_friend_request_sent = "chat.friend_request.sent"
    chat_friend_request_accepted = "chat.friend_request.accepted"
    chat_message = "chat.message"


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
