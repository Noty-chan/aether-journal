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
class Objective:
    id: str
    text: str
    done: bool = False
    progress: Optional[Tuple[int, int]] = None


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


@dataclass
class ChoiceOption:
    id: str
    label: str
    payload: Dict[str, Any] = field(default_factory=dict)


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
    links: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ChatThread:
    id: str
    contact_id: str
    opened: bool = False
    messages: List[ChatMessage] = field(default_factory=list)


from .helpers import utcnow  # noqa: E402
from .rules import ClassPerLevelBonus  # noqa: E402
