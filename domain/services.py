from __future__ import annotations

from typing import Dict, List, Tuple

from .errors import DomainError, EquipError, QuestError
from .events import EventKind, EventLogEntry
from .helpers import new_id, utcnow
from .models import (
    Ability,
    Character,
    ClassDefinition,
    EquipmentSlot,
    ItemTemplate,
    ItemType,
    MessageSeverity,
    QuestInstance,
    QuestStatus,
    SystemMessage,
)
from .rules import StatPointRule, XPCurveExponential


def compute_level_from_xp(
    current_level: int, current_xp: int, curve: XPCurveExponential
) -> Tuple[int, int]:
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
    if amount <= 0:
        return [], []

    old_level = character.level
    character.xp += amount

    new_level, remaining_xp = compute_level_from_xp(character.level, character.xp, curve)
    character.level = new_level
    character.xp = remaining_xp

    messages: List[SystemMessage] = []
    events: List[EventLogEntry] = []

    events.append(
        EventLogEntry(
            seq=0,
            ts=utcnow(),
            actor="system",
            kind=EventKind.xp_granted.value,
            payload={
                "character_id": character.id,
                "amount": amount,
                "old_level": old_level,
                "new_level": new_level,
            },
        )
    )

    if new_level > old_level:
        gained_pts = stat_rule.points_for_range(old_level, new_level)
        character.unspent_stat_points += gained_pts

        class_def.per_level_bonus.apply_for_levels(character.stats, old_level, new_level)

        for level in range(old_level + 1, new_level + 1):
            pts_level = stat_rule.points_on_level(level)
            events.append(
                EventLogEntry(
                    seq=0,
                    ts=utcnow(),
                    actor="system",
                    kind=EventKind.level_up.value,
                    payload={
                        "character_id": character.id,
                        "new_level": level,
                        "stat_points_gained": pts_level,
                    },
                )
            )
            messages.append(
                SystemMessage(
                    id=new_id("msg"),
                    created_at=utcnow(),
                    severity=MessageSeverity.alert,
                    title="LEVEL UP",
                    body=(
                        f"Достигнут уровень {level}. Получено очков характеристик: {pts_level}."
                    ),
                    collapsible=False,
                    choices=[],
                    sound=MessageSeverity.alert,
                    effect="level_up",
                )
            )

    return messages, events


def grant_levels(
    character: Character,
    levels: int,
    stat_rule: StatPointRule,
    class_def: ClassDefinition,
) -> Tuple[List[SystemMessage], List[EventLogEntry]]:
    if levels <= 0:
        return [], []

    old_level = character.level
    new_level = old_level + levels
    character.level = new_level

    messages: List[SystemMessage] = []
    events: List[EventLogEntry] = []

    gained_pts = stat_rule.points_for_range(old_level, new_level)
    character.unspent_stat_points += gained_pts

    class_def.per_level_bonus.apply_for_levels(character.stats, old_level, new_level)

    for level in range(old_level + 1, new_level + 1):
        pts_level = stat_rule.points_on_level(level)
        events.append(
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor="system",
                kind=EventKind.level_up.value,
                payload={
                    "character_id": character.id,
                    "new_level": level,
                    "stat_points_gained": pts_level,
                },
            )
        )
        messages.append(
            SystemMessage(
                id=new_id("msg"),
                created_at=utcnow(),
                severity=MessageSeverity.alert,
                title="LEVEL UP",
                body=(
                    f"Достигнут уровень {level}. Получено очков характеристик: {pts_level}."
                ),
                collapsible=False,
                choices=[],
                sound=MessageSeverity.alert,
                effect="level_up",
            )
        )

    return messages, events



def can_equip_item(
    class_def: ClassDefinition, tpl: ItemTemplate, slot: EquipmentSlot
) -> bool:
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
    inst = character.inventory.get(item_instance_id)
    if not inst:
        raise EquipError("Item instance not found in inventory")

    tpl = templates.get(inst.template_id)
    if not tpl:
        raise EquipError("Item template not found")

    if not can_equip_item(class_def, tpl, slot):
        raise EquipError("Class restrictions or slot incompatibility")

    if tpl.item_type == ItemType.weapon and tpl.two_handed:
        if slot not in (EquipmentSlot.weapon_1, EquipmentSlot.weapon_2):
            raise EquipError("Two-handed weapon must be equipped in a weapon slot")
        character.equipment.slots[EquipmentSlot.weapon_1] = inst.id
        character.equipment.slots[EquipmentSlot.weapon_2] = inst.id
    else:
        if slot in (EquipmentSlot.weapon_1, EquipmentSlot.weapon_2):
            other_slot = (
                EquipmentSlot.weapon_2
                if slot == EquipmentSlot.weapon_1
                else EquipmentSlot.weapon_1
            )
            cur = character.equipment.slots.get(slot)
            other = character.equipment.slots.get(other_slot)
            if cur and other and cur == other:
                character.equipment.slots[EquipmentSlot.weapon_1] = None
                character.equipment.slots[EquipmentSlot.weapon_2] = None

        character.equipment.slots[slot] = inst.id

    return [
        EventLogEntry(
            seq=0,
            ts=utcnow(),
            actor="system",
            kind=EventKind.equipment_equipped.value,
            payload={
                "character_id": character.id,
                "item_instance_id": inst.id,
                "template_id": tpl.id,
                "slot": slot.value,
            },
        )
    ]



def ensure_quest_not_duplicated(
    active_quests: List[QuestInstance], template_id: str
) -> None:
    for quest in active_quests:
        if quest.template_id == template_id and quest.status == QuestStatus.active:
            raise QuestError("Quest template already active; cannot duplicate")



def choose_message_option(msg: SystemMessage, option_id: str) -> None:
    if not msg.choices:
        raise DomainError("Not a choice message")
    if msg.chosen_option_id is not None:
        raise DomainError("Choice already made")
    if option_id not in [choice.id for choice in msg.choices]:
        raise DomainError("Unknown choice option")
    msg.chosen_option_id = option_id



def derive_equipment_stat_mods(
    character: Character, templates: Dict[str, ItemTemplate]
) -> Dict[str, int]:
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
        for key, value in tpl.stat_mods.items():
            mods[key] = int(mods.get(key, 0)) + int(value)
    return mods



def derive_equipment_granted_abilities(
    character: Character,
    templates: Dict[str, ItemTemplate],
    all_abilities: Dict[str, Ability],
    category_id_for_equipment: str,
) -> Dict[str, Ability]:
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
        for ability_id in tpl.granted_ability_ids:
            base = all_abilities.get(ability_id)
            if not base:
                continue
            granted[ability_id] = Ability(
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
