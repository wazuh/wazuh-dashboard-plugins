"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Parse a ITSI Glass Table into a DashboardDescription

Parses an glass_table object from itoa_interface response formatted as json string:
https://docs.splunk.com/Documentation/ITSI/latest/RESTAPI/ITSIRESTAPIreference#itoa_interface.2F.26lt.3Bobject_type.26gt.3B
"""
import spacebridgeapp.dashboard.dashboard_helpers as helper
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import ITSI, SPACEBRIDGE_APP_NAME, KEY, ITSI_GLASS_TABLE, \
    ITSI_GLASS_TABLES_DISPLAY_APP_NAME
from spacebridgeapp.data.dashboard_data import DashboardDescription
from spacebridgeapp.udf.udf_data import UdfDashboardDescription

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_parse_glass_table.log", "parse_glass_table")

GT_VERSION = 'gt_version'
GT_VERSION_ALLOWED = 'beta'


async def to_dashboard_description(json_object, minimal=False):
    """
    Given a glass_table dashboard definition parse the value and return a DashboardDescription object
    :param json_object:
    :param minimal:
    :return:
    """
    if isinstance(json_object, dict):
        app_name = ITSI_GLASS_TABLE
        display_app_name = ITSI_GLASS_TABLES_DISPLAY_APP_NAME
        acl = json_object.get('acl')
        user = acl.get('owner', 'nobody')
        title = json_object.get('title')
        description = json_object.get('description')
        dashboard_key = json_object.get(KEY)
        # We have a special app_name for the dashboard_id.  We don't want any name collisions with regular app
        dashboard_id = helper.generate_dashboard_id(owner=user, app_name=app_name, dashboard_name=dashboard_key)
        gt_version = json_object.get(GT_VERSION)

        # Currently only support the gt_version == 'beta' as that is UDF
        is_udf = gt_version == GT_VERSION_ALLOWED

        # Short circuit here if we don't understand the format don't return back to client
        if not is_udf:
            return None

        if minimal:
            return DashboardDescription(dashboard_id=dashboard_id,
                                        title=title,
                                        app_name=app_name,
                                        display_app_name=display_app_name,
                                        is_udf=is_udf)

        # Parse the Description
        definition = UdfDashboardDescription.from_json(json_object.get('definition'))
        definition.dashboard_id = dashboard_id

        return DashboardDescription(dashboard_id=dashboard_id,
                                    title=title,
                                    description=description,
                                    app_name=app_name,
                                    display_app_name=display_app_name,
                                    definition=definition,
                                    is_udf=is_udf)
    # Unable to parse return None
    return None
