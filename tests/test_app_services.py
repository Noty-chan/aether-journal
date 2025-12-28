import pytest

from app.permissions import PLAYER_ROLE
from app.services import CampaignService
from domain.errors import QuestError
from domain.errors import DomainError
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


def test_friend_request_accept_creates_chat():
    state = create_default_campaign_state()
    service = CampaignService(state)

    contact_events = service.add_chat_contact(display_name="NPC")
    contact_id = contact_events[0].payload["contact_id"]

    request_events = service.send_friend_request(contact_id=contact_id)
    request_id = request_events[0].payload["request_id"]

    accept_events = service.accept_friend_request(request_id=request_id, actor_role=PLAYER_ROLE)

    assert accept_events[0].kind == "chat.friend_request.accepted"
    assert state.friend_requests[request_id].accepted is True
    chat_id = accept_events[0].payload["chat_id"]
    assert chat_id in state.chats
    assert state.chats[chat_id].opened is True


def test_host_chat_message_requires_contact():
    state = create_default_campaign_state()
    service = CampaignService(state)

    contact_events = service.add_chat_contact(display_name="NPC")
    contact_id = contact_events[0].payload["contact_id"]
    request_events = service.send_friend_request(contact_id=contact_id)
    request_id = request_events[0].payload["request_id"]
    accept_events = service.accept_friend_request(request_id=request_id, actor_role=PLAYER_ROLE)
    chat_id = accept_events[0].payload["chat_id"]

    with pytest.raises(DomainError):
        service.send_chat_message(chat_id=chat_id, text="Hi", actor_role="host")

    events = service.send_chat_message(
        chat_id=chat_id,
        text="Hello",
        sender_contact_id=contact_id,
        actor_role="host",
    )

    assert events[0].kind == "chat.message"
    assert state.chats[chat_id].messages[0].text == "Hello"
