"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for representation of data objects for dashboard_data
"""

import json
import os

from spacebridgeapp.dashboard.dashboard_helpers import get_dashboard_input_tokens

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

from splapp_protocol import common_pb2
from spacebridgeapp.data.base import SpacebridgeAppBase
from spacebridgeapp.data import form_input_data
from spacebridgeapp.udf.udf_data import UdfDashboardDescription
from spacebridgeapp.util.type_to_string import to_utf8_str
from spacebridgeapp.search.input_token_support import get_tokens_for_search
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_dashboard_data.log", "dashboard_data")

NAME = 'name'
COLUMNS = 'columns'
FIELDS = 'fields'
OPTIONS = 'options'
DATA = 'data'
 

class DashboardVisualizationId(SpacebridgeAppBase):
    """Pair of dashboard id and visualization id.
    """

    def __init__(self, dashboard_id="", visualization_id=""):
        self.dashboard_id = dashboard_id
        self.visualization_id = visualization_id

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardVisualizationId and populates
         the fields with the corresponding class values

        Arguments:
            proto {DashboardVisualizationId}
        """

        proto.visualizationId = self.visualization_id
        proto.dashboardId = self.dashboard_id

    def from_protobuf(self, proto):
        """
        Takes a protobuf and sets fields on class
        :param proto:
        :return:
        """
        self.visualization_id = proto.visualizationId
        self.dashboard_id = proto.dashboardId

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardVisualizationId
        """

        proto = common_pb2.DashboardVisualizationId()
        self.set_protobuf(proto)
        return proto


class DashboardData(SpacebridgeAppBase):
    """Pair of visualization id and the corresponding data
    """

    def __init__(self, dashboard_visualization_id=None, visualization_data=None, trellis_visualization_data=None):
        self.visualization_data = visualization_data
        self.dashboard_visualization_id = dashboard_visualization_id
        self.trellis_visualization_data = trellis_visualization_data

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardData and populates
         the fields with the corresponding class values

        Arguments:
            proto {DashboardData}
        """
        self.dashboard_visualization_id.set_protobuf(proto.dashboardVisualizationId)
        if self.visualization_data is not None:
            self.visualization_data.set_protobuf(proto.visualizationData)
        if self.trellis_visualization_data is not None:
            self.trellis_visualization_data.set_protobuf(proto.trellisVisualizationData)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardData
        """
        proto = common_pb2.DashboardData()
        self.set_protobuf(proto)
        return proto


class Column(SpacebridgeAppBase):
    """
    Container for VisualizationData column
    """

    def __init__(self, values=None):

        if values is None:
            values = []
        self.values = values

    def set_protobuf(self, proto):
        mapped_values = []
        for val in self.values:
            mapped_values.append(to_utf8_str(val))

        proto.values.extend(mapped_values)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardData
        """
        proto = common_pb2.VisualizationData.Column()
        self.set_protobuf(proto)
        return proto


