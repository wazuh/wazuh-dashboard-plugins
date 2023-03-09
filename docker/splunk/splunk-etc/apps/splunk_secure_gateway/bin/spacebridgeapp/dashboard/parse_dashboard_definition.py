"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Parse a Dashboard content data field formatted in simple xml

Xml data found in entry object and eai:data field from Splunk API response
https://<host>:<mPort>/servicesNS/{user}/{app_name}/data/ui/views
"""

import json
from spacebridgeapp.dashboard.util import build_dashboard_visualization_search
from spacebridgeapp.data.dashboard_data import DashboardDefinition
from spacebridgeapp.data.dashboard_data import DashboardRow
from spacebridgeapp.data.dashboard_data import DashboardPanel
from spacebridgeapp.data.dashboard_data import DashboardVisualization
from spacebridgeapp.data.dashboard_data import Format
from spacebridgeapp.data.dashboard_data import ColorPalette
from spacebridgeapp.data.dashboard_data import Scale
from spacebridgeapp.data.dashboard_data import Meta
from spacebridgeapp.dashboard.parse_event_handler import build_drill_down
from spacebridgeapp.dashboard.parse_helpers import to_str, get_text, to_token_list
from spacebridgeapp.dashboard.input_token_set import InputTokenSet
from spacebridgeapp.dashboard.search_mapper import SearchMapper
from spacebridgeapp.data.visualization_type import VisualizationType
from spacebridgeapp.data.form_input_data import FormListInput
from spacebridgeapp.search.saved_search_requests import fetch_saved_search
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.util.constants import VALID_CHART_TYPES, SPACEBRIDGE_APP_NAME
from splapp_protocol import common_pb2
from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_parse_dashboard_definition.log",
                       "parse_dashboard_definition")


async def to_dashboard_definition(request_context=None,
                                  app_name="",
                                  root=None,
                                  dashboard_id="",
                                  show_refresh=True,
                                  async_splunk_client=None):
    """
    Pass in a Dashboard xml data string, with a dashboard_id to return a Dashboard Definition
    :param request_context:
    :param app_name:
    :param root:
    :param dashboard_id:
    :param show_refresh: show refresh params, default True
    :param async_splunk_client:
    :return: DashboardDefinition object
    """
    # populate fields
    description = get_text(root.find('description'))
    title = get_text(root.find('label'))
    dashboard_refresh = to_str(root.get('refresh'))

    # populate meta
    meta = populate_meta(root)

    # search_mapper user to resolve inherited search properties like refresh interval
    search_mapper = None
    if not dashboard_refresh:
        search_mapper = SearchMapper()

    # populate any root searches
    search_elements = root.findall('search')
    list_searches = []
    list_visualizations = []
    for search_element in search_elements:
        # v, the visualization_id is not used
        v, search = build_dashboard_visualization_search(search_element=search_element,
                                                         dashboard_refresh=dashboard_refresh,
                                                         show_refresh=show_refresh)

        dashboard_visualization = DashboardVisualization(
            visualization_type=common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_SEARCH,
            search=search,
            visualization_id=v)


        list_searches.append(search)
        list_visualizations.append(dashboard_visualization)

        if search_mapper:
            search_mapper.add_search_object(search)

    # populate any input_tokens specified at root in <fieldset>
    input_token_set = InputTokenSet()
    fieldset = root.find("fieldset")
    submit_button = False
    auto_run = False
    if fieldset is not None:
        input_token_set.add_input_element_list(fieldset.findall("input"))

        submit_button = True if fieldset.get('submitButton', "").lower().strip() == "true" else False
        auto_run = True if fieldset.get('autoRun', "").lower().strip() == "true" else False

        # Append any InputToken search objects to search_mapper
        if search_mapper:
            for input_token in input_token_set.get_input_tokens():
                input_type = input_token.input_type
                if isinstance(input_type, FormListInput) \
                        and input_type.dynamic_options and input_type.dynamic_options.search:
                    search_mapper.add_search_object(input_type.dynamic_options.search)

    # Create DashboardRow List from child element 'row'
    row_elements = root.findall('row')
    list_rows = []
    ar_compatible_dashboard = True
    for row_index, row_element in enumerate(row_elements):
        dashboard_row, ar_compatible_row = await to_dashboard_row(request_context=request_context,
                                                                  app_name=app_name,
                                                                  row_element=row_element,
                                                                  row_index=row_index,
                                                                  dashboard_refresh=dashboard_refresh,
                                                                  show_refresh=show_refresh,
                                                                  search_mapper=search_mapper,
                                                                  async_splunk_client=async_splunk_client)
        list_rows.append(dashboard_row)
        # Dashboard is not AR compatible if even one row is AR incompatible
        if ar_compatible_dashboard and not ar_compatible_row:
            ar_compatible_dashboard = False

    # A post processing step to override the refresh, refresh_type for base searches
    if not dashboard_refresh:
        search_mapper.update_mappings()

    # Check if dashboard is AR compatible
    ar_compatible = input_token_set.are_input_tokens_ar_compatible() and ar_compatible_dashboard

    return DashboardDefinition(dashboard_id=dashboard_id,
                               title=title,
                               description=description,
                               list_rows=list_rows,
                               refresh=dashboard_refresh,
                               list_searches=list_searches,
                               list_visualizations=list_visualizations,
                               input_tokens=input_token_set.get_input_tokens(),
                               meta=meta,
                               ar_compatible=ar_compatible,
                               submit_button=submit_button,
                               auto_run=auto_run)


def populate_meta(root):
    """
    extract dashboard deep link from xml and return Meta object
    :param root: xml root node
    :return:
    """
    dashboard_deep_link = root.find("originalDashboardDeepLink")
    if dashboard_deep_link is None:
        return None

    return Meta(get_text(dashboard_deep_link))


async def to_dashboard_row(request_context, app_name, row_element, row_index, dashboard_refresh=None, show_refresh=True,
                           search_mapper=None, input_token_set=None, async_splunk_client=None):
    """
    Parse a <row> element into a DashboardRow object
    :param request_context:
    :param app_name:
    :param row_element:
    :param row_index:
    :param dashboard_refresh:
    :param show_refresh: show refresh params, default True
    :param search_mapper:
    :param input_token_set:
    :param async_splunk_client:
    :return: DashboardRow object
    """
    # Create DashboardPanel list from child 'panel'
    panel_elements = row_element.findall('panel')
    depends = to_token_list(row_element.attrib.get('depends', ''))
    rejects = to_token_list(row_element.attrib.get('rejects', ''))
    panels = []
    ar_compatible_row = True
    for panel_index, panel_element in enumerate(panel_elements):
        dashboard_panel, ar_compatible_panel = await to_dashboard_panel(request_context=request_context,
                                                                        app_name=app_name,
                                                                        panel_element=panel_element,
                                                                        row_index=row_index,
                                                                        panel_index=panel_index,
                                                                        dashboard_refresh=dashboard_refresh,
                                                                        show_refresh=show_refresh,
                                                                        search_mapper=search_mapper,
                                                                        async_splunk_client=async_splunk_client)
        panels.append(dashboard_panel)

        # Row is not AR compatible if even one panel is AR incompatible
        if ar_compatible_row and not ar_compatible_panel:
            ar_compatible_row = False

    # If no panels present, row cannot be AR compatible
    if not panels:
        ar_compatible_row = False

    dashboard_row = DashboardRow(list_dashboard_panels=panels, depends=depends, rejects=rejects)

    return_tuple = (dashboard_row, ar_compatible_row)
    return return_tuple


async def to_dashboard_panel(request_context, app_name, panel_element, row_index, panel_index, dashboard_refresh=None,
                             show_refresh=True, search_mapper=None, async_splunk_client=None):
    """
    Parse a <panel> element into a DashboardPanel object
    :param request_context:
    :param app_name:
    :param panel_element:
    :param row_index:
    :param panel_index:
    :param dashboard_refresh:
    :param show_refresh: show refresh params, default True
    :param search_mapper:
    :param async_splunk_client:
    :return:
    """
    # populate input_tokens
    input_token_set = InputTokenSet()
    input_token_set.add_input_element_list(panel_element.findall('input'))

    # Set Panel Title
    title = get_text(panel_element.find('title'))

    # Add depends
    depends = to_token_list(panel_element.attrib.get('depends', ''))

    # Add rejects
    rejects = to_token_list(panel_element.attrib.get('rejects', ''))

    # Process different visualization types
    visualizations = []
    ar_compatible_panel = True

    for child_element in panel_element:
        visualization_type = None
        if child_element.tag == 'chart':
            visualization_type = common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_CHART
        elif child_element.tag == 'map':
            visualization_type = common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_MAP
        elif child_element.tag == 'single':
            visualization_type = common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_SINGLE
        elif child_element.tag == 'table':
            visualization_type = common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_TABLE
        elif child_element.tag == 'event':
            visualization_type = common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_EVENT
        elif child_element.tag == 'search':
            visualization_type = common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_SEARCH

        if visualization_type:
            visualization, ar_compatible_visualization = await to_dashboard_visualization(
                request_context=request_context,
                app_name=app_name,
                element=child_element,
                row_index=row_index,
                panel_index=panel_index,
                visualization_type=visualization_type,
                dashboard_refresh=dashboard_refresh,
                show_refresh=show_refresh,
                search_mapper=search_mapper,
                async_splunk_client=async_splunk_client)
            visualizations.append(visualization)

            # Panel is not AR compatible if even one visualization is AR incompatible
            if ar_compatible_panel and not ar_compatible_visualization:
                ar_compatible_panel = False

    dashboard_panel = DashboardPanel(title=title,
                                     list_dashboard_visualizations=visualizations,
                                     depends=depends,
                                     rejects=rejects,
                                     input_tokens=input_token_set.get_input_tokens())

    return_tuple = (dashboard_panel, ar_compatible_panel)
    return return_tuple


async def to_dashboard_visualization(request_context,
                                     app_name,
                                     element,
                                     row_index,
                                     panel_index,
                                     visualization_type=common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_UNKNOWN,
                                     dashboard_refresh=None,
                                     show_refresh=True,
                                     search_mapper=None,
                                     async_splunk_client=None):
    """
    Parse a <chart> element into a DashboardVisualization object
    :param request_context:
    :param app_name:
    :param element:
    :param row_index:
    :param panel_index:
    :param visualization_type: default: DASHBOARD_VISUALIZATION_UNKNOWN
    :param dashboard_refresh:
    :param show_refresh: show refresh params, default True
    :param search_mapper:
    :param async_splunk_client:
    :return:
    """
    # Parse title object
    title = get_text(element.find('title'))

    # Parse depends
    depends = to_token_list(element.attrib.get('depends', ''))

    # Parse rejects
    rejects = to_token_list(element.attrib.get('rejects', ''))

    fields_element = element.find('fields')

    fields = []
    fields_visualization_types = [VisualizationType.DASHBOARD_VISUALIZATION_EVENT,
                                  VisualizationType.DASHBOARD_VISUALIZATION_TABLE]
    if fields_element is not None and VisualizationType(visualization_type) in fields_visualization_types:
        fields = [field.strip() for field in get_text(fields_element).split(',')]

    # TODO: Consider putting search_elements as the element itself if element.tag is "search" or if vis type search

    # Parse Search Object
    if visualization_type == common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_SEARCH:
        search_elements = [element]
    else:
        search_elements = element.findall('search')

    for search_element in search_elements:
        search_type = search_element.attrib.get('type', '')
        if search_type != 'annotation':
            visualization_id, search = build_dashboard_visualization_search(search_element=search_element,
                                                                            row_index=row_index,
                                                                            panel_index=panel_index,
                                                                            dashboard_refresh=dashboard_refresh,
                                                                            show_refresh=show_refresh)
            # Only support a single search node so break after finding one
            break

    # Populate Options
    option_elements = element.findall('option')
    options_map = {option_element.get('name'): to_str(option_element.text) for option_element in option_elements}

    # Populate Ref Options
    if search.ref:
        try:
            saved_search = await fetch_saved_search(auth_header=request_context.auth_header,
                                                    owner=request_context.current_user,
                                                    ref=search.ref,
                                                    app=search.app,
                                                    async_splunk_client=async_splunk_client)
            if saved_search and saved_search.name:
                # This will override values from saved_search options_map with those defined in options_map
                saved_search.options_map.update(options_map)
                options_map = saved_search.options_map
        except SpacebridgeApiRequestError:
            # Ignore the Exception here as we still want to attempt to parse rest of dashboard
            pass

    # Populate Formats
    format_elements = element.findall('format')
    list_formats = [build_format(format_element) for format_element in format_elements]

    # Populate DrillDown
    drill_down_element = element.find('drilldown')
    drill_down = build_drill_down(drill_down_element=drill_down_element)

    # Create Dashboard Visualization
    dashboard_visualization = DashboardVisualization(visualization_type=visualization_type,
                                                     title=title,
                                                     visualization_id=visualization_id,
                                                     options_map=options_map,
                                                     search=search,
                                                     list_formats=list_formats,
                                                     drill_down=drill_down,
                                                     depends=depends,
                                                     rejects=rejects,
                                                     fields=fields)

    # Add search to search_mapper if defined
    if search_mapper:
        search_mapper.add_search_object(dashboard_visualization)

    # Check if panel is AR compatible
    ar_compatible = is_visualization_ar_compatible(dashboard_visualization)

    return_tuple = (dashboard_visualization, ar_compatible)
    return return_tuple


def is_visualization_ar_compatible(visualization):
    """
    Parse a Dashboard Visualization object and return True if it is AR compatible
    :param visualization: Dashboard Visualization object
    :return:
    """
    if visualization.visualization_type == common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_TABLE \
        or visualization.visualization_type == common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_MAP:
        return False
    if visualization.visualization_type == common_pb2.DashboardVisualization.DASHBOARD_VISUALIZATION_CHART:
        options_map_json = json.loads(visualization.options_map)
        if options_map_json.get('charting.chart') not in VALID_CHART_TYPES:
            return False
    return True


def build_format(format_element=None):
    """

    :param format_element:
    :return:
    """
    if format_element is None:
        return Format()

    format_type = to_str(format_element.get('type'))
    field = to_str(format_element.get('field'))

    # Populate Options
    option_elements = format_element.findall('option')
    options_map = {option_element.get('name'): to_str(option_element.text)
                   for option_element in option_elements} if option_elements else None

    # Populate ColorPalette
    color_palette_element = format_element.find('colorPalette')
    color_palette = build_color_palette(color_palette_element)

    # Populate Scale
    scale_element = format_element.find('scale')
    scale = build_scale(scale_element)

    return Format(format_type=format_type,
                  field=field,
                  options_map=options_map,
                  color_palette=color_palette,
                  scale=scale)


def build_color_palette(color_palette_element=None):
    """

    :param color_palette_element:
    :return:
    """
    if color_palette_element is None:
        return None

    color_palette_type = to_str(color_palette_element.get('type'))
    max_color = to_str(color_palette_element.get('maxColor'))
    mid_color = to_str(color_palette_element.get('midColor'))
    min_color = to_str(color_palette_element.get('minColor'))
    value = to_str(color_palette_element.text)

    return ColorPalette(color_palette_type=color_palette_type,
                        max_color=max_color,
                        mid_color=mid_color,
                        min_color=min_color,
                        value=value)


def build_scale(scale_element=None):
    """

    :param scale_element:
    :return:
    """
    if scale_element is None:
        return None

    scale_type = to_str(scale_element.get('type'))
    min_type = to_str(scale_element.get('minType'))
    min_value = to_str(scale_element.get('minValue'))
    mid_type = to_str(scale_element.get('midType'))
    mid_value = to_str(scale_element.get('midValue'))
    max_type = to_str(scale_element.get('maxType'))
    max_value = to_str(scale_element.get('maxValue'))
    value = to_str(scale_element.text)

    return Scale(scale_type=scale_type,
                 min_type=min_type,
                 min_value=min_value,
                 mid_type=mid_type,
                 mid_value=mid_value,
                 max_type=max_type,
                 max_value=max_value,
                 value=value)
