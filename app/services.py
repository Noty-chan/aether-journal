from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from typing import List, Optional

from domain.errors import DomainError, QuestError
from domain.events import EventLogEntry
from domain.helpers import new_id, utcnow
from domain.models import (
    CampaignState,
    ClassDefinition,
    EquipmentSlot,
    ItemInstance,
    MessageSeverity,
    QuestInstance,
    QuestStatus,
    SystemMessage,
)
from domain.services import (
    choose_message_option,
    ensure_quest_not_duplicated,
    equip_item as equip_item_domain,
    grant_xp_and_level,
)

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
                kind="inventory.added",
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
        self._unequip_if_equipped(item_instance_id)
        self.state.character.inventory.remove(item_instance_id)
        return [
            EventLogEntry(
                seq=0,
                ts=utcnow(),
                actor=actor_role,
                kind="inventory.removed",
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
        return equip_item_domain(
            self.state.character,
            class_def,
            self.state.item_templates,
            item_instance_id,
            slot,
        )

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
                kind="equipment.requested",
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
                kind="quest.assigned",
                payload={
                    "character_id": self.state.character.id,
                    "quest_id": quest.id,
                    "template_id": template_id,
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
                kind="quest.status",
                payload={
                    "character_id": self.state.character.id,
                    "quest_id": quest.id,
                    "status": new_status.value,
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
                kind="message.choice",
                payload={
                    "character_id": self.state.character.id,
                    "message_id": msg.id,
                    "option_id": option_id,
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
                kind="player.freeze",
                payload={
                    "character_id": self.state.character.id,
                    "frozen": frozen,
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
                    kind="message.sent",
                    payload={
                        "character_id": self.state.character.id,
                        "message_id": msg.id,
                        "title": msg.title,
                    },
                )
            )
        return events
