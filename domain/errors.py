class DomainError(Exception):
    """Base domain error."""


class EquipError(DomainError):
    """Raised when equipment rules are violated."""


class QuestError(DomainError):
    """Raised when quest constraints are violated."""


class PermissionError(DomainError):
    """Raised when permissions are violated."""
