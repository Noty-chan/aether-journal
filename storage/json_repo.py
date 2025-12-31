from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from json import JSONDecodeError
from pathlib import Path
from typing import Any, Dict, List

from domain.events import EventLogEntry
from domain.helpers import new_id, utcnow
from domain.models import (
    Ability,
    AbilityCategory,
    CampaignSettings,
    CampaignState,
    Character,
    ChatContact,
    ChatLink,
    ChatMessage,
    ChatThread,
    ClassDefinition,
    EquipmentSlot,
    EquipmentState,
    FriendRequest,
    InventoryState,
    ItemInstance,
    ItemTemplate,
    ItemType,
    MessageSeverity,
    Objective,
    QuestInstance,
    QuestTemplate,
    Rarity,
    SystemMessage,
    MessageTemplate,
    chat_link_from_dict,
    chat_link_to_dict,
    default_sheet_sections,
    normalize_sheet_sections,
)
from domain.rules import ClassPerLevelBonus, StatPointRule, XPCurveExponential

SCHEMA_VERSION = 1


class JsonCampaignRepository:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    def load(self) -> CampaignState:
        data = self._read_data()
        return deserialize_campaign_state(data["snapshot"])

    def save(self, state: CampaignState) -> None:
        data = self._read_data()
        data["snapshot"] = serialize_campaign_state(state)
        self._write_data(data)

    def append_events(self, events: List[EventLogEntry]) -> List[EventLogEntry]:
        if not events:
            return []
        data = self._read_data()
        last_seq = int(data.get("last_seq", 0))
        for event in events:
            last_seq += 1
            event.seq = last_seq
            data["events"].append(event.to_dict())
        data["last_seq"] = last_seq
        self._write_data(data)
        return events

    def list_events(self, after_seq: int = 0) -> List[EventLogEntry]:
        data = self._read_data()
        events: List[EventLogEntry] = []
        for raw in data.get("events", []):
            event = _safe_event_from_dict(raw)
            if event:
                events.append(event)
        return [event for event in events if event.seq > after_seq]

    def get_last_seq(self) -> int:
        data = self._read_data()
        try:
            return int(data.get("last_seq", 0))
        except (TypeError, ValueError):
            return 0

    def export_data(self) -> Dict[str, Any]:
        return self._read_data()

    def import_data(self, data: Dict[str, Any]) -> None:
        if not isinstance(data, dict):
            raise ValueError("Invalid import payload")
        if "snapshot" not in data or not isinstance(data.get("snapshot"), dict):
            raise ValueError("Missing snapshot")
        normalized = self._ensure_schema(dict(data))
        self._write_data(normalized)

    def export_templates(self) -> Dict[str, Any]:
        data = self._read_data()
        snapshot = data.get("snapshot", {})
        if not isinstance(snapshot, dict):
            snapshot = {}
        return {
            "schema_version": data.get("schema_version", SCHEMA_VERSION),
            "item_templates": _ensure_dict(snapshot.get("item_templates")),
            "quest_templates": _ensure_dict(snapshot.get("quest_templates")),
            "message_templates": _ensure_dict(snapshot.get("message_templates")),
        }

    def import_templates(self, data: Dict[str, Any]) -> None:
        if not isinstance(data, dict):
            raise ValueError("Invalid templates payload")
        store = self._read_data()
        snapshot = store.get("snapshot", {})
        if not isinstance(snapshot, dict):
            snapshot = {}
        snapshot["item_templates"] = _ensure_dict(data.get("item_templates"))
        snapshot["quest_templates"] = _ensure_dict(data.get("quest_templates"))
        snapshot["message_templates"] = _ensure_dict(data.get("message_templates"))
        store["snapshot"] = snapshot
        self._write_data(store)

    def export_log(self) -> Dict[str, Any]:
        data = self._read_data()
        return {
            "schema_version": data.get("schema_version", SCHEMA_VERSION),
            "events": _ensure_list(data.get("events")),
            "last_seq": data.get("last_seq", 0),
        }

    def import_log(self, data: Dict[str, Any]) -> None:
        if not isinstance(data, dict):
            raise ValueError("Invalid log payload")
        store = self._read_data()
        events = [event for event in _ensure_list(data.get("events")) if isinstance(event, dict)]
        last_seq = data.get("last_seq")
        try:
            last_seq_value = int(last_seq)
        except (TypeError, ValueError):
            last_seq_value = max(
                (int(event.get("seq", 0)) for event in events if event.get("seq") is not None),
                default=0,
            )
        store["events"] = events
        store["last_seq"] = last_seq_value
        self._write_data(store)

    def export_chats(self) -> Dict[str, Any]:
        data = self._read_data()
        snapshot = data.get("snapshot", {})
        if not isinstance(snapshot, dict):
            snapshot = {}
        return {
            "schema_version": data.get("schema_version", SCHEMA_VERSION),
            "contacts": _ensure_dict(snapshot.get("contacts")),
            "chats": _ensure_dict(snapshot.get("chats")),
            "friend_requests": _ensure_dict(snapshot.get("friend_requests")),
        }

    def import_chats(self, data: Dict[str, Any]) -> None:
        if not isinstance(data, dict):
            raise ValueError("Invalid chats payload")
        store = self._read_data()
        snapshot = store.get("snapshot", {})
        if not isinstance(snapshot, dict):
            snapshot = {}
        snapshot["contacts"] = _ensure_dict(data.get("contacts"))
        snapshot["chats"] = _ensure_dict(data.get("chats"))
        snapshot["friend_requests"] = _ensure_dict(data.get("friend_requests"))
        store["snapshot"] = snapshot
        self._write_data(store)

    def _read_data(self) -> Dict[str, Any]:
        if not self.path.exists():
            data = self._build_default_store()
            self._write_data(data)
            return data
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
        except JSONDecodeError:
            return self._recover_corrupt_store("invalid json")
        if not isinstance(raw, dict):
            return self._recover_corrupt_store("root is not a dict")
        data = self._ensure_schema(raw)
        if "snapshot" not in data or not isinstance(data.get("snapshot"), dict):
            return self._recover_corrupt_store("missing snapshot")
        return data

    def _write_data(self, data: Dict[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def _build_default_store(self) -> Dict[str, Any]:
        state = create_default_campaign_state()
        return {
            "schema_version": SCHEMA_VERSION,
            "snapshot": serialize_campaign_state(state),
            "events": [],
            "last_seq": 0,
        }

    def _recover_corrupt_store(self, reason: str) -> Dict[str, Any]:
        if self.path.exists():
            timestamp = utcnow().strftime("%Y%m%d%H%M%S")
            backup_path = self.path.with_suffix(self.path.suffix + f".corrupt-{timestamp}")
            backup_path.write_text(self.path.read_text(encoding="utf-8"), encoding="utf-8")
        data = self._build_default_store()
        data["recovery_reason"] = reason
        self._write_data(data)
        return data

    def _ensure_schema(self, data: Dict[str, Any]) -> Dict[str, Any]:
        schema_version = data.get("schema_version")
        try:
            schema_version_int = int(schema_version)
        except (TypeError, ValueError):
            schema_version_int = 0
        if schema_version_int < SCHEMA_VERSION:
            data = self._migrate_schema(data, schema_version_int)
        if "events" not in data or not isinstance(data.get("events"), list):
            data["events"] = []
        if "last_seq" not in data:
            data["last_seq"] = 0
        try:
            data["last_seq"] = int(data.get("last_seq", 0))
        except (TypeError, ValueError):
            data["last_seq"] = 0
        data["schema_version"] = SCHEMA_VERSION
        return data

    def _migrate_schema(self, data: Dict[str, Any], from_version: int) -> Dict[str, Any]:
        if from_version < 1:
            if "snapshot" in data and isinstance(data.get("snapshot"), dict):
                snapshot = data["snapshot"]
                settings = snapshot.get("settings")
                if not isinstance(settings, dict):
                    settings = {}
                if "sheet_sections" not in settings:
                    settings["sheet_sections"] = [
                        asdict(section) for section in default_sheet_sections()
                    ]
                snapshot["settings"] = settings
                data["snapshot"] = snapshot
        return data


def create_default_campaign_state() -> CampaignState:
    class_def = ClassDefinition(
        id="adventurer",
        name="Adventurer",
        allowed_item_types=[],
        allowed_slots=[],
        per_level_bonus=ClassPerLevelBonus(),
    )
    equipment_category = AbilityCategory(
        id="equipment",
        name="Экипировка",
    )
    character = Character(
        id=new_id("char"),
        name="Герой",
        class_id=class_def.id,
    )
    settings = CampaignSettings(
        xp_curve=XPCurveExponential(),
        stat_rule=StatPointRule(),
        equipment_category_id=equipment_category.id,
    )
    return CampaignState(
        id=new_id("campaign"),
        character=character,
        classes={class_def.id: class_def},
        ability_categories={equipment_category.id: equipment_category},
        settings=settings,
    )


def serialize_campaign_state(state: CampaignState) -> Dict[str, Any]:
    return {
        "id": state.id,
        "character": serialize_character(state.character),
        "classes": {cid: serialize_class_def(cd) for cid, cd in state.classes.items()},
        "item_templates": {
            tid: serialize_item_template(tpl) for tid, tpl in state.item_templates.items()
        },
        "quest_templates": {
            qid: serialize_quest_template(tpl) for qid, tpl in state.quest_templates.items()
        },
        "message_templates": {
            mid: tpl.to_dict() for mid, tpl in state.message_templates.items()
        },
        "ability_categories": {
            cid: serialize_ability_category(cat)
            for cid, cat in state.ability_categories.items()
        },
        "abilities": {aid: serialize_ability(ab) for aid, ab in state.abilities.items()},
        "active_quests": [quest.to_dict() for quest in state.active_quests],
        "system_messages": [msg.to_dict() for msg in state.system_messages],
        "chats": {cid: serialize_chat_thread(chat) for cid, chat in state.chats.items()},
        "contacts": {
            cid: serialize_chat_contact(contact) for cid, contact in state.contacts.items()
        },
        "friend_requests": {
            rid: serialize_friend_request(req)
            for rid, req in state.friend_requests.items()
        },
        "settings": serialize_campaign_settings(state.settings),
    }


def deserialize_campaign_state(data: Dict[str, Any]) -> CampaignState:
    if not isinstance(data, dict):
        data = {}
    return CampaignState(
        id=str(data.get("id", new_id("campaign"))),
        character=deserialize_character(data.get("character", {})),
        classes={
            cid: deserialize_class_def(cd)
            for cid, cd in data.get("classes", {}).items()
        },
        item_templates={
            tid: deserialize_item_template(tpl)
            for tid, tpl in data.get("item_templates", {}).items()
        },
        quest_templates={
            qid: deserialize_quest_template(tpl)
            for qid, tpl in data.get("quest_templates", {}).items()
        },
        message_templates={
            mid: MessageTemplate.from_dict(tpl)
            for mid, tpl in data.get("message_templates", {}).items()
        },
        ability_categories={
            cid: deserialize_ability_category(cat)
            for cid, cat in data.get("ability_categories", {}).items()
        },
        abilities={
            aid: deserialize_ability(ab)
            for aid, ab in data.get("abilities", {}).items()
        },
        active_quests=[
            QuestInstance.from_dict(quest) for quest in data.get("active_quests", [])
        ],
        system_messages=[
            SystemMessage.from_dict(msg) for msg in data.get("system_messages", [])
        ],
        chats={
            cid: deserialize_chat_thread(chat) for cid, chat in data.get("chats", {}).items()
        },
        contacts={
            cid: deserialize_chat_contact(contact)
            for cid, contact in data.get("contacts", {}).items()
        },
        friend_requests={
            rid: deserialize_friend_request(req)
            for rid, req in data.get("friend_requests", {}).items()
        },
        settings=deserialize_campaign_settings(data.get("settings", {})),
    )


def serialize_campaign_settings(settings: CampaignSettings) -> Dict[str, Any]:
    return {
        "xp_curve": {
            "base_xp": settings.xp_curve.base_xp,
            "growth_rate": settings.xp_curve.growth_rate,
        },
        "stat_rule": asdict(settings.stat_rule),
        "equipment_category_id": settings.equipment_category_id,
        "sheet_sections": [asdict(section) for section in settings.sheet_sections],
    }


def deserialize_campaign_settings(data: Dict[str, Any]) -> CampaignSettings:
    if not isinstance(data, dict):
        data = {}
    xp_curve = data.get("xp_curve", {})
    stat_rule = data.get("stat_rule", {})
    raw_sections = data.get("sheet_sections")
    sheet_sections = normalize_sheet_sections(raw_sections if isinstance(raw_sections, list) else None)
    return CampaignSettings(
        xp_curve=XPCurveExponential(
            base_xp=int(xp_curve.get("base_xp", 200)),
            growth_rate=float(xp_curve.get("growth_rate", 1.25)),
        ),
        stat_rule=StatPointRule(
            base_per_level=int(stat_rule.get("base_per_level", 5)),
            bonus_every_5=int(stat_rule.get("bonus_every_5", 2)),
            bonus_every_10=int(stat_rule.get("bonus_every_10", 1)),
        ),
        equipment_category_id=str(data.get("equipment_category_id", "equipment")),
        sheet_sections=sheet_sections or default_sheet_sections(),
    )


def serialize_character(character: Character) -> Dict[str, Any]:
    return {
        "id": character.id,
        "name": character.name,
        "class_id": character.class_id,
        "level": character.level,
        "xp": character.xp,
        "unspent_stat_points": character.unspent_stat_points,
        "stats": character.stats,
        "resources": {k: list(v) for k, v in character.resources.items()},
        "currencies": character.currencies,
        "reputations": character.reputations,
        "equipment": serialize_equipment(character.equipment),
        "inventory": serialize_inventory(character.inventory),
        "abilities": {aid: serialize_ability(ab) for aid, ab in character.abilities.items()},
        "frozen": character.frozen,
    }


def deserialize_character(data: Dict[str, Any]) -> Character:
    if not isinstance(data, dict):
        data = {}
    resources: Dict[str, tuple[int, int]] = {}
    raw_resources = data.get("resources", {})
    if not isinstance(raw_resources, dict):
        raw_resources = {}
    for key, values in raw_resources.items():
        if not isinstance(values, (list, tuple)) or len(values) < 2:
            continue
        try:
            resources[key] = (int(values[0]), int(values[1]))
        except (TypeError, ValueError):
            continue
    character = Character(
        id=str(data.get("id", new_id("char"))),
        name=str(data.get("name", "")),
        class_id=str(data.get("class_id", "")),
        level=int(data.get("level", 1)),
        xp=int(data.get("xp", 0)),
        unspent_stat_points=int(data.get("unspent_stat_points", 0)),
        stats=dict(data.get("stats", {})),
        resources=resources,
        currencies=dict(data.get("currencies", {})),
        reputations=dict(data.get("reputations", {})),
        equipment=deserialize_equipment(data.get("equipment", {})),
        inventory=deserialize_inventory(data.get("inventory", {})),
        abilities={
            aid: deserialize_ability(ab) for aid, ab in data.get("abilities", {}).items()
        },
        frozen=bool(data.get("frozen", False)),
    )
    return character


def serialize_equipment(equipment: EquipmentState) -> Dict[str, Any]:
    return {slot.value: inst_id for slot, inst_id in equipment.slots.items()}


def deserialize_equipment(data: Dict[str, Any]) -> EquipmentState:
    slots = {slot: None for slot in EquipmentSlot}
    if not isinstance(data, dict):
        return EquipmentState(slots=slots)
    for key, value in data.items():
        try:
            slot = EquipmentSlot(key)
        except ValueError:
            continue
        slots[slot] = value
    return EquipmentState(slots=slots)


def serialize_inventory(inventory: InventoryState) -> Dict[str, Any]:
    return {inst_id: serialize_item_instance(inst) for inst_id, inst in inventory.items.items()}


def deserialize_inventory(data: Dict[str, Any]) -> InventoryState:
    inventory = InventoryState()
    if not isinstance(data, dict):
        return inventory
    for inst_id, inst_data in data.items():
        inst = deserialize_item_instance(inst_data)
        inventory.items[inst_id] = inst
    return inventory


def serialize_item_instance(inst: ItemInstance) -> Dict[str, Any]:
    return {
        "id": inst.id,
        "template_id": inst.template_id,
        "qty": inst.qty,
        "custom_name": inst.custom_name,
        "bound": inst.bound,
        "meta": inst.meta,
    }


def deserialize_item_instance(data: Dict[str, Any]) -> ItemInstance:
    if not isinstance(data, dict):
        data = {}
    return ItemInstance(
        id=str(data.get("id", new_id("item"))),
        template_id=str(data.get("template_id", "")),
        qty=int(data.get("qty", 1)),
        custom_name=data.get("custom_name"),
        bound=bool(data.get("bound", False)),
        meta=dict(data.get("meta", {})),
    )


def serialize_item_template(template: ItemTemplate) -> Dict[str, Any]:
    return {
        "id": template.id,
        "name": template.name,
        "item_type": template.item_type.value,
        "rarity": template.rarity.value,
        "description": template.description,
        "icon_key": template.icon_key,
        "equip_slots": [slot.value for slot in template.equip_slots],
        "two_handed": template.two_handed,
        "stat_mods": template.stat_mods,
        "granted_ability_ids": list(template.granted_ability_ids),
        "tags": list(template.tags),
    }


def deserialize_item_template(data: Dict[str, Any]) -> ItemTemplate:
    if not isinstance(data, dict):
        data = {}
    equip_slots: List[EquipmentSlot] = []
    for slot in data.get("equip_slots", []):
        try:
            equip_slots.append(EquipmentSlot(slot))
        except ValueError:
            continue
    try:
        item_type = ItemType(data.get("item_type", ItemType.misc.value))
    except ValueError:
        item_type = ItemType.misc
    try:
        rarity = Rarity(data.get("rarity", Rarity.white.value))
    except ValueError:
        rarity = Rarity.white
    return ItemTemplate(
        id=str(data.get("id", new_id("tpl"))),
        name=str(data.get("name", "")),
        item_type=item_type,
        rarity=rarity,
        description=str(data.get("description", "")),
        icon_key=data.get("icon_key"),
        equip_slots=equip_slots,
        two_handed=bool(data.get("two_handed", False)),
        stat_mods=dict(data.get("stat_mods", {})),
        granted_ability_ids=list(data.get("granted_ability_ids", [])),
        tags=list(data.get("tags", [])),
    )


def serialize_class_def(class_def: ClassDefinition) -> Dict[str, Any]:
    return {
        "id": class_def.id,
        "name": class_def.name,
        "description": class_def.description,
        "allowed_item_types": [t.value for t in class_def.allowed_item_types],
        "allowed_slots": [s.value for s in class_def.allowed_slots],
        "per_level_bonus": class_def.per_level_bonus.per_level_stat_delta,
    }


def deserialize_class_def(data: Dict[str, Any]) -> ClassDefinition:
    if not isinstance(data, dict):
        data = {}
    allowed_item_types: List[ItemType] = []
    for item_type in data.get("allowed_item_types", []):
        try:
            allowed_item_types.append(ItemType(item_type))
        except ValueError:
            continue
    allowed_slots: List[EquipmentSlot] = []
    for slot in data.get("allowed_slots", []):
        try:
            allowed_slots.append(EquipmentSlot(slot))
        except ValueError:
            continue
    return ClassDefinition(
        id=str(data.get("id", new_id("class"))),
        name=str(data.get("name", "")),
        description=str(data.get("description", "")),
        allowed_item_types=allowed_item_types,
        allowed_slots=allowed_slots,
        per_level_bonus=ClassPerLevelBonus(
            per_level_stat_delta=dict(data.get("per_level_bonus", {}))
        ),
    )


def serialize_quest_template(template: QuestTemplate) -> Dict[str, Any]:
    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "cannot_decline": template.cannot_decline,
        "objectives": [serialize_objective(obj) for obj in template.objectives],
        "rewards": template.rewards,
    }


def deserialize_quest_template(data: Dict[str, Any]) -> QuestTemplate:
    if not isinstance(data, dict):
        data = {}
    return QuestTemplate(
        id=str(data.get("id", new_id("quest_tpl"))),
        name=str(data.get("name", "")),
        description=str(data.get("description", "")),
        cannot_decline=bool(data.get("cannot_decline", False)),
        objectives=[deserialize_objective(obj) for obj in data.get("objectives", [])],
        rewards=dict(data.get("rewards", {})),
    )


def serialize_objective(obj: Objective) -> Dict[str, Any]:
    return {
        "id": obj.id,
        "text": obj.text,
        "done": obj.done,
        "progress": list(obj.progress) if obj.progress else None,
    }


def deserialize_objective(data: Dict[str, Any]) -> Objective:
    if not isinstance(data, dict):
        data = {}
    progress = data.get("progress")
    return Objective(
        id=str(data.get("id", new_id("obj"))),
        text=str(data.get("text", "")),
        done=bool(data.get("done", False)),
        progress=tuple(progress) if progress else None,
    )


def serialize_ability_category(category: AbilityCategory) -> Dict[str, Any]:
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "hidden": category.hidden,
    }


