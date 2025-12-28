from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class Rarity(str, Enum):
    gray = "gray"
    white = "white"
    green = "green"
    blue = "blue"
    purple = "purple"
    orange = "orange"
    red = "red"


class MessageSeverity(str, Enum):
    info = "info"
    warning = "warning"
    alert = "alert"


class EquipmentSlot(str, Enum):
    weapon_1 = "weapon_1"
    weapon_2 = "weapon_2"
    head = "head"
    torso = "torso"
    legs = "legs"
    boots = "boots"
    ring_1 = "ring_1"
    ring_2 = "ring_2"


class ItemType(str, Enum):
    weapon = "weapon"
    armor = "armor"
    accessory = "accessory"
    consumable = "consumable"
    quest = "quest"
    misc = "misc"


class QuestStatus(str, Enum):
    active = "active"
    completed = "completed"
    failed = "failed"
    hidden = "hidden"


@dataclass
class AbilityCategory:
    id: str
    name: str
    description: str = ""
    hidden: bool = False


@dataclass
class Ability:
    id: str
    name: str
    description: str = ""
    category_id: str = ""
    active: bool = True
    hidden: bool = False
    cooldown_s: Optional[int] = None
    cost: Optional[str] = None
    source: str = "manual"


@dataclass
class ItemTemplate:
    id: str
    name: str
    item_type: ItemType
    rarity: Rarity = Rarity.white
    description: str = ""
    icon_key: Optional[str] = None
    equip_slots: List[EquipmentSlot] = field(default_factory=list)
    two_handed: bool = False
    stat_mods: Dict[str, int] = field(default_factory=dict)
    granted_ability_ids: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)


@dataclass
class ItemInstance:
    id: str
    template_id: str
    qty: int = 1
    custom_name: Optional[str] = None
    bound: bool = False
    meta: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EquipmentState:
    """Mapping from slot -> item_instance_id."""

    slots: Dict[EquipmentSlot, Optional[str]] = field(
        default_factory=lambda: {slot: None for slot in EquipmentSlot}
    )


@dataclass
class InventoryState:
    items: Dict[str, ItemInstance] = field(default_factory=dict)

    def add(self, inst: ItemInstance) -> None:
        self.items[inst.id] = inst

    def remove(self, inst_id: str) -> None:
        self.items.pop(inst_id, None)

    def get(self, inst_id: str) -> Optional[ItemInstance]:
        return self.items.get(inst_id)


@dataclass
class ClassDefinition:
    id: str
    name: str
    description: str = ""
    allowed_item_types: List[ItemType] = field(default_factory=list)
    allowed_slots: List[EquipmentSlot] = field(default_factory=list)
    per_level_bonus: "ClassPerLevelBonus" = field(default_factory=lambda: ClassPerLevelBonus())


@dataclass
class Character:
    id: str
    name: str
    class_id: str
    level: int = 1
    xp: int = 0
    unspent_stat_points: int = 0
    stats: Dict[str, int] = field(default_factory=dict)
    resources: Dict[str, Tuple[int, int]] = field(default_factory=dict)
    currencies: Dict[str, int] = field(default_factory=dict)
    reputations: Dict[str, int] = field(default_factory=dict)
    equipment: EquipmentState = field(default_factory=EquipmentState)
    inventory: InventoryState = field(default_factory=InventoryState)
    abilities: Dict[str, Ability] = field(default_factory=dict)
    frozen: bool = False


@dataclass
class CampaignSettings:
    xp_curve: "XPCurveExponential" = field(default_factory=lambda: XPCurveExponential())
    stat_rule: "StatPointRule" = field(default_factory=lambda: StatPointRule())
    equipment_category_id: str = "equipment"


@dataclass
class CampaignState:
    id: str
    character: Character
    classes: Dict[str, ClassDefinition] = field(default_factory=dict)
    item_templates: Dict[str, ItemTemplate] = field(default_factory=dict)
    quest_templates: Dict[str, QuestTemplate] = field(default_factory=dict)
    ability_categories: Dict[str, AbilityCategory] = field(default_factory=dict)
    abilities: Dict[str, Ability] = field(default_factory=dict)
    active_quests: List[QuestInstance] = field(default_factory=list)
    system_messages: List[SystemMessage] = field(default_factory=list)
    chats: Dict[str, ChatThread] = field(default_factory=dict)
    contacts: Dict[str, ChatContact] = field(default_factory=dict)
    friend_requests: Dict[str, FriendRequest] = field(default_factory=dict)
    settings: CampaignSettings = field(default_factory=CampaignSettings)


@dataclass
class Objective:
    id: str
    text: str
    done: bool = False
    progress: Optional[Tuple[int, int]] = None


