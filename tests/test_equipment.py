import pytest

from domain.errors import EquipError
from domain.models import (
    Character,
    ClassDefinition,
    EquipmentSlot,
    InventoryState,
    ItemInstance,
    ItemTemplate,
    ItemType,
)
from domain.rules import ClassPerLevelBonus
from domain.services import equip_item


def _build_character():
    return Character(id="char_1", name="Hero", class_id="fighter")


def _build_class():
    return ClassDefinition(
        id="fighter",
        name="Fighter",
        allowed_item_types=[ItemType.weapon],
        allowed_slots=[EquipmentSlot.weapon_1, EquipmentSlot.weapon_2],
        per_level_bonus=ClassPerLevelBonus(),
    )


def test_two_handed_equips_both_slots():
    character = _build_character()
    class_def = _build_class()

    template = ItemTemplate(
        id="greatsword",
        name="Greatsword",
        item_type=ItemType.weapon,
        two_handed=True,
        equip_slots=[EquipmentSlot.weapon_1, EquipmentSlot.weapon_2],
    )
    instance = ItemInstance(id="item_1", template_id=template.id)
    character.inventory.add(instance)

    equip_item(character, class_def, {template.id: template}, instance.id, EquipmentSlot.weapon_1)

    assert character.equipment.slots[EquipmentSlot.weapon_1] == instance.id
    assert character.equipment.slots[EquipmentSlot.weapon_2] == instance.id


def test_one_handed_clears_two_handed():
    character = _build_character()
    class_def = _build_class()

    two_handed = ItemTemplate(
        id="greatsword",
        name="Greatsword",
        item_type=ItemType.weapon,
        two_handed=True,
        equip_slots=[EquipmentSlot.weapon_1, EquipmentSlot.weapon_2],
    )
    one_handed = ItemTemplate(
        id="shortsword",
        name="Shortsword",
        item_type=ItemType.weapon,
        two_handed=False,
        equip_slots=[EquipmentSlot.weapon_1, EquipmentSlot.weapon_2],
    )

    big = ItemInstance(id="item_1", template_id=two_handed.id)
    small = ItemInstance(id="item_2", template_id=one_handed.id)
    character.inventory.add(big)
    character.inventory.add(small)

    equip_item(character, class_def, {two_handed.id: two_handed}, big.id, EquipmentSlot.weapon_1)
    equip_item(
        character,
        class_def,
        {two_handed.id: two_handed, one_handed.id: one_handed},
        small.id,
        EquipmentSlot.weapon_1,
    )

    assert character.equipment.slots[EquipmentSlot.weapon_1] == small.id
    assert character.equipment.slots[EquipmentSlot.weapon_2] is None


def test_invalid_slot_for_two_handed():
    character = _build_character()
    class_def = _build_class()

    template = ItemTemplate(
        id="greatsword",
        name="Greatsword",
        item_type=ItemType.weapon,
        two_handed=True,
        equip_slots=[EquipmentSlot.weapon_1],
    )
    instance = ItemInstance(id="item_1", template_id=template.id)
    character.inventory.add(instance)

    with pytest.raises(EquipError):
        equip_item(character, class_def, {template.id: template}, instance.id, EquipmentSlot.head)
