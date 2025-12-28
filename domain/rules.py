from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class XPCurveExponential:
    """
    xp_to_next(level) = round(base_xp * growth_rate ** (level-1))
    """

    base_xp: int = 200
    growth_rate: float = 1.25

    def xp_to_next(self, level: int) -> int:
        if level < 1:
            raise ValueError("level must be >= 1")
        raw = self.base_xp * (self.growth_rate ** (level - 1))
        return max(1, int(round(raw)))


@dataclass
class StatPointRule:
    """
    On reaching level L:
      +5 always
      +2 if L % 5 == 0
      +1 if L % 10 == 0 (additional)
    """

    base_per_level: int = 5
    bonus_every_5: int = 2
    bonus_every_10: int = 1

    def points_on_level(self, new_level: int) -> int:
        pts = self.base_per_level
        if new_level % 5 == 0:
            pts += self.bonus_every_5
        if new_level % 10 == 0:
            pts += self.bonus_every_10
        return pts

    def points_for_range(self, from_level: int, to_level: int) -> int:
        if to_level <= from_level:
            return 0
        total = 0
        for level in range(from_level + 1, to_level + 1):
            total += self.points_on_level(level)
        return total


@dataclass
class ClassPerLevelBonus:
    """
    Per-level stat bonuses for a class.
    Example: { "F": 2, "V": 1, "S": 0 } each level.
    """

    per_level_stat_delta: Dict[str, int] = field(default_factory=dict)

    def apply_for_levels(
        self, stats: Dict[str, int], from_level: int, to_level: int
    ) -> Dict[str, int]:
        if to_level <= from_level:
            return stats
        levels_gained = to_level - from_level
        for stat_id, delta in self.per_level_stat_delta.items():
            stats[stat_id] = int(stats.get(stat_id, 0)) + int(delta) * levels_gained
        return stats