def objective_to_dict(obj: Objective) -> Dict[str, Any]:
    return {
        "id": obj.id,
        "text": obj.text,
        "done": obj.done,
        "progress": list(obj.progress) if obj.progress else None,
    }


def objective_from_dict(data: Dict[str, Any]) -> Objective:
    progress = data.get("progress")
    return Objective(
        id=str(data["id"]),
        text=str(data.get("text", "")),
        done=bool(data.get("done", False)),
        progress=tuple(progress) if progress else None,
    )


@dataclass
class QuestTemplate:
    id: str
    name: str
    description: str = ""
    cannot_decline: bool = False
    objectives: List[Objective] = field(default_factory=list)
    rewards: Dict[str, Any] = field(default_factory=dict)


@dataclass
class QuestInstance:
    id: str
    template_id: str
    status: QuestStatus = QuestStatus.active
    objectives: List[Objective] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: utcnow())
    completed_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "template_id": self.template_id,
            "status": self.status.value,
            "objectives": [objective_to_dict(obj) for obj in self.objectives],
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "QuestInstance":
        return cls(
            id=str(data["id"]),
            template_id=str(data["template_id"]),
            status=QuestStatus(data.get("status", QuestStatus.active.value)),
            objectives=[objective_from_dict(obj) for obj in data.get("objectives", [])],
            started_at=datetime.fromisoformat(data["started_at"])
            if data.get("started_at")
            else utcnow(),
            completed_at=datetime.fromisoformat(data["completed_at"])
            if data.get("completed_at")
            else None,
        )


@dataclass
class ChoiceOption:
    id: str
    label: str
    payload: Dict[str, Any] = field(default_factory=dict)


def choice_to_dict(choice: ChoiceOption) -> Dict[str, Any]:
    return {
        "id": choice.id,
        "label": choice.label,
        "payload": choice.payload,
    }


def choice_from_dict(data: Dict[str, Any]) -> ChoiceOption:
    return ChoiceOption(
        id=str(data["id"]),
        label=str(data.get("label", "")),
        payload=dict(data.get("payload", {})),
    )


@dataclass
class SystemMessage:
    id: str
    created_at: datetime
    severity: MessageSeverity
    title: str
    body: str
    collapsible: bool = True
    choices: List[ChoiceOption] = field(default_factory=list)
    chosen_option_id: Optional[str] = None
    sound: MessageSeverity = MessageSeverity.info
    effect: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "severity": self.severity.value,
            "title": self.title,
            "body": self.body,
            "collapsible": self.collapsible,
            "choices": [choice_to_dict(choice) for choice in self.choices],
            "chosen_option_id": self.chosen_option_id,
            "sound": self.sound.value,
            "effect": self.effect,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SystemMessage":
        return cls(
            id=str(data["id"]),
            created_at=datetime.fromisoformat(data["created_at"])
            if data.get("created_at")
            else utcnow(),
            severity=MessageSeverity(data.get("severity", MessageSeverity.info.value)),
            title=str(data.get("title", "")),
            body=str(data.get("body", "")),
            collapsible=bool(data.get("collapsible", True)),
            choices=[choice_from_dict(choice) for choice in data.get("choices", [])],
            chosen_option_id=data.get("chosen_option_id"),
            sound=MessageSeverity(data.get("sound", MessageSeverity.info.value)),
            effect=data.get("effect"),
        )


@dataclass
class ChatContact:
    id: str
    display_name: str
    link_payload: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FriendRequest:
    id: str
    contact_id: str
    created_at: datetime = field(default_factory=lambda: utcnow())
    accepted: bool = False
    accepted_at: Optional[datetime] = None


@dataclass
class ChatMessage:
    id: str
    chat_id: str
    sender_contact_id: str
    text: str
    created_at: datetime = field(default_factory=lambda: utcnow())
    links: List["ChatLink"] = field(default_factory=list)


@dataclass
class ChatLink:
    kind: str
    title: str
    summary: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)


def chat_link_to_dict(link: ChatLink) -> Dict[str, Any]:
    return {
        "kind": link.kind,
        "title": link.title,
        "summary": link.summary,
        "payload": link.payload,
    }


def chat_link_from_dict(data: Dict[str, Any]) -> ChatLink:
    return ChatLink(
        kind=str(data.get("kind", "")),
        title=str(data.get("title", "")),
        summary=str(data.get("summary", "")),
        payload=dict(data.get("payload", {})),
    )


@dataclass
class ChatThread:
    id: str
    contact_id: str
    opened: bool = False
    messages: List[ChatMessage] = field(default_factory=list)


from .helpers import utcnow  # noqa: E402
from .rules import ClassPerLevelBonus, StatPointRule, XPCurveExponential  # noqa: E402
