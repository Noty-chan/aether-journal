from __future__ import annotations

from domain.errors import PermissionError
from domain.models import Character

HOST_ROLE = "host"
PLAYER_ROLE = "player"


def ensure_host(actor_role: str) -> None:
    if actor_role != HOST_ROLE:
        raise PermissionError("Требуется роль ведущего")


def ensure_player(actor_role: str) -> None:
    if actor_role != PLAYER_ROLE:
        raise PermissionError("Требуется роль игрока")


def ensure_player_can_act(character: Character) -> None:
    if character.frozen:
        raise PermissionError("Действия игрока заморожены")
