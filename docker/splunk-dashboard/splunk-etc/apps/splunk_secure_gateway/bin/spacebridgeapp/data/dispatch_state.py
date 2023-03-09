"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from enum import Enum


class DispatchState(Enum):
    NONE = 0
    QUEUED = 1
    PARSING = 2
    RUNNING = 3
    FINALIZING = 4
    DONE = 5
    FAILED = 6
    PAUSED = 7

    @classmethod
    def from_string(cls, name):
        return DispatchState[name.upper()] if name and name.upper() in DispatchState.__members__ else DispatchState.NONE

    @classmethod
    def from_value(cls, value):
        return DispatchState(value) if isinstance(value, int) and \
                                       value in DispatchState._value2member_map_ else DispatchState.NONE
