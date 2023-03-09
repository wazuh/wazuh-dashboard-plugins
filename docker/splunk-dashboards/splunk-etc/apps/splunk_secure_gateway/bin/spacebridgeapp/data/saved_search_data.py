"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Saved Search Data Objects
"""

from spacebridgeapp.data.base import SpacebridgeAppBase


class SavedSearch(SpacebridgeAppBase):
    """
    Saved Search metadata object
    """

    def __init__(self, name='', is_scheduled=False, search='', visualization_type=None, options_map=None):
        if options_map is None:
            options_map = {}
        self.name = name
        self.is_scheduled = is_scheduled
        self.search = search
        self.visualization_type = visualization_type
        self.options_map = options_map


class SavedSearchHistory(SpacebridgeAppBase):
    """
    Saved Search History metadata object
    """

    def __init__(self, name='', is_scheduled=False, is_done=False):
        self.name = name
        self.is_scheduled = is_scheduled
        self.is_done = is_done