class FieldsMeta(SpacebridgeAppBase):
    """
    Container for fields metadata for dashboard visualization
    """
    def __init__(self, fields=None):

        if fields is None:
            fields = {}
        self.fields = fields

    def set_protobuf(self, proto):
        if self.fields:
            for key in self.fields.keys():
                proto.fields[key] = self.fields[key]

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardData
        """
        proto = common_pb2.VisualizationData.FieldsMeta()
        self.set_protobuf(proto)
        return proto


class VisualizationData(SpacebridgeAppBase):
    """Container for data for dashboard visualizations
    """

    def __init__(self, field_names=None, columns=None, fields_meta_list=None):

        if field_names is None:
            field_names = []

        if columns is None:
            columns = []

        if fields_meta_list is None:
            fields_meta_list = []

        self.field_names = field_names
        self.columns = columns
        self.fields_meta_list = fields_meta_list

    @staticmethod
    def from_response_json(json_object):
        """
        Static helper to create VisualizationData object from a response_json
        :param json_object:
        :return:
        """
        fields_meta = []
        columns = []
        field_names = []
        if isinstance(json_object, dict):
            if FIELDS in json_object:
                fields = json_object[FIELDS]
                field_names = [field[NAME] if isinstance(field, dict) and NAME in field else field for field in fields]
                fields_meta = [{NAME: field} if isinstance(field, str) else field for field in fields]

            if COLUMNS in json_object:
                columns = [Column(column) for column in json_object[COLUMNS]]

        return VisualizationData(field_names=field_names, fields_meta_list=fields_meta, columns=columns)

    @staticmethod
    def from_ds_test(ds_test):
        """
        Static helper to create VisualizationData object from ds.test data_source
        :param ds_test:
        :return:
        """
        if isinstance(ds_test, dict):
            if OPTIONS in ds_test:
                options = ds_test[OPTIONS]
                if DATA in options:
                    return VisualizationData.from_response_json(options[DATA])
        return VisualizationData.from_response_json(None)

    def set_protobuf(self, proto):
        proto.fields.extend(self.field_names)
        columns_proto = [column.to_protobuf() for column in self.columns]
        fields_meta_proto = [FieldsMeta(field).to_protobuf() for field in self.fields_meta_list]
        proto.columns.extend(columns_proto)
        proto.fieldsMeta.extend(fields_meta_proto)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            VisualizationData
        """
        proto = common_pb2.VisualizationData()
        self.set_protobuf(proto)
        return proto

    # Helper Method
    def is_empty_data(self):
        """
        Helper method which returns True if both fields and columns are empty arrays, False otherwise
        :return:
        """
        return not self.fields_meta_list and not self.columns


class TrellisVisualizationData(SpacebridgeAppBase):
    """Container for data for trellis dashboard visualizations
        """

    def __init__(self, trellis_cells=None, visualization_data=None):
        if trellis_cells is None:
            trellis_cells = TrellisCells()

        if visualization_data is None:
            visualization_data = []

        self.trellis_cells = trellis_cells
        self.visualization_data = visualization_data

    def set_protobuf(self, proto):
        self.trellis_cells.set_protobuf(proto.trellisCells)
        visualization_data_proto = [data.to_protobuf() for data in self.visualization_data]
        proto.visualizationData.extend(visualization_data_proto)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            TrellisVisualizationData
        """
        proto = common_pb2.TrellisVisualizationData()
        self.set_protobuf(proto)
        return proto

    # Helper Method
    def is_empty_data(self):
        """
        Helper method which returns True if trellis_cells or visualization_data is empty, False otherwise
        :return:
        """
        return not self.trellis_cells and not self.visualization_data


class TrellisCells(SpacebridgeAppBase):
    """Container for data for trellis cell names"""

    def __init__(self, cells=None):
        if cells is None:
            cells = []
        self.cells = cells

    def set_protobuf(self, proto):
        proto.cells.extend(self.cells)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            TrellisCells
        """
        proto = common_pb2.TrellisVisualizationData.TrellisCells()
        self.set_protobuf(proto)
        return proto


