Отвечать пользователю стоит на русском. 

## Прогресс агента
- Текущий этап: 1) MVP (v0.1) — завершен. — агент
- Добавлена вкладка лога событий (Host/Player) с подгрузкой истории и realtime-обновлением. Нужно продолжать отмечать прогресс в этом файле. — агент
- Пометка: нужно отмечать прогресс в этом файле и подписывать, что это нужно делать. — агент
- Добавлена панель заявок в Player UI с принятием заявок через API. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены каркас прикладных сервисов, хранилища JSON и состояние кампании (доменные модели + тесты). — агент
- Добавлен каркас сервера (FastAPI) с pairing PIN, REST API, WebSocket рассылкой событий, экспортом/импортом кампании и логом событий. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены сервисы и API для контактов, заявок в друзья и чата с сообщениями (включая ссылки). Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены структурированные ссылки в чат-сообщениях (нормализация, сериализация, события), подготовка для карточек. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены клиентские модули подписки на WebSocket события и обновления локальной модели чата для Host/Player UI. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены UI-формы чата для Host/Player с выбором ссылок и API-эндпоинты для linkables. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлен Host UI раздел “Контакты/Чат” с формами контактов, friend-request и отправки сообщений. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены автологирование снятия экипировки при смене/удалении предметов и проверка открытия чата перед отправкой сообщения игроком. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены Host/Player UI для листа персонажа, инвентаря и экипировки с обновлением по WebSocket. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены вкладки квестов/способностей, управление квестами и системные сообщения с аудио и WebSocket-обновлениями. Нужно продолжать отмечать прогресс в этом файле. — агент
- Добавлены события для валют/ресурсов/репутаций/способностей, обработчики UI и API для записи и рассылки. Нужно продолжать отмечать прогресс в этом файле. — агент


# Agents.md

This repository is a **LAN (local network) Host + Player** LitRPG companion app.
Two UIs connect to one authoritative Host server:
- **Host (System/GM)**: full control (edit rules, character sheet, items, quests, abilities, messages, chats)
- **Player (Client)**: view + allowed interactions only

You are an implementation agent. Read and follow:
1) `PRODUCT_SPEC.md` (product behavior, permissions, UX rules, constraints)
2) `ROADMAP.md` (phasing, MVP scope, priorities)
3) `core.py` (domain model + rules scaffolding to extract into the project)

Do not invent new gameplay rules unless explicitly marked as "agent choice". If something is unclear, prefer a reasonable default and make it configurable from Host UI.

---

## Architecture baseline (must follow)

### 1) Topology
- **Single Host server** runs on the GM machine and serves:
  - HTTP API (REST) for CRUD and commands
  - WebSocket (or SSE) for realtime events to connected clients
  - Static assets for both UIs (host UI + player UI)
- **Player** connects via LAN from browser/device:
  - `http://HOST_IP:PORT/player`
- **Host UI** lives at:
  - `http://127.0.0.1:PORT/host` (also accessible from LAN if enabled)

### 2) "Event log first" state sync
Use an append-only **Event Log** as the source of truth for "what happened":
- Each event has:
  - `seq` (monotonic integer)
  - `ts` timestamp
  - `actor` (host/player/system)
  - `kind` (string enum)
  - `payload` (JSON)
- Clients:
  - on connect: fetch current snapshot + last `seq`
  - then subscribe to realtime events
  - on reconnect: request events after last `seq` and apply

This enables:
- auto-logging of changes
- reliable delivery (no lost messages)
- deterministic replays / audits later

### 3) Separation of concerns
Organize code into 4 layers:

**(A) Domain (pure Python)**
- entities, rules, validation, computations
- no HTTP, no DB, no UI
- should be testable with unit tests
- start from `core.py` and split into `/domain/*`

**(B) Application services**
- orchestrate domain actions (commands):
  - add XP, level up, equip item, send message, accept friend request, etc.
- produce events + updated aggregates
- live in `/app/*`

