"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from enum import Enum


class InstallationEnvironment(Enum):
    UNKNOWN = 0
    ENTERPRISE = 1
    CLOUD = 2

    @classmethod
    def from_string(cls, name):
        return InstallationEnvironment[name.upper()] if name and name.upper() in InstallationEnvironment.__members__ \
            else InstallationEnvironment.UNKNOWN

    @classmethod
    def from_value(cls, value):
        return InstallationEnvironment(value) if isinstance(value, int) and value in InstallationEnvironment._value2member_map_ \
            else InstallationEnvironment.UNKNOWN
