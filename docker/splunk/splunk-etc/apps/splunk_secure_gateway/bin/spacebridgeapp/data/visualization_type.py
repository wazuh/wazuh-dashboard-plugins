"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from enum import Enum


class VisualizationType(Enum):
    DASHBOARD_VISUALIZATION_UNKNOWN = 0
    DASHBOARD_VISUALIZATION_CHART = 1
    DASHBOARD_VISUALIZATION_MAP = 2
    DASHBOARD_VISUALIZATION_SINGLE = 3
    DASHBOARD_VISUALIZATION_TABLE = 4
    DASHBOARD_VISUALIZATION_EVENT = 5

    @classmethod
    def from_string(cls, name):
        return VisualizationType[name.upper()] if name and name.upper() in VisualizationType.__members__ \
            else VisualizationType.DASHBOARD_VISUALIZATION_UNKNOWN

    @classmethod
    def from_value(cls, value):
        return VisualizationType(value) if isinstance(value, int) and value in VisualizationType._value2member_map_ \
            else VisualizationType.DASHBOARD_VISUALIZATION_UNKNOWN