**(C) Persistence**
- store snapshots, templates, assets metadata, event log
- interface-first (Repository pattern)
- for MVP prefer SQLite (single file) OR JSON-file store with versioning

**(D) Transport/UI**
- API routes, auth, websockets, static pages
- host and player UIs should be separate bundles/routes

### 4) Minimal server requirements
- LAN friendly: bind host server to `0.0.0.0`
- auth: PIN-based pairing
- only Host can mutate campaign state (Player uses requests/commands that Host may accept/deny)

### 5) Export/import
Everything must be exportable as JSON:
- campaign snapshot (player sheet, inventory, quests, etc.)
- templates library (items/quests/messages/NPC profiles)
- rules/config (XP curve params, stat point rules, class bonuses, restrictions)
- event log (optional, can be separate export)

---

## Recommended repo structure

```
/domain
  models.py          # dataclasses/enums (Character, Item, Quest, Ability, Message, Chat...)
  rules.py           # XP, stat points, class progression, equip restrictions
  events.py          # event types + helpers
  errors.py          # domain exceptions
/app
  services.py        # commands (grant_xp, level_up_many, equip_item, send_message, ...)
  permissions.py     # permission checks (Host vs Player)
/storage
  repo.py            # repository interfaces
  sqlite_repo.py     # SQLite implementation (or json_repo.py for MVP)
/server
  main.py            # app entrypoint
  api.py             # HTTP routes (REST)
  ws.py              # websocket hub
  auth.py            # PIN pairing, tokens
/static
  /host              # Host UI assets
  /player            # Player UI assets
/tests
  test_rules.py
  test_equipment.py
  test_quests.py
```

---

## Implementation rules (must)

### Roles & permissions
- Host: full CRUD
- Player: no direct CRUD; only "requests" (equip/use/choose) that Host can allow automatically or manually

### XP curve (chosen)
- XP curve is **exponential** (see PRODUCT_SPEC.md):
  - `xp_to_next(level) = round(base_xp * (growth_rate ** (level-1)))`
- `base_xp` and `growth_rate` must be editable from Host UI and saved/exported.

### Stat point awarding (fixed rule)
On each level-up to level `L`:
- +5 always
- +2 if `L` is divisible by 5
- +1 if `L` is divisible by 10 (in addition to the +2)

Host must be able to toggle/override this in settings (but defaults are fixed as above).

### Class per-level bonuses (configurable)
Per class: add per-level stat deltas (X|Y|Z to chosen stats, extensible to N stats).

### Equipment slots (fixed)
- Weapons: `weapon_1`, `weapon_2` (some items are **two-handed** and occupy both)
- Armor: `head`, `torso`, `legs`, `boots`
- Accessories: `ring_1`, `ring_2`

Equip must enforce:
- slot compatibility
- class restrictions (allowed item types/slots)
- two-handed weapon rule
- unique ring slots

### Quests duplication rule (must)
Host cannot send the same quest template to the same player twice if it is still active/unresolved.

### System messages behavior (must)
- Messages can be **collapsible**, including choice messages.
- Some messages are **non-collapsible** (flag).
- Choice messages:
  - before choice: show full content
  - after choice: collapse to summary showing the chosen option (still available in history)

### Audio notifications (must)
3 sound categories:
- info
- warning
- alert
Level-up uses a dedicated effect (may map to alert sound, but should be configurable).

### Auto-log (must)
Most state changes must emit auto-log events (and appear in log/history UI):
- add/remove/modify items, quests, abilities
- equip/unequip
- XP/level changes
- currency/reputation/resource changes
- freeze/unfreeze and permission toggles

---

## Deliverables for MVP (see ROADMAP.md)
- Host server + host UI + player UI
- Pairing, realtime events, persistence, export/import
- Character sheet, inventory+equipment, quests, abilities, messages, logs
- Messenger chats with friend requests controlled by Host
- Linkable entities in chat (NPC/player profiles; quest/item cards)

---

## Quality bar
- deterministic rules (XP, stat points, equip constraints)
- no lost events/messages on reconnect
- safe defaults + configurable rules from Host UI
- strong separation domain/app/storage/transport
