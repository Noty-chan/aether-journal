.PHONY: run dev test

run:
	python -m uvicorn server.main:app --host 0.0.0.0 --port 8000

dev:
	python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload

test:
	pytest
