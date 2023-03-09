"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Default Dashboard Tag enum
"""
from enum import Enum


class DashboardTag(Enum):
    MOBILE = 'mobile'
    TV = 'tv'
    AR = 'ar'
    VR = 'vr'

    @classmethod
    def has_value(cls, value):
        return value in cls._value2member_map_
