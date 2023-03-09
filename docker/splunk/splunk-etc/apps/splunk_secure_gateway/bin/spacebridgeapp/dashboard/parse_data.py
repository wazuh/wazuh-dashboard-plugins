"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Parse a Dashboard Description from a views entry

Parses an 'entry' object from Splunk API response formatted as json string:
https://<host>:<mPort>/servicesNS/{user}/{app_name}/data/ui/views?output_mode=json
"""

import json
from pkg_resources import parse_version
import xml.etree.cElementTree as ElementTree
from spacebridgeapp.util import py23
import spacebridgeapp.dashboard.dashboard_helpers as helper
from spacebridgeapp.dashboard import parse_helpers
from spacebridgeapp.data.dashboard_data import DashboardDescription
from spacebridgeapp.data.dashboard_data import DashboardDefinition
from spacebridgeapp.udf.udf_data import UdfDashboardDescription
from spacebridgeapp.dashboard.parse_dashboard_definition import to_dashboard_definition
from spacebridgeapp.util.app_info import fetch_display_app_name
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME


_VERSION__1_0_0 = parse_version("1")
UDF_DASHBOARD_VERSION = parse_version("2")


def _parse_dashboard_version(content):
    if 'version' not in content:
        return _VERSION__1_0_0

    return parse_version(str(content.get('version')))


def _is_udf_data(content):
    return content is not None and 'version' in content and _parse_dashboard_version(content) >= UDF_DASHBOARD_VERSION


async def to_dashboard_description(json_object,
                                   is_ar=False,
                                   request_context=None,
                                   async_splunk_client=None,
                                   show_refresh=True,
                                   minimal=False):
    """
    Parse a dashboard json object and return a DashboardDescription
    :param json_object: [dict] representing json object
    :param is_ar: if true, only return dashboard description if the dashboard is AR compatible
    :param request_context:
    :param async_splunk_client:
    :param show_refresh: show refresh params, default True
    :param minimal: return minimal DashboardDescription, default True
    :return:
    """

    if isinstance(json_object, dict):
        dashboard_id = helper.shorten_dashboard_id_from_url(get_string(json_object.get('id')))
        name = get_string(json_object.get('name'))
        content = json_object.get('content')
        acl = json_object.get('acl')

        if acl is not None:
            app_name = get_string(acl.get('app'))

        if content is not None:
            title = get_string(content.get('label'))
            description = get_string(content.get('description'))
            dashboard_type = get_string(content.get('eai:type'))
            tags_str = content.get('tags')
            tags = tags_str.split(',') if tags_str else []

            # TODO: Client not using currently, figure out how to fill out
            uses_custom_css = False
            uses_custom_javascript = False
            uses_custom_visualization = False
            uses_custom_html = dashboard_type == 'html'

            # Determine if dashboard is UDF type
            is_udf = _is_udf_data(content)

            # Populate display_app_name
            display_app_name = await fetch_display_app_name(request_context=request_context,
                                                            app_name=app_name,
                                                            async_splunk_client=async_splunk_client)

            # Return minimal DashboardDescription
            if minimal:
                return DashboardDescription(dashboard_id=dashboard_id,
                                            title=title,
                                            app_name=app_name,
                                            display_app_name=display_app_name,
                                            uses_custom_css=uses_custom_css,
                                            uses_custom_javascript=uses_custom_javascript,
                                            uses_custom_visualization=uses_custom_visualization,
                                            uses_custom_html=uses_custom_html,
                                            is_udf=is_udf,
                                            tags=tags)

            # Parse the DashboardDefinition here
            # Pull out dashboard xml data and parse to get DashboardDefinition
            dashboard_xml_data = content.get('eai:data')
            root_element = get_root_element(dashboard_xml_data)
            theme = get_string(root_element.attrib.get('theme') if root_element else None)

            if is_udf:
                jsn = json.loads(parse_helpers.get_text(root_element.find('definition')))
                definition = UdfDashboardDescription.from_json(jsn)
                definition.dashboard_id = dashboard_id

            elif dashboard_xml_data and dashboard_type == 'views':
                definition = await to_dashboard_definition(request_context=request_context,
                                                           app_name=app_name,
                                                           root=root_element,
                                                           dashboard_id=dashboard_id,
                                                           show_refresh=show_refresh,
                                                           async_splunk_client=async_splunk_client)
                if is_ar and (not definition.ar_compatible or is_legacy_ar_dashboard(name, app_name)):
                    return None
            else:
                definition = DashboardDefinition(dashboard_id=dashboard_id,
                                                 title=title,
                                                 description=description)

            input_tokens = definition.input_tokens if hasattr(definition, 'input_tokens') else {}
            meta = definition.meta if hasattr(definition, 'meta') else None

            submit_button = definition.submit_button if hasattr(definition, 'submit_button') else False
            auto_run = definition.auto_run if hasattr(definition, 'auto_run') else False

            return DashboardDescription(dashboard_id=dashboard_id,
                                        title=title,
                                        description=description,
                                        app_name=app_name,
                                        display_app_name=display_app_name,
                                        uses_custom_css=uses_custom_css,
                                        uses_custom_javascript=uses_custom_javascript,
                                        uses_custom_visualization=uses_custom_visualization,
                                        uses_custom_html=uses_custom_html,
                                        input_tokens=input_tokens,
                                        meta=meta,
                                        definition=definition,
                                        submit_button=submit_button,
                                        auto_run=auto_run,
                                        is_udf=is_udf,
                                        theme=theme,
                                        tags=tags)

    # Return empty proto in default case
    return DashboardDescription()


def get_root_element(xml_data_string):
    """
    Parses an xml string and returns the corresponding xml object
    """
    if not xml_data_string:
        return None

    # Need to ensure string we pass to ElementTree is not unicode
    if py23.py2_check_unicode(xml_data_string):
        xml_string = xml_data_string.encode('utf-8')
    else:
        xml_string = xml_data_string

    # Parse xml string to Element, expecting ascii string
    root = ElementTree.fromstring(xml_string)

    return root


def get_string(s):
    """
    Helper to return empty string if
    :param s:
    :return:
    """
    return '' if s is None else str(s)


def is_legacy_ar_dashboard(name, app_name):
    """
    Helper to determine whether or not
    a dashbaord is a legacy ar dashboard
    :param name: the dashbaord label
    :param app_name: the app the dashboard is associated with
    :return bool:
    """
    return name and name.startswith('ar_') and app_name == SPACEBRIDGE_APP_NAME
