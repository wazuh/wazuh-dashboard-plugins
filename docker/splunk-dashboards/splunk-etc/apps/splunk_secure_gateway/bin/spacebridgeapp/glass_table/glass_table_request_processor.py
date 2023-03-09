"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process Glass Table Requests
"""
import json
import operator
from http import HTTPStatus
import spacebridgeapp.dashboard.dashboard_helpers as helper
from spacebridgeapp.util.constants import ITSI, ITSI_GLASS_TABLE, SPACEBRIDGE_APP_NAME
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.glass_table.parse_glass_table import to_dashboard_description, KEY, GT_VERSION, GT_VERSION_ALLOWED


LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_glass_table_request_processor.log", "glass_table_request_processor")

REGEX = '$regex'
FILTER_STRING = 'filter_string'


def generate_key_filter(dashboard_ids):
    """
    Helper method to generate a filter for the _key field
    :param dashboard_ids:
    :return:
    """
    if not dashboard_ids:
        return None

    # Parse dashboards_ids
    dashboard_keys = []
    for dashboard_id in dashboard_ids:
        user, app_name, dashboard_name = helper.parse_dashboard_id(dashboard_id)
        # Only use ones with 'itsi_glass_tables' as app name
        if app_name == ITSI_GLASS_TABLE:
            # Only need to search by dashboard name as it will be a _key
            dashboard_keys.append(dashboard_name)

    if not dashboard_keys:
        return None

    return "|".join(dashboard_keys)


def generate_filter(dashboard_ids):
    """
    Helper to generate the filter param for glass_table API call
    :param dashboard_ids:
    :return:
    """
    key_filter = generate_key_filter(dashboard_ids)

    api_filter = {
        "shared": "true",
        FILTER_STRING: {
            GT_VERSION: {
                REGEX: GT_VERSION_ALLOWED
            }
        }
    }

    if key_filter:
        api_filter[FILTER_STRING][KEY] = {REGEX: key_filter}

    return json.dumps(api_filter)


def get_glass_table_api_params(dashboard_ids=[], limit=0, offset=0, minimal=False):
    """
    Helper method to setup params for glass_table API
    :param dashboard_ids:
    :param limit:
    :param offset:
    :param minimal:
    :return:
    """
    params = {}
    glass_table_filter = generate_filter(dashboard_ids)
    if glass_table_filter:
        params['filter'] = glass_table_filter

    if limit:
        params['limit'] = limit

    if offset:
        params['offset'] = offset

    if minimal:
        params['fields'] = 'acl.owner,title,_key,gt_version,description'

    return params


async def append_glass_table_descriptions(request_context, dashboard_list, total, continuation_available, offset=0,
                                          max_results=0, app_names=None, dashboard_ids=None, async_itsi_client=None,
                                          minimal=False):
    """
    This is a helper method to fetch ITSI glass_tables and append them to dashboard_list
    :param request_context:
    :param offset:
    :param max_results:
    :param app_names:
    :param dashboard_ids:
    :param dashboard_list:
    :param total:
    :param continuation_available:
    :param async_itsi_client:
    :param minimal:
    :return:
    """
    # We only append if 'itsi' has been selected or if no apps selected (i.e. return all)
    if not app_names or ITSI in app_names:
        # Generate Params for APIs
        use_pagination = not app_names and max_results > 0
        limit_avail = max_results - len(dashboard_list)
        limit = limit_avail if use_pagination and limit_avail > 0 else 0
        offset = max(offset - total, 0)

        # We want the total_count so we don't pass in a limit or offset
        params = get_glass_table_api_params(dashboard_ids=dashboard_ids)
        # Make API call to see if any glass_table exist first
        total_count = await async_itsi_client.async_get_glass_table_count(auth_header=request_context.auth_header,
                                                                          params=params)
        if total_count > 0:
            total += total_count
            # If we are paginating and max_results is == len(dashboard_list) we don't need to fetch anymore but need
            # to update the pagination status
            if limit_avail <= 0 and use_pagination:
                continuation_available = True
            else:
                if use_pagination:
                    limit = max_results - len(dashboard_list)
                    continuation_available = total_count - offset > limit

                # Here we want to limit the number of responses
                params = get_glass_table_api_params(dashboard_ids=dashboard_ids, limit=limit, offset=offset,
                                                    minimal=minimal)
                response = await async_itsi_client.async_get_glass_table(auth_header=request_context.auth_header,
                                                                         params=params)
                if response.code == HTTPStatus.OK:
                    response_json = await response.json()
                    for glass_table in response_json:
                        dashboard_definition = await to_dashboard_description(json_object=glass_table,
                                                                              minimal=minimal)
                        if dashboard_definition:
                            dashboard_list.append(dashboard_definition)

                    # sort dashboard_list by app_id, name
                    dashboard_list.sort(key=operator.attrgetter('app_name', 'title'))
                else:
                    LOGGER.warn(f"Unable to query {ITSI} glass_table api with params={params}")

    return dashboard_list, total, continuation_available


async def fetch_glass_table_dashboard_description(request_context, dashboard_id,
                                                  async_itsi_client=None):
    """
    Fetch a single glass_table dashboard and
    :param request_context:
    :param dashboard_id:
    :param async_itsi_client:
    :return:
    """
    if not async_itsi_client:
        raise SpacebridgeApiRequestError(
            f"ITSI client missing.  Unable to fetch glass_table dashboard with dashboard_id={dashboard_id}"
        )

    _, _, key = helper.parse_dashboard_id(dashboard_id)
    response = await async_itsi_client.async_get_glass_table(auth_header=request_context.auth_header, key=key)

    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(
            f"Failed fetch_glass_table_dashboard_description dashboard_id={dashboard_id}, "
            f"response.code={response.code}, response.text={response_text}", status_code=response.code)

    response_json = await response.json()
    dashboard_definition = await to_dashboard_description(json_object=response_json)

    if not dashboard_definition:
        # log result in the event the dashboardId is not valid
        raise SpacebridgeApiRequestError(f"No Entries found for dashboard_id={dashboard_id}",
                                         status_code=HTTPStatus.NOT_FOUND)
    return dashboard_definition
