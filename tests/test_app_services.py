import pytest

from app.permissions import PLAYER_ROLE
from app.services import CampaignService
from domain.errors import QuestError
from domain.models import EquipmentSlot, ItemInstance, ItemTemplate, ItemType, Objective, QuestTemplate
from storage.json_repo import create_default_campaign_state


def test_assign_quest_prevents_duplicate():
    state = create_default_campaign_state()
    template = QuestTemplate(
        id="quest_tpl",
        name="Test Quest",
        objectives=[Objective(id="obj_1", text="Do thing")],
    )
    state.quest_templates[template.id] = template
    service = CampaignService(state)

    service.assign_quest_from_template(template.id)

    with pytest.raises(QuestError):
        service.assign_quest_from_template(template.id)


def test_request_equip_item_does_not_mutate():
    state = create_default_campaign_state()
    template = ItemTemplate(
        id="sword_tpl",
        name="Sword",
        item_type=ItemType.weapon,
        equip_slots=[EquipmentSlot.weapon_1, EquipmentSlot.weapon_2],
    )
    state.item_templates[template.id] = template
    instance = ItemInstance(id="item_1", template_id=template.id)
    state.character.inventory.add(instance)
    service = CampaignService(state)

    events = service.request_equip_item(
        item_instance_id=instance.id,
        slot=EquipmentSlot.weapon_1,
        actor_role=PLAYER_ROLE,
    )

    assert events[0].kind == "equipment.requested"
    assert state.character.equipment.slots[EquipmentSlot.weapon_1] is None
