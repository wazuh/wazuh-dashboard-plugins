# this is a release version - we do not profile those :)
from logging import Logger
from types import TracebackType
from typing import Optional, Type

class Profiler:
    """ Dummy profiler class used in production - the real version is used
        only for development builds. See: _real_debug_utils.py
    """
    def __init__(self, logger : Logger) -> None:
        pass

    def __enter__(self) -> 'Profiler':
        return self

    def __exit__(self, exc_type : Optional[Type[BaseException]],
                 exc_value : Optional[BaseException],
                 traceback : Optional[TracebackType]) -> None:
        pass
