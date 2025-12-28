from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from threading import Lock
from typing import Dict, Optional

from app.permissions import HOST_ROLE, PLAYER_ROLE


@dataclass
class PairingManager:
    pin: Optional[str] = None
    tokens: Dict[str, str] = field(default_factory=dict)
    lock: Lock = field(default_factory=Lock)

    def set_pin(self, pin: str) -> str:
        with self.lock:
            self.pin = str(pin)
            self.tokens = {}
            host_token = self._generate_token()
            self.tokens[host_token] = HOST_ROLE
            return host_token

    def pair_player(self, pin: str) -> str:
        with self.lock:
            if not self.pin or str(pin) != self.pin:
                raise ValueError("PIN mismatch")
            player_token = self._generate_token()
            self.tokens[player_token] = PLAYER_ROLE
            return player_token

    def get_role(self, token: str) -> Optional[str]:
        with self.lock:
            return self.tokens.get(token)

    def _generate_token(self) -> str:
        return secrets.token_urlsafe(24)
