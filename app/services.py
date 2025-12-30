from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from typing import List, Optional

from domain.errors import DomainError, QuestError
from domain.events import EventKind, EventLogEntry
from domain.helpers import new_id, utcnow
from domain.models import (
    CampaignState,
    Ability,
    ChatContact,
    ChatMessage,
    ChatThread,
    ClassDefinition,
    EquipmentSlot,
    FriendRequest,
    ItemInstance,
    MessageSeverity,
    QuestInstance,
    QuestStatus,
    SystemMessage,
    chat_link_from_dict,
    chat_link_to_dict,
)
from domain.services import (
    choose_message_option,
    ensure_quest_not_duplicated,
    equip_item as equip_item_domain,
    grant_xp_and_level,
)
from domain.rules import StatPointRule, XPCurveExponential

from .permissions import (
    HOST_ROLE,
    PLAYER_ROLE,
    ensure_host,
    ensure_player,
    ensure_player_can_act,
)


@dataclass
class CampaignService:
    state: CampaignState

    def grant_xp(self, amount: int, actor_role: str = HOST_ROLE) -> List[EventLogEntry]:
        ensure_host(actor_role)
        class_def = self._get_class_def()
        messages, events = grant_xp_and_level(
            self.state.character,
            amount,
            self.state.settings.xp_curve,
            self.state.settings.stat_rule,
            class_def,
        )
        if messages:
            self.state.system_messages.extend(messages)
            events.extend(self._events_for_messages(messages, actor_role))
        return events

    def update_settings(
        self,
        base_xp: int,
        growth_rate: float,
        base_per_level: int,
        bonus_every_5: int,
        bonus_every_10: int,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        self.state.settings.xp_curve = XPCurveExponential(
            base_xp=base_xp,
            growth_rate=growth_rate,
        )
        self.state.settings.stat_rule = StatPointRule(
            base_per_level=base_per_level,
            bonus_every_5=bonus_every_5,
            bonus_every_10=bonus_every_10,
        )
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.settings_updated.value,
                payload={
                    "xp_curve": {
                        "base_xp": base_xp,
                        "growth_rate": growth_rate,
                    },
                    "stat_rule": {
                        "base_per_level": base_per_level,
                        "bonus_every_5": bonus_every_5,
                        "bonus_every_10": bonus_every_10,
                    },
                },
            )
        ]

    def add_item_instance(
        self,
        template_id: str,
        qty: int = 1,
        custom_name: Optional[str] = None,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        inst = ItemInstance(
            id=new_id("item"),
            template_id=template_id,
            qty=qty,
            custom_name=custom_name,
        )
        self.state.character.inventory.add(inst)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.inventory_added.value,
                payload={
                    "character_id": self.state.character.id,
                    "item_instance_id": inst.id,
                    "template_id": template_id,
                    "qty": qty,
                },
            )
        ]

    def remove_item_instance(
        self, item_instance_id: str, actor_role: str = HOST_ROLE
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        before_slots = dict(self.state.character.equipment.slots)
        self._unequip_if_equipped(item_instance_id)
        unequip_events = self._build_unequip_events(
            before_slots, self.state.character.equipment.slots, actor_role
        )
        self.state.character.inventory.remove(item_instance_id)
        return unequip_events + [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.inventory_removed.value,
                payload={
                    "character_id": self.state.character.id,
                    "item_instance_id": item_instance_id,
                },
            )
        ]

    def equip_item(
        self,
        item_instance_id: str,
        slot: EquipmentSlot,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        class_def = self._get_class_def()
        before_slots = dict(self.state.character.equipment.slots)
        events = equip_item_domain(
            self.state.character,
            class_def,
            self.state.item_templates,
            item_instance_id,
            slot,
        )
        unequip_events = self._build_unequip_events(
            before_slots, self.state.character.equipment.slots, actor_role
        )
        return unequip_events + events

    def request_equip_item(
        self,
        item_instance_id: str,
        slot: EquipmentSlot,
        actor_role: str = PLAYER_ROLE,
    ) -> List[EventLogEntry]:
        ensure_player(actor_role)
        ensure_player_can_act(self.state.character)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.equipment_requested.value,
                payload={
                    "character_id": self.state.character.id,
                    "item_instance_id": item_instance_id,
                    "slot": slot.value,
                },
            )
        ]

    def assign_quest_from_template(
        self, template_id: str, actor_role: str = HOST_ROLE
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        template = self.state.quest_templates.get(template_id)
        if not template:
            raise QuestError("Quest template not found")
        ensure_quest_not_duplicated(self.state.active_quests, template_id)
        objectives = [deepcopy(obj) for obj in template.objectives]
        quest = QuestInstance(
            id=new_id("quest"),
            template_id=template_id,
            status=QuestStatus.active,
            objectives=objectives,
            started_at=utcnow(),
        )
        self.state.active_quests.append(quest)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.quest_assigned.value,
                payload={
                    "character_id": self.state.character.id,
                    "quest_id": quest.id,
                    "template_id": template_id,
                    "quest": quest.to_dict(),
                },
            )
        ]

    def update_quest_status(
        self,
        quest_id: str,
        new_status: QuestStatus,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        quest = self._get_active_quest(quest_id)
        quest.status = new_status
        if new_status in (QuestStatus.completed, QuestStatus.failed):
            quest.completed_at = utcnow()
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.quest_status.value,
                payload={
                    "character_id": self.state.character.id,
                    "quest_id": quest.id,
                    "status": new_status.value,
                    "quest": quest.to_dict(),
                },
            )
        ]

    def send_system_message(
        self,
        title: str,
        body: str,
        severity: MessageSeverity = MessageSeverity.info,
        collapsible: bool = True,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        msg = SystemMessage(
            id=new_id("msg"),
            created_at=utcnow(),
            severity=severity,
            title=title,
            body=body,
            collapsible=collapsible,
            sound=severity,
        )
        self.state.system_messages.append(msg)
        return self._events_for_messages([msg], actor_role)

    def choose_message_option(
        self,
        message_id: str,
        option_id: str,
        actor_role: str = PLAYER_ROLE,
    ) -> List[EventLogEntry]:
        ensure_player(actor_role)
        ensure_player_can_act(self.state.character)
        msg = self._find_message(message_id)
        choose_message_option(msg, option_id)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.message_choice.value,
                payload={
                    "character_id": self.state.character.id,
                    "message_id": msg.id,
                    "option_id": option_id,
                    "chosen_option_id": msg.chosen_option_id,
                    "message": msg.to_dict(),
                },
            )
        ]

    def freeze_player(self, frozen: bool, actor_role: str = HOST_ROLE) -> List[EventLogEntry]:
        ensure_host(actor_role)
        self.state.character.frozen = frozen
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.player_frozen.value,
                payload={
                    "character_id": self.state.character.id,
                    "frozen": frozen,
                },
            )
        ]

    def update_currency(
        self, currency_id: str, value: int, actor_role: str = HOST_ROLE
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        old_value = int(self.state.character.currencies.get(currency_id, 0))
        self.state.character.currencies[currency_id] = int(value)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.currency_updated.value,
                payload={
                    "character_id": self.state.character.id,
                    "currency_id": currency_id,
                    "old_value": old_value,
                    "new_value": int(value),
                    "delta": int(value) - old_value,
                },
            )
        ]

    def update_resource(
        self,
        resource_id: str,
        current: int,
        maximum: int,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        old_current, old_max = self.state.character.resources.get(resource_id, (0, 0))
        self.state.character.resources[resource_id] = (int(current), int(maximum))
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.resource_updated.value,
                payload={
                    "character_id": self.state.character.id,
                    "resource_id": resource_id,
                    "old_current": int(old_current),
                    "old_max": int(old_max),
                    "current": int(current),
                    "max": int(maximum),
                    "delta": int(current) - int(old_current),
                },
            )
        ]

    def update_reputation(
        self, reputation_id: str, value: int, actor_role: str = HOST_ROLE
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        old_value = int(self.state.character.reputations.get(reputation_id, 0))
        self.state.character.reputations[reputation_id] = int(value)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.reputation_updated.value,
                payload={
                    "character_id": self.state.character.id,
                    "reputation_id": reputation_id,
                    "old_value": old_value,
                    "new_value": int(value),
                    "delta": int(value) - old_value,
                },
            )
        ]

    def upsert_ability(
        self,
        ability: Ability,
        scope: str = "character",
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        target = self._get_ability_target(scope)
        kind = (
            EventKind.ability_updated.value
            if ability.id in target
            else EventKind.ability_added.value
        )
        target[ability.id] = ability
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=kind,
                payload={
                    "character_id": self.state.character.id,
                    "scope": scope,
                    "ability_id": ability.id,
                    "ability": self._serialize_ability(ability),
                },
            )
        ]

    def remove_ability(
        self, ability_id: str, scope: str = "character", actor_role: str = HOST_ROLE
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        target = self._get_ability_target(scope)
        target.pop(ability_id, None)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.ability_removed.value,
                payload={
                    "character_id": self.state.character.id,
                    "scope": scope,
                    "ability_id": ability_id,
                },
            )
        ]

    def add_chat_contact(
        self,
        display_name: str,
        link_payload: Optional[dict] = None,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        contact = ChatContact(
            id=new_id("contact"),
            display_name=display_name,
            link_payload=link_payload or {},
        )
        self.state.contacts[contact.id] = contact
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.chat_contact_added.value,
                payload={
                    "contact_id": contact.id,
                    "display_name": contact.display_name,
                },
            )
        ]

    def send_friend_request(
        self,
        contact_id: str,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        ensure_host(actor_role)
        if contact_id not in self.state.contacts:
            raise DomainError("Chat contact not found")
        has_pending_request = any(
            request.contact_id == contact_id and not request.accepted
            for request in self.state.friend_requests.values()
        )
        if has_pending_request:
            raise DomainError("Friend request already pending for this contact")
        has_open_chat = any(
            chat.contact_id == contact_id and chat.opened
            for chat in self.state.chats.values()
        )
        if has_open_chat:
            raise DomainError("Chat with this contact already opened")
        request = FriendRequest(
            id=new_id("req"),
            contact_id=contact_id,
            created_at=utcnow(),
        )
        self.state.friend_requests[request.id] = request
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.chat_friend_request_sent.value,
                payload={
                    "request_id": request.id,
                    "contact_id": contact_id,
                },
            )
        ]

    def accept_friend_request(
        self,
        request_id: str,
        actor_role: str = PLAYER_ROLE,
    ) -> List[EventLogEntry]:
        ensure_player(actor_role)
        ensure_player_can_act(self.state.character)
        request = self.state.friend_requests.get(request_id)
        if not request:
            raise DomainError("Friend request not found")
        if request.accepted:
            raise DomainError("Friend request already accepted")
        request.accepted = True
        request.accepted_at = utcnow()
        chat = self._get_or_create_chat_thread(request.contact_id)
        chat.opened = True
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.chat_friend_request_accepted.value,
                payload={
                    "request_id": request.id,
                    "contact_id": request.contact_id,
                    "chat_id": chat.id,
                },
            )
        ]

    def send_chat_message(
        self,
        chat_id: str,
        text: str,
        links: Optional[List[dict]] = None,
        sender_contact_id: Optional[str] = None,
        actor_role: str = HOST_ROLE,
    ) -> List[EventLogEntry]:
        if actor_role == HOST_ROLE:
            ensure_host(actor_role)
        else:
            ensure_player(actor_role)
            ensure_player_can_act(self.state.character)
        chat = self.state.chats.get(chat_id)
        if not chat:
            raise DomainError("Chat thread not found")
        if actor_role == PLAYER_ROLE:
            sender_id = self.state.character.id
        else:
            if not sender_contact_id:
                raise DomainError("Sender contact required")
            if sender_contact_id not in self.state.contacts:
                raise DomainError("Sender contact not found")
            if sender_contact_id != chat.contact_id:
                raise DomainError("Sender does not match chat contact")
            sender_id = sender_contact_id
        if actor_role == PLAYER_ROLE and not chat.opened:
            raise DomainError("Chat thread is not open yet")
        normalized_links = [chat_link_from_dict(link) for link in links or []]
        message = ChatMessage(
            id=new_id("chatmsg"),
            chat_id=chat_id,
            sender_contact_id=sender_id,
            text=text,
            created_at=utcnow(),
            links=normalized_links,
        )
        chat.messages.append(message)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind=EventKind.chat_message.value,
                payload={
                    "chat_id": chat_id,
                    "message_id": message.id,
                    "sender_contact_id": sender_id,
                    "text": text,
                    "links": [chat_link_to_dict(link) for link in normalized_links],

                },
            )
        ]

    def _get_class_def(self) -> ClassDefinition:
        class_def = self.state.classes.get(self.state.character.class_id)
        if not class_def:
            raise DomainError("Class definition not found")
        return class_def

    def _get_active_quest(self, quest_id: str) -> QuestInstance:
        for quest in self.state.active_quests:
            if quest.id == quest_id:
                return quest
        raise QuestError("Quest instance not found")

    def _find_message(self, message_id: str) -> SystemMessage:
        for msg in self.state.system_messages:
            if msg.id == message_id:
                return msg
        raise DomainError("Message not found")

    def _unequip_if_equipped(self, item_instance_id: str) -> None:
        slots = self.state.character.equipment.slots
        for slot, inst_id in list(slots.items()):
            if inst_id == item_instance_id:
                slots[slot] = None

    def _events_for_messages(
        self, messages: List[SystemMessage], actor_role: str
    ) -> List[EventLogEntry]:
        events = []
        for msg in messages:
            events.append(
                EventLogEntry(
                    seq=0,
                    ts=utcnow(),
                    actor=actor_role,
                    kind=EventKind.message_sent.value,
                    payload={
                        "character_id": self.state.character.id,
                        "message_id": msg.id,
                        "title": msg.title,
                        "message": msg.to_dict(),
                    },
                )
            )
        return events

    def _build_unequip_events(
        self,
        before_slots: dict[EquipmentSlot, Optional[str]],
        after_slots: dict[EquipmentSlot, Optional[str]],
        actor_role: str,
    ) -> List[EventLogEntry]:
        events: List[EventLogEntry] = []
        for slot, before_id in before_slots.items():
            after_id = after_slots.get(slot)
            if before_id and before_id != after_id:
                events.append(
                    EventLogEntry(
                        seq=0,
                        ts=utcnow(),
                        actor=actor_role,
                        kind=EventKind.equipment_unequipped.value,
                        payload={
                            "character_id": self.state.character.id,
                            "item_instance_id": before_id,
                            "slot": slot.value,
                        },
                    )
                )
        return events

    def _get_or_create_chat_thread(self, contact_id: str) -> ChatThread:
        for chat in self.state.chats.values():
            if chat.contact_id == contact_id:
                return chat
        chat = ChatThread(id=new_id("chat"), contact_id=contact_id, opened=False)
        self.state.chats[chat.id] = chat
        return chat

    def _get_ability_target(self, scope: str) -> dict:
        if scope == "library":
            return self.state.abilities
        if scope == "character":
            if not self.state.character.abilities:
                self.state.character.abilities = {}
            return self.state.character.abilities
        raise DomainError("Unknown ability scope")

    @staticmethod
    def _serialize_ability(ability: Ability) -> dict:
        return {
            "id": ability.id,
            "name": ability.name,
            "description": ability.description,
            "category_id": ability.category_id,
            "active": ability.active,
            "hidden": ability.hidden,
            "cooldown_s": ability.cooldown_s,
            "cost": ability.cost,
            "source": ability.source,
        }