class DashboardDescription(SpacebridgeAppBase):
    """Container for data for dashboard descriptions
    """
    def __init__(self,
                 dashboard_id="",
                 title="",
                 description="",
                 app_name="",
                 display_app_name="",
                 uses_custom_css=False,
                 uses_custom_javascript=False,
                 uses_custom_visualization=False,
                 uses_custom_html=False,
                 is_favorite=False,
                 input_tokens=None,
                 meta=None,
                 definition=None,
                 submit_button=False,
                 auto_run=False,
                 is_udf=False,
                 theme="",
                 tags=None):

        if tags is None:
            tags = []

        self.dashboard_id = dashboard_id
        self.title = title
        self.description = description if description is not None else ""
        self.app_name = app_name
        self.display_app_name = display_app_name
        self.uses_custom_css = uses_custom_css
        self.uses_custom_javascript = uses_custom_javascript
        self.uses_custom_visualization = uses_custom_visualization
        self.uses_custom_html = uses_custom_html
        self.is_favorite = is_favorite
        self.input_tokens = input_tokens
        self.meta = meta
        self.definition = definition
        self.submit_button = submit_button
        self.auto_run = auto_run
        self.is_udf = is_udf
        self.theme = theme
        self.tags = tags

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardDescription and populates
         the fields with the corresponding class values

        Arguments:
            proto {DashboardDescription}
        """
        proto.dashboardId = self.dashboard_id
        proto.title = self.title
        proto.description = self.description if self.description is not None else ""
        proto.appName = self.app_name
        proto.displayAppName = self.display_app_name
        proto.usesCustomCss = self.uses_custom_css
        proto.usesCustomJavascript = self.uses_custom_javascript
        proto.usesCustomVisualization = self.uses_custom_visualization
        proto.usesCustomHtml = self.uses_custom_html
        proto.isFavorite = self.is_favorite

        if self.input_tokens is not None:
            token_protos = [input_token.to_protobuf() for input_token in self.input_tokens]
            proto.inputTokens.extend(token_protos)

        if self.meta is not None:
            self.meta.set_protobuf(proto.meta)

        if self.definition is not None:
            if isinstance(self.definition, UdfDashboardDescription):
                self.definition.set_protobuf(proto.udfDefinition)
            else:
                self.definition.set_protobuf(proto.definition)

        tags_list = [to_utf8_str(tag) for tag in self.tags]
        proto.tags.extend(tags_list)

        proto.submitButton = self.submit_button
        proto.autoRun = self.auto_run
        proto.isUdf = self.is_udf
        proto.theme = self.theme

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardDescription
        """
        proto = common_pb2.DashboardDescription()
        self.set_protobuf(proto)
        return proto

    # Helper Method
    def get_visualization(self, visualization_id):
        return self.definition.get_visualization(visualization_id)

    def get_all_visualizations(self):
        return self.definition.get_all_visualizations()

    def get_first_visualization(self):
        list_visualizations = self.get_all_visualizations()
        if list_visualizations:
            return list_visualizations[0]
        return None

    def get_input_token_by_query_id(self, query_id):
        return self.definition.get_input_token_by_query_id(query_id)


class DashboardDefinition(SpacebridgeAppBase):
    """Container for data for dashboard definition. The definition
    specifies the row and panel layout for the dashboard
    """
    def __init__(self,
                 dashboard_id="",
                 title="",
                 description="",
                 list_rows=None,
                 refresh="",
                 list_searches=None,
                 list_visualizations=None,
                 input_tokens=None,
                 meta=None,
                 ar_compatible=False,
                 submit_button=False,
                 auto_run=False
                 ):

        if list_rows is None:
            list_rows = []

        if list_searches is None:
            list_searches = []

        if list_visualizations is None:
            list_visualizations = []

        if input_tokens is None:
            input_tokens = []

        self.dashboard_id = dashboard_id
        self.title = title
        self.description = description
        self.list_rows = list_rows
        self.refresh = refresh
        self.list_searches = list_searches
        self.list_visualizations = list_visualizations
        self.ar_compatible = ar_compatible

        # These variables should have been stored in the DashboardDefinition proto but they were put at the
        # parent level DashboardDescription so we store in this object but we don't persist to proto
        self.input_tokens = input_tokens
        self.meta = meta
        self.submit_button = submit_button
        self.auto_run = auto_run

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardDefiniton and populates
         the fields with the corresponding class values

        Arguments:
            proto {DashboardDefinition}
        """
        proto.dashboardId = self.dashboard_id
        proto.title = self.title
        proto.description = self.description if self.description is not None else ""
        proto.refresh = self.refresh

        rows_protos = [row.to_protobuf() for row in self.list_rows]
        proto.rows.extend(rows_protos)

        searches_protos = [search.to_protobuf() for search in self.list_searches]
        proto.searches.extend(searches_protos)

        visualization_protos = [vis.to_protobuf() for vis in self.list_visualizations]
        proto.visualizations.extend(visualization_protos)

        proto.arCompatible = self.ar_compatible

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardDefinition
        """
        proto = common_pb2.DashboardDefinition()
        self.set_protobuf(proto)
        return proto

    # Helper Method
    def get_visualization(self, visualization_id):
        """
        If visualization_id is present in one of the dashboard rows method returns true
        :param visualization_id:
        :return: True, if visualization_id is represented by one of the dashboard rows, False otherwise
        """
        for dashboard_row in self.list_rows:
            visualization = dashboard_row.get_visualization(visualization_id)
            if visualization is not None:
                return visualization
        return None

    def get_all_visualizations(self):
        """

        :return:
        """
        list_visualizations = []
        for dashboard_row in self.list_rows:
            list_visualizations.extend(dashboard_row.get_all_visualizations())
        return list_visualizations

    def get_input_token_by_query_id(self, query_id):
        all_input_tokens = get_dashboard_input_tokens(self)
        for input_token in all_input_tokens:
            input_type = input_token.input_type
            if hasattr(input_type, 'dynamic_options') \
                and input_type.dynamic_options \
                and input_type.dynamic_options.query_id == query_id:
                return input_token
        return None

    def _find_in_panels(self, search_id):
        for row in self.list_rows:
            for panel in row.list_dashboard_panels:
                for visualization in panel.list_dashboard_visualizations:
                    if visualization.search.id == search_id:
                        return visualization.search

        return None

    def find_base_search(self, search_id):
        for search in self.list_searches:
            if search.id == search_id:
                return search

        panel_search = self._find_in_panels(search_id)
        if panel_search:
            return panel_search

        return None


