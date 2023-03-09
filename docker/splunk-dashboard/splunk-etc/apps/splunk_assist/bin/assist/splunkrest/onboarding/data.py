import enum


class TenantStatus(enum.Enum):
    UNKNOWN = "unknown"
    CREATING = "creating"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CREATE_FAILED = "create-failed"
    TOMBSTONING = "tombstoning"
    TOMBSTONED = "tombstoned"
    DELETING = "deleting"

    def __str__(self):
        return self.value

    def is_active(self):
        return self == TenantStatus.ACTIVE

    @classmethod
    def parse(cls, value: str):
        try:
            return cls(value)
        except ValueError:
            return cls.UNKNOWN
