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
