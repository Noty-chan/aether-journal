from __future__ import annotations

from datetime import datetime, timezone
import uuid


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def clamp_int(value: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, value))