def deserialize_ability_category(data: Dict[str, Any]) -> AbilityCategory:
    if not isinstance(data, dict):
        data = {}
    return AbilityCategory(
        id=str(data.get("id", new_id("cat"))),
        name=str(data.get("name", "")),
        description=str(data.get("description", "")),
        hidden=bool(data.get("hidden", False)),
    )


def serialize_ability(ability: Ability) -> Dict[str, Any]:
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


def deserialize_ability(data: Dict[str, Any]) -> Ability:
    if not isinstance(data, dict):
        data = {}
    return Ability(
        id=str(data.get("id", new_id("ability"))),
        name=str(data.get("name", "")),
        description=str(data.get("description", "")),
        category_id=str(data.get("category_id", "")),
        active=bool(data.get("active", True)),
        hidden=bool(data.get("hidden", False)),
        cooldown_s=data.get("cooldown_s"),
        cost=data.get("cost"),
        source=str(data.get("source", "manual")),
    )


def serialize_chat_contact(contact: ChatContact) -> Dict[str, Any]:
    return {
        "id": contact.id,
        "display_name": contact.display_name,
        "link_payload": contact.link_payload,
    }


def deserialize_chat_contact(data: Dict[str, Any]) -> ChatContact:
    if not isinstance(data, dict):
        data = {}
    return ChatContact(
        id=str(data.get("id", new_id("contact"))),
        display_name=str(data.get("display_name", "")),
        link_payload=dict(data.get("link_payload", {})),
    )