class Meta(SpacebridgeAppBase):

    def __init__(self, original_dashboard_deeplink):
        self.original_dashboard_deeplink = original_dashboard_deeplink

    def set_protobuf(self, proto):
        proto.originalDashboardDeepLink = self.original_dashboard_deeplink

    def to_protobuf(self):
        proto = common_pb2.Meta()
        self.set_protobuf(proto)
        return proto


class InputToken(SpacebridgeAppBase):

    def __init__(self, token_name, default_value=None, input_type=None, depends=None, rejects=None, change=None, search_when_changed=False):

        if depends is None:
            depends = []

        if rejects is None:
            rejects = []

        self.token_name = token_name
        self.default_value = default_value
        self.input_type = input_type
        self.depends = depends
        self.rejects = rejects
        self.change = change
        self.search_when_changed = search_when_changed

    def set_protobuf(self, proto):
        proto.tokenName = self.token_name
        if self.default_value is not None:
            proto.defaultValue = self.default_value

        if isinstance(self.input_type, form_input_data.Timepicker):
            self.input_type.set_protobuf(proto.timepicker)

        if isinstance(self.input_type, form_input_data.Dropdown):
            self.input_type.set_protobuf(proto.dropdown)

        if isinstance(self.input_type, form_input_data.Radio):
            self.input_type.set_protobuf(proto.radio)

        if isinstance(self.input_type, form_input_data.Checkbox):
            self.input_type.set_protobuf(proto.checkbox)

        if isinstance(self.input_type, form_input_data.Multiselect):
            self.input_type.set_protobuf(proto.multiselect)

        if isinstance(self.input_type, form_input_data.Textbox):
            self.input_type.set_protobuf(proto.textbox)

        depends_list = [to_utf8_str(depend) for depend in self.depends]
        proto.depends.extend(depends_list)

        rejects_list = [to_utf8_str(reject) for reject in self.rejects]
        proto.rejects.extend(rejects_list)

        if self.change is not None:
            self.change.set_protobuf(proto.change)

        proto.searchWhenChanged = self.search_when_changed

    def to_protobuf(self):
        proto = common_pb2.InputToken()
        self.set_protobuf(proto)
        return proto


class ChangeCondition(SpacebridgeAppBase):
    """
    Container for data for change condition. A change condition contains change tokens
    """

    def __init__(self, required_value, set_tokens=None, unset_tokens=None):

        if set_tokens is None:
            set_tokens = []

        if unset_tokens is None:
            unset_tokens = []

        self.required_value = required_value
        self.set_tokens = set_tokens
        self.unset_tokens = unset_tokens

    def set_protobuf(self, proto):
        proto.requiredValue = self.required_value

        if self.set_tokens:
            set_tokens_protos = [set_token.to_protobuf() for set_token in self.set_tokens]
            proto.setTokens.extend(set_tokens_protos)

        if self.unset_tokens:
            unset_tokens_protos = [unset_token.to_protobuf() for unset_token in self.unset_tokens]
            proto.unsetTokens.extend(unset_tokens_protos)

    def to_protobuf(self):
        proto = common_pb2.ChangeCondition()
        self.set_protobuf(proto)
        return proto


