\
"""
core.py — Domain scaffolding (to be split into /domain and /app)

Goal:
- Provide strongly-typed domain entities and rule helpers for:
  - Exponential XP curve
  - Level-up stat point awarding
  - Class per-level bonuses
  - Inventory + equipment slots (incl. two-handed)
  - Abilities and categories
  - Quests, uniqueness constraints
  - System messages (collapsible / choice)
  - Auto-log events (append-only)

This file is intentionally "monolithic" for seeding. The agent should split it.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Literal, Iterable
from datetime import datetime, timezone
import math
import uuid


# ---------------------------
# Helpers
# ---------------------------

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

def clamp_int(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))


# ---------------------------
# Enums
# ---------------------------

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


# ---------------------------
# Rules / Config
# ---------------------------

@dataclass
class XPCurveExponential:
    """
    xp_to_next(level) = round(base_xp * growth_rate ** (level-1))
    """
    base_xp: int = 200
    growth_rate: float = 1.25

    def xp_to_next(self, level: int) -> int:
        if level < 1:
            raise ValueError("level must be >= 1")
        raw = self.base_xp * (self.growth_rate ** (level - 1))
        return max(1, int(round(raw)))

@dataclass
class StatPointRule:
    """
    On reaching level L:
      +5 always
      +2 if L % 5 == 0
      +1 if L % 10 == 0 (additional)
    """
    base_per_level: int = 5
    bonus_every_5: int = 2
    bonus_every_10: int = 1

    def points_on_level(self, new_level: int) -> int:
        pts = self.base_per_level
        if new_level % 5 == 0:
            pts += self.bonus_every_5
        if new_level % 10 == 0:
            pts += self.bonus_every_10
        return pts

    def points_for_range(self, from_level: int, to_level: int) -> int:
        """
        Sum points for leveling up from from_level to to_level (exclusive of from_level).
        Example: from 1 to 4 means gaining levels 2,3,4.
        """
        if to_level <= from_level:
            return 0
        total = 0
        for L in range(from_level + 1, to_level + 1):
            total += self.points_on_level(L)
        return total

@dataclass
class ClassPerLevelBonus:
    """
    Per-level stat bonuses for a class.
    Example: { "F": 2, "V": 1, "S": 0 } each level.
    """
    per_level_stat_delta: Dict[str, int] = field(default_factory=dict)

    def apply_for_levels(self, stats: Dict[str, int], from_level: int, to_level: int) -> Dict[str, int]:
        if to_level <= from_level:
            return stats
        levels_gained = to_level - from_level
        for stat_id, delta in self.per_level_stat_delta.items():
            stats[stat_id] = int(stats.get(stat_id, 0)) + int(delta) * levels_gained
        return stats


# ---------------------------
# Domain entities
# ---------------------------

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
    # source indicates where it came from (class, equipment, effect, etc.)
    source: str = "manual"  # e.g. "class:warrior", "item:xyz"

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

    # Stat mods applied while equipped (additive)
    stat_mods: Dict[str, int] = field(default_factory=dict)

    # Abilities granted while equipped
    granted_ability_ids: List[str] = field(default_factory=list)

    # Restrictions metadata (optional, evaluated by class rules or explicit checks)
    tags: List[str] = field(default_factory=list)

@dataclass
class ItemInstance:
    id: str
    template_id: str
    qty: int = 1
    custom_name: Optional[str] = None
    bound: bool = False
    # For future: durability, rolls, etc.
    meta: Dict[str, Any] = field(default_factory=dict)

@dataclass
class EquipmentState:
    """
    Mapping from slot -> item_instance_id
    """
    slots: Dict[EquipmentSlot, Optional[str]] = field(default_factory=lambda: {s: None for s in EquipmentSlot})

@dataclass
class InventoryState:
    items: Dict[str, ItemInstance] = field(default_factory=dict)  # id -> instance

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

    # Allowed equip constraints (simple MVP)
    allowed_item_types: List[ItemType] = field(default_factory=list)
    allowed_slots: List[EquipmentSlot] = field(default_factory=list)

    per_level_bonus: ClassPerLevelBonus = field(default_factory=ClassPerLevelBonus)

@dataclass
class Character:
    id: str
    name: str
    class_id: str

    level: int = 1
    xp: int = 0
    unspent_stat_points: int = 0

    # Stats, resources, currencies, reputations are all configurable sets
    stats: Dict[str, int] = field(default_factory=dict)
    resources: Dict[str, Tuple[int, int]] = field(default_factory=dict)  # id -> (current, max)
    currencies: Dict[str, int] = field(default_factory=dict)
    reputations: Dict[str, int] = field(default_factory=dict)

    equipment: EquipmentState = field(default_factory=EquipmentState)
    inventory: InventoryState = field(default_factory=InventoryState)

    # Abilities may include multiple sources
    abilities: Dict[str, Ability] = field(default_factory=dict)  # id -> ability

    frozen: bool = False  # freeze all actions/abilities toggles exist separately in app config

@dataclass
class Objective:
    id: str
    text: str
    done: bool = False
    progress: Optional[Tuple[int, int]] = None  # (current, target), optional

@dataclass
class QuestTemplate:
    id: str
    name: str
    description: str = ""
    cannot_decline: bool = False
    objectives: List[Objective] = field(default_factory=list)
    rewards: Dict[str, Any] = field(default_factory=dict)  # flexible: items/xp/currency/etc.

@dataclass
class QuestInstance:
    id: str
    template_id: str
    status: QuestStatus = QuestStatus.active
    objectives: List[Objective] = field(default_factory=list)
    started_at: datetime = field(default_factory=utcnow)
    completed_at: Optional[datetime] = None

@dataclass
class ChoiceOption:
    id: str
    label: str
    # payload is interpreted by application layer
    payload: Dict[str, Any] = field(default_factory=dict)

@dataclass
class SystemMessage:
    id: str
    created_at: datetime
    severity: MessageSeverity
    title: str
    body: str

    collapsible: bool = True
    # for choice messages:
    choices: List[ChoiceOption] = field(default_factory=list)
    chosen_option_id: Optional[str] = None

    # audio category (info/warning/alert)
    sound: MessageSeverity = MessageSeverity.info

    # special effects
    effect: Optional[str] = None  # e.g. "level_up"

@dataclass
class ChatContact:
    id: str
    display_name: str
    # optional link payload for "card preview"
    link_payload: Dict[str, Any] = field(default_factory=dict)

@dataclass
class FriendRequest:
    id: str
    contact_id: str
    created_at: datetime = field(default_factory=utcnow)
    accepted: bool = False
    accepted_at: Optional[datetime] = None

@dataclass
class ChatMessage:
    id: str
    chat_id: str
    sender_contact_id: str
    text: str
    created_at: datetime = field(default_factory=utcnow)
    # embedded links: items/quests/entities
    links: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class ChatThread:
    id: str
    contact_id: str
    opened: bool = False
    messages: List[ChatMessage] = field(default_factory=list)

@dataclass
class EventLogEntry:
    seq: int
    ts: datetime
    actor: str  # "host" | "player" | "system"
    kind: str
    payload: Dict[str, Any] = field(default_factory=dict)


# ---------------------------
# Domain services (pure logic)
# ---------------------------

class DomainError(Exception):
    pass

class EquipError(DomainError):
    pass

class QuestError(DomainError):
    pass

class PermissionError(DomainError):
    pass


def compute_level_from_xp(current_level: int, current_xp: int, curve: XPCurveExponential) -> Tuple[int, int]:
    """
    Given current_level and current_xp (xp towards next levels), compute resulting level and remaining xp.
    This treats xp as a "bank" that can roll over.
    Returns: (new_level, remaining_xp_after_levelups)
    """
    level = current_level
    xp_bank = current_xp
    while True:
        need = curve.xp_to_next(level)
        if xp_bank >= need:
            xp_bank -= need
            level += 1
        else:
            break
    return level, xp_bank


def grant_xp_and_level(
    character: Character,
    amount: int,
    curve: XPCurveExponential,
    stat_rule: StatPointRule,
    class_def: ClassDefinition,
) -> Tuple[List[SystemMessage], List[EventLogEntry]]:
    """
    Apply XP gain, handle level ups, award stat points and class bonuses.
    Return generated SystemMessages + event log entries (seq filled by app layer).
    """
    if amount <= 0:
        return [], []

    old_level = character.level
    character.xp += amount

    new_level, remaining_xp = compute_level_from_xp(character.level, character.xp, curve)
    character.level = new_level
    character.xp = remaining_xp

    messages: List[SystemMessage] = []
    events: List[EventLogEntry] = []

    # XP gain log
    events.append(EventLogEntry(
        seq=0,
        ts=utcnow(),
        actor="system",
        kind="xp.granted",
        payload={"character_id": character.id, "amount": amount, "old_level": old_level, "new_level": new_level}
    ))

    if new_level > old_level:
        # award stat points
        gained_pts = stat_rule.points_for_range(old_level, new_level)
        character.unspent_stat_points += gained_pts

        # apply class per-level stat bonus
        class_def.per_level_bonus.apply_for_levels(character.stats, old_level, new_level)

        # level up events/messages
        for L in range(old_level + 1, new_level + 1):
            pts_L = stat_rule.points_on_level(L)
            events.append(EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor="system",
                kind="level.up",
                payload={
                    "character_id": character.id,
                    "new_level": L,
                    "stat_points_gained": pts_L,
                }
            ))
            messages.append(SystemMessage(
                id=new_id("msg"),
                created_at=utcnow(),
                severity=MessageSeverity.alert,
                title="LEVEL UP",
                body=f"Достигнут уровень {L}. Получено очков характеристик: {pts_L}.",
                collapsible=False,
                choices=[],
                sound=MessageSeverity.alert,
                effect="level_up",
            ))

    return messages, events


def can_equip_item(class_def: ClassDefinition, tpl: ItemTemplate, slot: EquipmentSlot) -> bool:
    if class_def.allowed_item_types and tpl.item_type not in class_def.allowed_item_types:
        return False
    if class_def.allowed_slots and slot not in class_def.allowed_slots:
        return False
    if tpl.equip_slots and slot not in tpl.equip_slots:
        return False
    return True


def equip_item(
    character: Character,
    class_def: ClassDefinition,
    templates: Dict[str, ItemTemplate],
    item_instance_id: str,
    slot: EquipmentSlot,
) -> List[EventLogEntry]:
    """
    Equip an item instance into a slot.
    Two-handed weapons occupy both weapon slots.
    This function does not mutate abilities; app layer should recalc derived abilities from equipment.
    """
    inst = character.inventory.get(item_instance_id)
    if not inst:
        raise EquipError("Item instance not found in inventory")

    tpl = templates.get(inst.template_id)
    if not tpl:
        raise EquipError("Item template not found")

    if not can_equip_item(class_def, tpl, slot):
        raise EquipError("Class restrictions or slot incompatibility")

    # Two-handed logic
    if tpl.item_type == ItemType.weapon and tpl.two_handed:
        if slot not in (EquipmentSlot.weapon_1, EquipmentSlot.weapon_2):
            raise EquipError("Two-handed weapon must be equipped in a weapon slot")
        # occupy both
        character.equipment.slots[EquipmentSlot.weapon_1] = inst.id
        character.equipment.slots[EquipmentSlot.weapon_2] = inst.id
    else:
        # if equipping one-handed into a weapon slot, and currently two-handed is equipped, clear both
        if slot in (EquipmentSlot.weapon_1, EquipmentSlot.weapon_2):
            other_slot = EquipmentSlot.weapon_2 if slot == EquipmentSlot.weapon_1 else EquipmentSlot.weapon_1
            cur = character.equipment.slots.get(slot)
            other = character.equipment.slots.get(other_slot)
            if cur and other and cur == other:
                # currently a two-handed occupies both slots; unequip it from both
                character.equipment.slots[EquipmentSlot.weapon_1] = None
                character.equipment.slots[EquipmentSlot.weapon_2] = None

        character.equipment.slots[slot] = inst.id

    return [EventLogEntry(
        seq=0,
        ts=utcnow(),
        actor="system",
        kind="equipment.equipped",
        payload={"character_id": character.id, "item_instance_id": inst.id, "template_id": tpl.id, "slot": slot.value}
    )]


def ensure_quest_not_duplicated(active_quests: List[QuestInstance], template_id: str) -> None:
    for q in active_quests:
        if q.template_id == template_id and q.status == QuestStatus.active:
            raise QuestError("Quest template already active; cannot duplicate")


def choose_message_option(msg: SystemMessage, option_id: str) -> None:
    if not msg.choices:
        raise DomainError("Not a choice message")
    if msg.chosen_option_id is not None:
        raise DomainError("Choice already made")
    if option_id not in [c.id for c in msg.choices]:
        raise DomainError("Unknown choice option")
    msg.chosen_option_id = option_id
    # UI will collapse partially after choice; full content remains in history


# ---------------------------
# Derivations (agent should expand)
# ---------------------------

def derive_equipment_stat_mods(
    character: Character,
    templates: Dict[str, ItemTemplate]
) -> Dict[str, int]:
    """
    Aggregate stat mods from equipped items.
    NOTE: if two-handed occupies both slots, it should only apply once.
    """
    mods: Dict[str, int] = {}
    seen: set[str] = set()
    for slot, inst_id in character.equipment.slots.items():
        if not inst_id:
            continue
        if inst_id in seen:
            continue
        seen.add(inst_id)
        inst = character.inventory.get(inst_id)
        if not inst:
            continue
        tpl = templates.get(inst.template_id)
        if not tpl:
            continue
        for k, v in tpl.stat_mods.items():
            mods[k] = int(mods.get(k, 0)) + int(v)
    return mods


def derive_equipment_granted_abilities(
    character: Character,
    templates: Dict[str, ItemTemplate],
    all_abilities: Dict[str, Ability],
    category_id_for_equipment: str,
) -> Dict[str, Ability]:
    """
    Produce abilities granted by currently equipped items.
    Abilities are returned as a dict of ability_id -> Ability clone, with source annotated.
    """
    granted: Dict[str, Ability] = {}
    seen_items: set[str] = set()
    for slot, inst_id in character.equipment.slots.items():
        if not inst_id or inst_id in seen_items:
            continue
        seen_items.add(inst_id)
        inst = character.inventory.get(inst_id)
        if not inst:
            continue
        tpl = templates.get(inst.template_id)
        if not tpl:
            continue
        for ab_id in tpl.granted_ability_ids:
            base = all_abilities.get(ab_id)
            if not base:
                continue
            granted[ab_id] = Ability(
                id=base.id,
                name=base.name,
                description=base.description,
                category_id=category_id_for_equipment,
                active=base.active,
                hidden=base.hidden,
                cooldown_s=base.cooldown_s,
                cost=base.cost,
                source=f"item:{tpl.id}",
            )
    return granted


# ---------------------------
# Notes for the agent
# ---------------------------
"""
Agent TODO:
- Split models/rules/services into modules.
- Add persistence interfaces and event sequencing.
- Add permission checks and player request workflow.
- Implement "freeze all actions" toggles and "disable abilities" global switch.
- Implement chat messenger + friend requests controlled by Host.
- Implement link cards in chat messages (quest/item/entity).
- Implement message collapsing, history, and 3 audio channels.
- Add export/import, versioning, migrations.
- Add unit tests for:
  - XP curve and level-up points
  - two-handed weapon equip behavior
  - quest duplication guard
"""