def serialize_friend_request(request: FriendRequest) -> Dict[str, Any]:
    return {
        "id": request.id,
        "contact_id": request.contact_id,
        "created_at": request.created_at.isoformat(),
        "accepted": request.accepted,
        "accepted_at": request.accepted_at.isoformat() if request.accepted_at else None,
    }


def deserialize_friend_request(data: Dict[str, Any]) -> FriendRequest:
    if not isinstance(data, dict):
        data = {}
    return FriendRequest(
        id=str(data.get("id", new_id("req"))),
        contact_id=str(data.get("contact_id", "")),
        created_at=utcnow()
        if not data.get("created_at")
        else datetime_from_iso(data.get("created_at")),
        accepted=bool(data.get("accepted", False)),
        accepted_at=datetime_from_iso(data.get("accepted_at"))
        if data.get("accepted_at")
        else None,
    )


def serialize_chat_message(message: ChatMessage) -> Dict[str, Any]:
    return {
        "id": message.id,
        "chat_id": message.chat_id,
        "sender_contact_id": message.sender_contact_id,
        "text": message.text,
        "created_at": message.created_at.isoformat(),
        "links": [chat_link_to_dict(link) for link in message.links],
    }


def deserialize_chat_message(data: Dict[str, Any]) -> ChatMessage:
    if not isinstance(data, dict):
        data = {}
    links = data.get("links", [])
    if not isinstance(links, list):
        links = []
    return ChatMessage(
        id=str(data.get("id", new_id("chatmsg"))),
        chat_id=str(data.get("chat_id", "")),
        sender_contact_id=str(data.get("sender_contact_id", "")),
        text=str(data.get("text", "")),
        created_at=datetime_from_iso(data.get("created_at"))
        if data.get("created_at")
        else utcnow(),
        links=[chat_link_from_dict(link) for link in links],
    )


def serialize_chat_thread(thread: ChatThread) -> Dict[str, Any]:
    return {
        "id": thread.id,
        "contact_id": thread.contact_id,
        "opened": thread.opened,
        "messages": [serialize_chat_message(msg) for msg in thread.messages],
    }


def deserialize_chat_thread(data: Dict[str, Any]) -> ChatThread:
    if not isinstance(data, dict):
        data = {}
    messages = data.get("messages", [])
    if not isinstance(messages, list):
        messages = []
    return ChatThread(
        id=str(data.get("id", new_id("chat"))),
        contact_id=str(data.get("contact_id", "")),
        opened=bool(data.get("opened", False)),
        messages=[deserialize_chat_message(msg) for msg in messages],
    )


def datetime_from_iso(value: str) -> Any:
    if not value:
        return None
    return datetime.fromisoformat(value)


def _safe_event_from_dict(data: Any) -> EventLogEntry | None:
    if not isinstance(data, dict):
        return None
    try:
        return EventLogEntry.from_dict(data)
    except (KeyError, TypeError, ValueError):
        return None


def _ensure_dict(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return dict(value)
    return {}


def _ensure_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return list(value)
    return []