class ConditionToken(SpacebridgeAppBase):
    """
    Container for data for a condition token
    """

    def __init__(self, tokenName, tokenValue=None):
        self.tokenName = tokenName
        self.tokenValue = tokenValue

    def set_protobuf(self, proto):
        proto.tokenName = self.tokenName

        if self.tokenValue is not None:
            proto.tokenValue = self.tokenValue

    def to_protobuf(self):
        proto = common_pb2.ConditionToken()
        self.set_protobuf(proto)
        return proto


class DashboardRow(SpacebridgeAppBase):
    """Container for data for dashboard row. A row contains
    a list of panels
    """

    def __init__(self, list_dashboard_panels=None, depends=None, rejects=None):

        if list_dashboard_panels is None:
            list_dashboard_panels = []

        if depends is None:
            depends = []

        if rejects is None:
            rejects = []

        self.list_dashboard_panels = list_dashboard_panels
        self.depends = depends
        self.rejects = rejects

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardRow and populates
         the fields with the corresponding class values

        Arguments:
            proto {DashboardRow}
        """
        panel_protos = [panel.to_protobuf() for panel in self.list_dashboard_panels]
        proto.panels.extend(panel_protos)

        depends_list = [to_utf8_str(depend) for depend in self.depends]
        proto.depends.extend(depends_list)

        rejects_list = [to_utf8_str(reject) for reject in self.rejects]
        proto.rejects.extend(rejects_list)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardRow
        """
        proto = common_pb2.DashboardRow()
        self.set_protobuf(proto)
        return proto

    # Helper Methods
    def get_visualization(self, visualization_id):
        """
        If visualization_id is present in one of the dashboard panels method returns true
        :param visualization_id:
        :return: True, if visualization_id is represented by one of the dashboard panels, False otherwise
        """
        for dashboard_panel in self.list_dashboard_panels:
            visualization = dashboard_panel.get_visualization(visualization_id)
            if visualization is not None:
                return visualization
        return None

    def get_all_visualizations(self):
        """

        :return:
        """
        list_visualization = []
        for dashboard_panel in self.list_dashboard_panels:
            list_visualization.extend(dashboard_panel.list_dashboard_visualizations)
        return list_visualization


class DashboardPanel(SpacebridgeAppBase):
    """Container for data for dashboard panel. A panel consists of a
    list of visualizations and a title
    """

    def __init__(self, list_dashboard_visualizations=None, title="", depends=None, rejects=None, input_tokens=None):

        if list_dashboard_visualizations is None:
            list_dashboard_visualizations = []

        if depends is None:
            depends = []

        if rejects is None:
            rejects = []

        if input_tokens is None:
            input_tokens = []

        self.list_dashboard_visualizations = list_dashboard_visualizations
        self.title = title
        self.depends = depends
        self.rejects = rejects
        self.input_tokens = input_tokens

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardPanel and populates
         the fields with the corresponding class values

        Arguments:
            proto {DashboardPanel}
        """
        visualization_protos = [dashboard_visualization.to_protobuf()
                                for dashboard_visualization in self.list_dashboard_visualizations]
        proto.visualizations.extend(visualization_protos)
        proto.title = self.title

        depends_list = [to_utf8_str(depend) for depend in self.depends]
        proto.depends.extend(depends_list)

        rejects_list = [to_utf8_str(reject) for reject in self.rejects]
        proto.rejects.extend(rejects_list)

        if self.input_tokens:
            token_protos = [input_token.to_protobuf() for input_token in self.input_tokens]
            proto.inputTokens.extend(token_protos)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardPanel
        """
        proto = common_pb2.DashboardPanel()
        self.set_protobuf(proto)
        return proto

    def get_visualization(self, visualization_id):
        """
        If visualization_id is present in one of the visualizations method returns true
        :param visualization_id:
        :return: True, if visualization_id is represented by one of the visualizations, False otherwise
        """
        for dashboard_visualization in self.list_dashboard_visualizations:
            if dashboard_visualization.id == visualization_id:
                return dashboard_visualization
        return None


