"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

This module helps resolve search object by id and base
"""

from spacebridgeapp.data.dashboard_data import DashboardVisualization
from spacebridgeapp.dashboard.dashboard_helpers import generate_visualization_id


class SearchMapper(object):

    def __init__(self):
        self.id_to_search_map = {}
        self.base_to_list_search_map = {}

    def add_search_object(self, search_object):
        # We support adding both Search objects and DashboardVisualization objects
        if isinstance(search_object, DashboardVisualization):
            search = search_object.search
        else:
            search = search_object

        # Add to id map if id is defined
        if search and search.id:
            self.id_to_search_map[search.id] = search_object

        # if base is defined add to base map
        if search and search.base:
            if search.base not in self.base_to_list_search_map:
                self.base_to_list_search_map[search.base] = []
            self.base_to_list_search_map[search.base].append(search_object)

    def update_mappings(self):
        for base in self.base_to_list_search_map:
            list_search_object = self.base_to_list_search_map[base]
            for search_object in list_search_object:

                # Resolve BaseSearch
                base_search_object = self.id_to_search_map.get(base)
                if isinstance(base_search_object, DashboardVisualization):
                    base_search = base_search_object.search
                else:
                    base_search = base_search_object

                # Resolve Search
                if isinstance(search_object, DashboardVisualization):
                    search = search_object.search
                else:
                    search = search_object

                # Update the search params
                if search and base_search:
                    search.refresh = base_search.refresh if base_search.refresh else search.refresh
                    search.refresh_type = base_search.refresh_type if base_search.refresh_type else search.refresh_type
                    search.sample_ratio = base_search.sample_ratio if base_search.sample_ratio else search.sample_ratio
                    search.search_token_names.extend(
                        [token for token in base_search.search_token_names if token not in search.search_token_names])

                # Need to recalculate the visualization_id for DashboardVisualization objects
                if isinstance(search_object, DashboardVisualization):
                    values = search_object.id.split('/')
                    row_index = int(values[1])
                    panel_index = int(values[2])
                    search_object.id = generate_visualization_id(earliest=search.earliest,
                                                                 latest=search.latest,
                                                                 query=search.query,
                                                                 refresh=search.refresh,
                                                                 refresh_type=search.refresh_type,
                                                                 sample_ratio=search.sample_ratio,
                                                                 row_index=row_index,
                                                                 panel_index=panel_index)

