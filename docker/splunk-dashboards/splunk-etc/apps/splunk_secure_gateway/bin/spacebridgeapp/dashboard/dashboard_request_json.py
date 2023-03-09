"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for any requests that will return the raw json
"""
from http import HTTPStatus
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
from spacebridgeapp.logging.spacebridge_logging import setup_logging
from spacebridgeapp.dashboard.dashboard_helpers import generate_search_str
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_dashboard_request_json.log", "dashboard_request_json")

GLOBAL_APP_SEARCH = '-'
DEFAULT_COUNT = 0


def _parse_dashboard_list_json(response_json):
    total = response_json.get('paging', {}).get('total')
    dashboards = response_json.get('entry')
    return total, dashboards


async def fetch_dashboard_list_for_app(request_context, app_name, params, async_splunk_client):
    response = await async_splunk_client.async_get_dashboard_list_request(auth_header=request_context.auth_header,
                                                                          app_name=app_name,
                                                                          params=params)

    LOGGER.debug('fetch_dashboard_list_for_app response=%s', response.code)

    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(f"Failed fetch_dashboard_list_json "
                                         f"response.code={response.code}, response.text={response_text}",
                                         status_code=response.code)

    response_json = await response.json()
    total, dashboards = _parse_dashboard_list_json(response_json)

    LOGGER.debug('fetch_dashboard_list_for_app app_name=%s, total=%s', app_name, total)

    return total, dashboards


def _generate_params(app_name, dashboard_ids, dashboard_tags, tagging_config_map=None,
                     minimal_list=True, offset=0, max_results=0):
    """
    Helper method to generate params object for DashboardList API call
    :param app_name:
    :param dashboard_ids:
    :param dashboard_tags:
    :param tagging_config_map:
    :param minimal_list:
    :param offset:
    :param max_results:
    :return:
    """
    search_app_name = []
    global_search = True

    if not tagging_config_map:
        tagging_config_map = {}

    if app_name != GLOBAL_APP_SEARCH:
        search_app_name = [app_name]
        global_search = False

    search_str = generate_search_str(app_names=search_app_name,
                                     dashboard_ids=dashboard_ids,
                                     dashboard_tags=dashboard_tags,
                                     tagging_config_map=tagging_config_map)
    params = {'output_mode': 'json',
              'search': search_str,
              'sort_dir': 'asc',
              'sort_key': 'label',
              'sort_mode': 'alpha',
              'count': DEFAULT_COUNT,
              'digest': int(minimal_list)}

    if global_search:
        params['offset'] = offset
        params['count'] = max_results

    return params


async def fetch_dashboard_list_json(request_context,
                                    offset=0,
                                    max_results=0,
                                    app_names=None,
                                    dashboard_ids=None,
                                    dashboard_tags=None,
                                    tagging_config_map=None,
                                    async_splunk_client=None,
                                    minimal_list=True):
    """
    Fetch the dashboard list json Splunk api /data/ui/views
    :param request_context:
    :param offset:
    :param max_results:
    :param app_names:
    :param dashboard_ids:
    :param dashboard_tags:
    :param tagging_config_map:
    :param async_splunk_client:
    :param minimal_list: Causes the API to be called with digest=1, should be used if dashboard structure is not needed
    :return:
    """
    dashboards = []
    total = 0
    continuation_available = False

    if app_names is None or len(app_names) == 0:
        app_names = [GLOBAL_APP_SEARCH]
        continuation_available = True

    LOGGER.debug("Fetching dashboards for apps=%s", app_names)

    for app in app_names:
        params_app = _generate_params(app_name=app, dashboard_tags=dashboard_tags, dashboard_ids=dashboard_ids,
                                      tagging_config_map=tagging_config_map, minimal_list=minimal_list, offset=offset,
                                      max_results=max_results)
        total_app, dashboards_app = await fetch_dashboard_list_for_app(request_context=request_context,
                                                                       app_name=app, params=params_app,
                                                                       async_splunk_client=async_splunk_client)

        total += total_app

        for d in dashboards_app:
            dashboards.append(d)

    if len(dashboards) < max_results:
        continuation_available = False

    return total, dashboards, continuation_available

