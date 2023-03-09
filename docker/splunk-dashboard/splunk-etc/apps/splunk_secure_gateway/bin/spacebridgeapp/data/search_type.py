"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from enum import Enum


class SearchType(Enum):
    NONE = 0
    VISUALIZATION = 1
    ROOT = 2
    INPUT = 3
    SAVED_SEARCH = 4
    DATA_SOURCE = 5

    @classmethod
    def from_string(cls, name):
        return SearchType[name.upper()] if name and name.upper() in SearchType.__members__ else SearchType.NONE

    @classmethod
    def from_value(cls, value):
        return SearchType(value) if isinstance(value, int) and \
                                    value in SearchType._value2member_map_ else SearchType.NONE
