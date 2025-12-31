# Aether Journal

Локальный помощник для кампаний LitRPG с Host/Player UI и сервером FastAPI.

## Быстрый старт

### 1) Установка зависимостей

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Запуск сервера

```bash
make run
```

или напрямую:

```bash
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000
```

### 3) Открыть интерфейсы

- Host UI: http://127.0.0.1:8000/host
- Player UI: http://127.0.0.1:8000/player

## Переменные окружения

| Переменная | Описание | Значение по умолчанию |
| --- | --- | --- |
| `AETHER_CAMPAIGN_PATH` | путь к JSON-хранилищу кампании | `data/campaign.json` |
| `AETHER_LOAD_DEMO` | загрузить демо-набор при пустой кампании (`1`, `true`, `yes`) | не задано |
| `AETHER_DEMO_PATH` | путь к JSON-демо-набору (используется при `AETHER_LOAD_DEMO`) | `storage/seed_demo.json` |

## Демо-набор

Чтобы загрузить демо-данные (предметы, квесты, сообщения) в пустую кампанию, установите переменные:

```bash
AETHER_LOAD_DEMO=1
# необязательно, если используете стандартный путь
AETHER_DEMO_PATH=storage/seed_demo.json
```

## Экспорт и импорт

Для экспорта и импорта отдельных частей используйте Host токен:

```bash
# Шаблоны (предметы/квесты/сообщения)
curl -H "Authorization: Bearer <HOST_TOKEN>" \
  http://127.0.0.1:8000/api/export/templates > templates.json

curl -X POST -H "Authorization: Bearer <HOST_TOKEN>" \
  -H "Content-Type: application/json" \
  --data @templates.json \
  http://127.0.0.1:8000/api/import/templates

# Лог событий
curl -H "Authorization: Bearer <HOST_TOKEN>" \
  http://127.0.0.1:8000/api/export/log > event_log.json

curl -X POST -H "Authorization: Bearer <HOST_TOKEN>" \
  -H "Content-Type: application/json" \
  --data @event_log.json \
  http://127.0.0.1:8000/api/import/log

# Чаты и контакты
curl -H "Authorization: Bearer <HOST_TOKEN>" \
  http://127.0.0.1:8000/api/export/chats > chats.json

curl -X POST -H "Authorization: Bearer <HOST_TOKEN>" \
  -H "Content-Type: application/json" \
  --data @chats.json \
  http://127.0.0.1:8000/api/import/chats
```

## Документация

- [Host UI](docs/host.md)
- [Player UI](docs/player.md)

## Команды Makefile

```bash
make run   # запуск сервера
make dev   # запуск в режиме auto-reload
make test  # прогон тестов
```

## Проверка

```bash
pytest
```