class Search(SpacebridgeAppBase):
    """Container for data for search data. Analogous to the Search proto
    """
    def __init__(self,
                 earliest="",
                 latest="",
                 refresh="",
                 refresh_type=0,
                 sample_ratio=0,
                 post_search="",
                 query="",
                 app=None,
                 ref=None,
                 base=None,
                 id=None,
                 depends=None,
                 rejects=None,
                 search_handlers=None):

        if refresh is None:
            refresh = ""

        if depends is None:
            depends = []

        if rejects is None:
            rejects = []

        if search_handlers is None:
            search_handlers = []

        self.earliest = earliest
        self.latest = latest
        self.refresh = refresh
        self.refresh_type = refresh_type
        self.sample_ratio = sample_ratio
        self.depends = depends
        self.rejects = rejects
        self.search_handlers = search_handlers

        # This field is not going to be used but is here because it was defined in proto
        self.post_search = post_search

        # These fields are not persisted to proto
        self.query = query
        self.ref = ref
        self.app = app
        self.base = base
        self.id = id

        # Populate search_token_names
        self.search_token_names = []
        self.search_token_names.extend(get_tokens_for_search(self.query))
        self.search_token_names.extend(get_tokens_for_search(self.earliest))
        self.search_token_names.extend(get_tokens_for_search(self.latest))
        self.search_token_names.extend(get_tokens_for_search(self.refresh))
        self.search_token_names = sorted(list(set(self.search_token_names)))

    def set_protobuf(self, proto):
        """Takes a proto of type Search and populates
         the fields with the corresponding class values

        Arguments:
            proto {Search}
        """
        proto.earliest = self.earliest
        proto.latest = self.latest
        proto.refresh = self.refresh
        proto.refreshType = self.refresh_type
        proto.sampleRatio = self.sample_ratio
        proto.postSearch = self.post_search

        depends_list = [to_utf8_str(depend) for depend in self.depends]
        proto.depends.extend(depends_list)

        rejects_list = [to_utf8_str(reject) for reject in self.rejects]
        proto.rejects.extend(rejects_list)

        search_handlers_list = [search_handler.to_protobuf() for search_handler in self.search_handlers]
        proto.searchHandlers.extend(search_handlers_list)

        search_token_names_list = [to_utf8_str(search_token) for search_token in self.search_token_names]
        proto.searchTokenNames.extend(search_token_names_list)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            Search
        """
        proto = common_pb2.DashboardVisualization.Search()
        self.set_protobuf(proto)
        return proto

    def are_render_tokens_defined(self, input_tokens):
        """
        Helper to determine if a depends tokens are defined
        :param input_tokens:
        :return:
        """
        if self.depends:
            # Short-circuit
            if not input_tokens:
                return False

            # Check to see if each depend is defined
            for depend in self.depends:
                if depend not in input_tokens:
                    return False

        if self.rejects:
            # Short-circuit
            if not input_tokens:
                return False

            # Check to see if each reject is defined
            for reject in self.rejects:
                if reject not in input_tokens:
                    return False
        return True


class ColorPalette(SpacebridgeAppBase):
    """
    A ColorPalette object within a Format object for table description
    """
    def __init__(self, color_palette_type=None, max_color=None, mid_color=None, min_color=None, value=None):
        self.color_palette_type = color_palette_type
        self.max_color = max_color
        self.mid_color = mid_color
        self.min_color = min_color
        self.value = value

    def set_protobuf(self, proto):
        proto.type = self.color_palette_type
        proto.maxColor = self.max_color
        proto.midColor = self.mid_color
        proto.minColor = self.min_color
        proto.value = self.value

    def to_protobuf(self):
        proto = common_pb2.DashboardVisualization.ColorPalette()
        self.set_protobuf(proto)
        return proto


class Scale(SpacebridgeAppBase):
    """
    A Scale object within a Format object for table description
    """
    def __init__(self, scale_type=None,
                 min_type=None, min_value=None,
                 mid_type=None, mid_value=None,
                 max_type=None, max_value=None,
                 value=None):
        self.scale_type = scale_type
        self.min_type = min_type
        self.min_value = min_value
        self.mid_type = mid_type
        self.mid_value = mid_value
        self.max_type = max_type
        self.max_value = max_value
        self.value = value

    def set_protobuf(self, proto):
        proto.type = self.scale_type
        proto.minType = self.min_type
        proto.minValue = self.min_value
        proto.midType = self.mid_type
        proto.midValue = self.mid_value
        proto.maxType = self.max_type
        proto.maxValue = self.max_value
        proto.value = self.value

    def to_protobuf(self):
        proto = common_pb2.DashboardVisualization.Scale()
        self.set_protobuf(proto)
        return proto


class Format(SpacebridgeAppBase):
    """
    A Format object used to specify Table formats
    """

    def __init__(self, format_type=None, field=None, color_palette=None, scale=None, options_map=None):

        if options_map is None:
            options_map = {}

        self.format_type = format_type
        self.field = field
        self.color_palette = color_palette
        self.scale = scale
        self.options_map = json.dumps(options_map)

    def set_protobuf(self, proto):
        proto.type = self.format_type
        proto.field = self.field

        # All optionals params so None could be passed
        if self.color_palette:
            self.color_palette.set_protobuf(proto.colorPalette)

        if self.scale:
            self.scale.set_protobuf(proto.scale)

        options_map_jsn = json.loads(self.options_map)
        if options_map_jsn:
            for key in options_map_jsn.keys():
                proto.options[key] = options_map_jsn[key]

    def to_protobuf(self):
        proto = common_pb2.DashboardVisualization.Format()
        self.set_protobuf(proto)
        return proto


class DashboardVisualization(SpacebridgeAppBase):
    """ A dashboard visualization consists of a visualization id, the search associated to the visualization,
    the visualization type and a map of misc options.
    """

    def __init__(self,
                 visualization_id=None,
                 title="",
                 search=None,
                 visualization_type=common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_UNKNOWN,
                 options_map=None,
                 list_formats=None,
                 drill_down=None,
                 depends=None,
                 rejects=None,
                 fields=None):

        if options_map is None:
            options_map = {}

        if list_formats is None:
            list_formats = []

        if depends is None:
            depends = []

        if rejects is None:
            rejects = []

        if fields is None:
            fields = []

        self.id = visualization_id
        self.title = title
        self.search = search
        self.visualization_type = visualization_type
        self.options_map = json.dumps(options_map)
        self.list_formats = list_formats
        self.drill_down = drill_down
        self.depends = depends
        self.rejects = rejects
        self.fields = fields

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardVisualization and populates
         the fields with the corresponding class values

        Arguments:
            proto {DashboardVisualization}
        """
        proto.id = self.id
        proto.title = self.title
        proto.type = self.visualization_type
        options_map_jsn = json.loads(self.options_map)
        for key in options_map_jsn.keys():
            proto.options[key] = options_map_jsn[key]
        self.search.set_protobuf(proto.search)

        if self.list_formats:
            format_protos = [format_obj.to_protobuf() for format_obj in self.list_formats]
            proto.formats.extend(format_protos)

        try:
            if self.drill_down:
                self.drill_down.set_protobuf(proto.drillDown)
        except AttributeError:
            LOGGER.info("DashboardVisualization object has no attribute drill_down")

        depends_list = [to_utf8_str(depend) for depend in self.depends]
        proto.depends.extend(depends_list)

        rejects_list = [to_utf8_str(reject) for reject in self.rejects]
        proto.rejects.extend(rejects_list)

        fields_list = [to_utf8_str(field) for field in self.fields]
        proto.fields.extend(fields_list)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardVisualization
        """
        proto = common_pb2.DashboardVisualization()
        self.set_protobuf(proto)
        return proto


class UserDashboardMeta(SpacebridgeAppBase):
    """
    Object container for a Dashboard Meta obj in kvstore
    """
    @staticmethod
    def from_json(json_obj):
        """
        Static initializer of Subscription object from a json object
        :param json_obj:
        :return: Subscription object
        """
        dashboard_meta = UserDashboardMeta()
        if json_obj:
            dashboard_meta.is_favorite = json_obj.get('is_favorite')
            dashboard_meta._key = json_obj.get('_key')
            dashboard_meta._user = json_obj.get('_user')
        return dashboard_meta

    def __init__(self,
                 dashboard_id=None,
                 is_favorite=None,
                 _user=None):
        self.is_favorite = is_favorite
        self._key = dashboard_id
        self._user = _user

    def dashboard_id(self):
        return self.key()

    def key(self):
        return self._key

    def user(self):
        return self._user
