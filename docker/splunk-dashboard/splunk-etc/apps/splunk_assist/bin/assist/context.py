import logging
from dataclasses import dataclass
import uuid

@dataclass()
class Context:
    id: str
    parent_id: str or None
    log: logging.Logger

    def __hash__(self):
        return hash(self.id)

    @staticmethod
    def new(log: logging.Logger):
        return Context(str(uuid.uuid4()), None, log=log)

    @staticmethod
    def copy(ctx):
        return Context(str(uuid.uuid4()), ctx.id, ctx.log)

    def child(self):
        return Context.copy(self)
