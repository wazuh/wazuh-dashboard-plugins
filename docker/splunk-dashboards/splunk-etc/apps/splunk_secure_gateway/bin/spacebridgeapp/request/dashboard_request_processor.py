"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process Dashboard Requests
"""
import json
import sys
import time
from http import HTTPStatus
import spacebridgeapp.dashboard.parse_data as parse
import spacebridgeapp.dashboard.dashboard_helpers as dashboard_helpers
from spacebridgeapp.data.event_handler import to_search_job_metadata, SearchJobMetadata
from spacebridgeapp.search.search_job_params import get_search_job_request_params
from spacebridgeapp.search.input_token_support import inject_tokens_into_string, set_default_token_values, \
    inject_time_tokens
from spacebridgeapp.dashboard.dashboard_meta import set_dashboard_meta
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.subscriptions.process_trellis import process_trellis_format
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.dashboard.dashboard_meta import fetch_dashboard_meta
from spacebridgeapp.dashboard.dashboard_request_json import fetch_dashboard_list_json
from spacebridgeapp.data.dashboard_data import DashboardData, DashboardVisualizationId, UserDashboardMeta, \
    VisualizationData
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.metrics.dashboard_request_metrics import send_dashboard_list_request_metrics_to_telemetry
from spacebridgeapp.request.app_list_request_processor import fetch_dashboard_app_list_with_default
from spacebridgeapp.glass_table.glass_table_request_processor import append_glass_table_descriptions, \
    fetch_glass_table_dashboard_description
from spacebridgeapp.tags.dashboard_tag_util import get_dashboard_tags, get_tagging_config_map

if sys.version_info < (3, 0):
    import urllib

else:
    import urllib.parse as urllib

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_dashboard_request_processor.log",
                       "dashboard_request_processor")

# API Name Constants
DASHBOARD_LIST_REQUEST = "DASHBOARD_LIST_REQUEST"


async def process_dashboard_list_request(request_context,
                                         client_single_request,
                                         server_single_response,
                                         async_client_factory):
    """
    This method will process dashboard list requests

    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_client_factory:
    :return:
    """

    await populate_dashboard_list_response(
        request_context, client_single_request, server_single_response, async_client_factory)


async def process_dashboard_get_request(request_context,
                                        client_single_request,
                                        server_single_response,
                                        async_client_factory):
    """
    This method will process single dashboard get requests

    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_client_factory:
    :return:
    """

    await populate_dashboard_get_response(
        request_context, client_single_request, server_single_response, async_client_factory)


async def process_dashboard_set_request(request_context,
                                        client_single_request,
                                        server_single_response,
                                        async_kvstore_client):
    """
    This method will process single dashboard set requests

    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_kvstore_client:
    :return:
    """

    await populate_dashboard_set_response(
        request_context, client_single_request, server_single_response, async_kvstore_client)


async def process_dashboard_data_request(request_context,
                                         client_single_request,
                                         server_single_response,
                                         async_client_factory):
    """
    This method will process a dashboard data request

    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_client_factory:
    :return:
    """
    await populate_dashboard_data_response(
        request_context, client_single_request, server_single_response, async_client_factory)


async def populate_dashboard_list_response(request_context,
                                           client_single_request,
                                           single_server_response,
                                           async_client_factory):
    """
    This method will create an async http request to splunk api data/ui/views and return a list of DashboardDescription
    protos in a single_server_response object

    :param request_context:
    :param client_single_request: incoming request
    :param single_server_response: outgoing response
    :param async_client_factory: async client used to make https request
    :return:
    """

    LOGGER.info("Start populating response for dashboard list request")

    offset = client_single_request.dashboardListRequest.offset
    max_results = client_single_request.dashboardListRequest.maxResults
    dashboard_ids = client_single_request.dashboardListRequest.dashboardIds
    minimal_list = client_single_request.dashboardListRequest.minimalList
    is_ar = client_single_request.dashboardListRequest.isAR
    useragent = client_single_request.userAgent

    # async clients
    async_splunk_client = async_client_factory.splunk_client()
    async_kvstore_client = async_client_factory.kvstore_client()
    async_telemetry_client = async_client_factory.telemetry_client()
    async_itsi_client = async_client_factory.itsi_client()

    # Measure time taken to execute dashboard list request
    time_before = time.time()
    # fetch dashboard bodies
    dashboard_bodies, total, continuation_available = await fetch_dashboard_descriptions(
        request_context=request_context,
        offset=offset,
        max_results=max_results,
        dashboard_ids=dashboard_ids,
        minimal_list=minimal_list,
        is_ar=is_ar,
        async_splunk_client=async_splunk_client,
        async_kvstore_client=async_kvstore_client,
        async_itsi_client=async_itsi_client)

    time_after = time.time()
    latency = (time_after - time_before) * 1000.0
    LOGGER.info("Time taken to execute dashboard list request: {:0.3f}ms".format(latency))
    await send_dashboard_list_request_metrics_to_telemetry(DASHBOARD_LIST_REQUEST, latency, request_context,
                                                           async_telemetry_client, LOGGER, useragent=useragent)

    dashboard_protos = [dashboard.to_protobuf() for dashboard in dashboard_bodies]
    LOGGER.info('Fetch dashboard list size={}'.format(len(dashboard_protos)))

    # populate dashboard list response
    single_server_response.dashboardListResponse.dashboards.extend(dashboard_protos)
    single_server_response.dashboardListResponse.offset = offset
    single_server_response.dashboardListResponse.maxResults = max_results
    single_server_response.dashboardListResponse.count = len(dashboard_protos)
    single_server_response.dashboardListResponse.dashboardIds.extend(dashboard_ids)
    single_server_response.dashboardListResponse.total = total
    single_server_response.dashboardListResponse.minimalList = minimal_list
    single_server_response.dashboardListResponse.isAR = is_ar

    single_server_response.dashboardListResponse.continuation.SetInParent()
    single_server_response.dashboardListResponse.continuation.nextOffset = offset + len(dashboard_protos)
    single_server_response.dashboardListResponse.continuation.hasNextPage = continuation_available

    LOGGER.info("Finished populating response for dashboard list request")


async def fetch_dashboard_descriptions(request_context,
                                       offset=0,
                                       max_results=0,
                                       dashboard_ids=None,
                                       minimal_list=False,
                                       is_ar=False,
                                       default_app_names=None,
                                       async_splunk_client=None,
                                       async_kvstore_client=None,
                                       async_itsi_client=None):
    """
    Method makes async http call to get dashboard list and return a list of DashboardDescription objects

    :param request_context:
    :param offset: starting position to retrieve dashboards
    :param max_results: maximum number of dashboards per page
    :param dashboard_ids: set of dashboard IDs to retrieve
    :param minimal_list: return light dashboard descriptions if true (exclude dashboard definition)
    :param is_ar: only fetch dashboard description if dashboard is AR compatible
    :param default_app_names: A default list app_names to filter if none is found in kvstore
    :param async_splunk_client:
    :param async_kvstore_client:
    :param async_itsi_client:
    :return:
    """

    if dashboard_ids is None:
        dashboard_ids = []

    if default_app_names is None:
        default_app_names = []

    # Set max_results to dashboard_list_max_count if specified in securegateway.conf
    max_results = max_results if max_results != 0 else config.get_dashboard_list_max_count()

    # Fetch dashboard_app_list, default is [] if list not found
    app_names = await fetch_dashboard_app_list_with_default(request_context=request_context,
                                                            default_app_names=default_app_names,
                                                            async_kvstore_client=async_kvstore_client,
                                                            async_splunk_client=async_splunk_client)

    # Fetch the tags associated with the requesting client device
    dashboard_tags = await get_dashboard_tags(request_context=request_context,
                                              async_splunk_client=async_splunk_client,
                                              async_kvstore_client=async_kvstore_client)

    # Fetch the 'enable' status of tagging feature by app_id
    tagging_config_map = await get_tagging_config_map(request_context=request_context,
                                                      async_kvstore_client=async_kvstore_client)

    total, dashboards_result, continuation_available = await fetch_dashboard_list_json(
        request_context=request_context, offset=offset, max_results=max_results, app_names=app_names,
        dashboard_ids=dashboard_ids, dashboard_tags=dashboard_tags, tagging_config_map=tagging_config_map,
        async_splunk_client=async_splunk_client, minimal_list=minimal_list)

    dashboard_list = []

    # Process Dashboards from regular Splunk views endpoint
    for entry_json in dashboards_result:
        try:
            dashboard_description = await parse.to_dashboard_description(
                entry_json, is_ar=is_ar, request_context=request_context, async_splunk_client=async_splunk_client,
                minimal=minimal_list)
            if dashboard_description:
                dashboard_list.append(dashboard_description)
        except Exception as e:
            LOGGER.warning("Unable to parse dashboard description dashboard_id={}, exception={}"
                           .format(entry_json['id'], e))

    # Append ITSI Glass Tables if available, will append descriptions to dashboard_list and update metadata
    dashboard_list, total, continuation_available = await append_glass_table_descriptions(
        request_context=request_context,
        dashboard_list=dashboard_list,
        total=total,
        continuation_available=continuation_available,
        offset=offset,
        max_results=max_results,
        app_names=app_names,
        dashboard_ids=dashboard_ids,
        async_itsi_client=async_itsi_client,
        minimal=minimal_list)

    # Fetch dictionary of dashboard metas
    if async_kvstore_client is not None:
        dashboard_meta_dict = await fetch_dashboard_meta(request_context=request_context,
                                                         async_kvstore_client=async_kvstore_client)
        if dashboard_meta_dict:
            for description in dashboard_list:
                if description.dashboard_id in dashboard_meta_dict:
                    description.is_favorite = dashboard_meta_dict[description.dashboard_id].is_favorite

    LOGGER.debug(
        'fetch_dashboard_list_json total_length=%d, is_ar=%s, minimal_list=%s, offset=%d, max_results=%d, '
        'dashboard_ids=%s, dashboard_tags=%s, default_app_names=%s',
        total, is_ar, minimal_list, offset, max_results, dashboard_ids, dashboard_tags, default_app_names)
    return_tuple = (dashboard_list, total, continuation_available)
    return return_tuple


async def populate_dashboard_get_response(request_context,
                                          client_single_request,
                                          single_server_response,
                                          async_client_factory):
    """
    This method will create an async http request to splunk api data/ui/views/[dashboard_name] and return a
    DashboardDescription proto in a single_server_response object

    :param request_context:
    :param client_single_request:
    :param single_server_response:
    :param async_client_factory:
    :return:
    """
    async_splunk_client = async_client_factory.splunk_client()
    async_kvstore_client = async_client_factory.kvstore_client()
    async_itsi_client = async_client_factory.itsi_client()

    dashboard_id = client_single_request.dashboardGetRequest.dashboardId
    LOGGER.info("Start populating response for dashboard get request")

    # fetch dashboard body
    dashboard_body = await fetch_dashboard_description(request_context=request_context,
                                                       dashboard_id=dashboard_id,
                                                       async_splunk_client=async_splunk_client,
                                                       async_kvstore_client=async_kvstore_client,
                                                       async_itsi_client=async_itsi_client)

    # set server response payload
    dashboard_body.set_protobuf(single_server_response.dashboardGetResponse.dashboard)

    LOGGER.info("Finished populating response for dashboard get request")


async def populate_dashboard_set_response(request_context,
                                          client_single_request,
                                          single_server_response,
                                          async_kvstore_client):
    """
    This method will create an async http request to splunk api data/ui/views/[dashboard_name] and return a
    DashboardDescription proto in a single_server_response object

    :param request_context:
    :param client_single_request:
    :param single_server_response:
    :param async_kvstore_client:
    :return:
    """
    LOGGER.info("Start populating response for dashboard set request")

    dashboard_meta = UserDashboardMeta(dashboard_id=client_single_request.dashboardSetRequest.dashboardId,
                                       is_favorite=client_single_request.dashboardSetRequest.isFavorite)

    dashboard_id = await set_dashboard_meta(request_context=request_context,
                                            dashboard_meta=dashboard_meta,
                                            async_kvstore_client=async_kvstore_client)

    # Populate Server Response
    single_server_response.dashboardSetResponse.dashboardId = dashboard_id

    LOGGER.info("Finished populating response for dashboard set request")


async def fetch_splunk_dashboard_description(request_context, dashboard_id,
                                             show_refresh=True, async_splunk_client=None):
    """
    Fetch a dashboard description json object calling Splunk views API
    :param request_context:
    :param dashboard_id:
    :param show_refresh:
    :param async_splunk_client:
    :return:
    """
    params = {'output_mode': 'json'}
    owner, app_name, dashboard_name = dashboard_helpers.parse_dashboard_id(dashboard_id)

    # Decode paramters because url is encoded in append_path_to_uri before making request
    owner, app_name, dashboard_name = [urllib.unquote(x) for x in [owner, app_name, dashboard_name]]

    if not owner or owner == '-':
        owner = request_context.current_user
        LOGGER.info(f"No owner given in dashboard_id={dashboard_id} taking owner={owner}")
    response = await async_splunk_client.async_get_dashboard_request(owner=owner, app_name=app_name,
                                                                     auth_header=request_context.auth_header,
                                                                     params=params, dashboard_name=dashboard_name)

    LOGGER.info(f'fetch_dashboard_description response={response.code}')

    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(
            f"Failed fetch_dashboard_description request dashboard_id={dashboard_id}, response.code={response.code}, "
            f"response.text={response_text}", status_code=response.code)

    response_json = await response.json()
    entry_json_list = response_json.get('entry')

    if not entry_json_list:
        # log result in the event the dashboardId is not valid
        raise SpacebridgeApiRequestError(f"No Entries found for dashboard_id={dashboard_id}",
                                         status_code=HTTPStatus.NOT_FOUND)

    dashboard = await parse.to_dashboard_description(entry_json_list[0],
                                                     request_context=request_context,
                                                     async_splunk_client=async_splunk_client,
                                                     show_refresh=show_refresh)
    return dashboard


async def fetch_dashboard_description(request_context,
                                      dashboard_id=None,
                                      show_refresh=True,
                                      async_splunk_client=None,
                                      async_kvstore_client=None,
                                      async_itsi_client=None):
    """
    Method will make async http call to get single dashboard and return a DashboardDescription object

    :param request_context:
    :param dashboard_id:
    :param show_refresh: show refresh params, default True
    :param async_splunk_client:
    :param async_kvstore_client:
    :param async_itsi_client:
    :return:
    """

    _, app_name, _ = dashboard_helpers.parse_dashboard_id(dashboard_id)
    if app_name != constants.ITSI_GLASS_TABLE:
        dashboard = await fetch_splunk_dashboard_description(request_context=request_context,
                                                             dashboard_id=dashboard_id,
                                                             show_refresh=show_refresh,
                                                             async_splunk_client=async_splunk_client)
    else:
        dashboard = await fetch_glass_table_dashboard_description(request_context=request_context,
                                                                  dashboard_id=dashboard_id,
                                                                  async_itsi_client=async_itsi_client)

    if async_kvstore_client is not None:
        dashboard_meta = await fetch_dashboard_meta(request_context=request_context,
                                                    dashboard_id=dashboard_id,
                                                    async_kvstore_client=async_kvstore_client)
        if dashboard_meta:
            dashboard.is_favorite = dashboard_meta.is_favorite

    return dashboard


async def populate_dashboard_data_response(request_context,
                                           client_single_request,
                                           single_server_response,
                                           async_client_factory):
    """
    Populate the DashboardDataResponse proto

    :param request_context:
    :param client_single_request:
    :param single_server_response:
    :param async_client_factory:
    :return:
    """
    async_splunk_client = async_client_factory.splunk_client()
    async_kvstore_client = async_client_factory.kvstore_client()

    dashboard_visualization_id_proto = client_single_request.dashboardDataRequest.dashboardVisualizationId
    dashboard_id = dashboard_visualization_id_proto.dashboardId
    visualization_id = dashboard_visualization_id_proto.visualizationId
    dashboard_visualization_id = DashboardVisualizationId(dashboard_id=dashboard_id, visualization_id=visualization_id)

    input_tokens = client_single_request.dashboardDataRequest.inputTokens

    LOGGER.info("Start populating response for dashboard data request")

    # fetch dashboard body
    dashboard_description = await fetch_dashboard_description(request_context=request_context,
                                                              dashboard_id=dashboard_id,
                                                              async_splunk_client=async_splunk_client,
                                                              async_kvstore_client=async_kvstore_client)

    set_default_token_values(input_tokens, dashboard_description.input_tokens)
    visualization = dashboard_description.get_visualization(visualization_id)

    if visualization is None:
        raise SpacebridgeApiRequestError('Visualization ID not found! dashboard_id={}, visualization_id={}'.format(
            dashboard_id, visualization_id), status_code=HTTPStatus.NOT_FOUND)

    # make search call if visualization is present
    dashboard_data = await fetch_dashboard_data(request_context=request_context,
                                                dashboard_visualization_id=dashboard_visualization_id,
                                                visualization=visualization,
                                                input_tokens=input_tokens,
                                                async_splunk_client=async_splunk_client)

    # set server response payload
    dashboard_data.set_protobuf(single_server_response.dashboardDataResponse.dashboardData)

    LOGGER.info("Finished populating response for dashboard data request")


async def fetch_dashboard_data(request_context,
                               dashboard_visualization_id=None,
                               visualization=None,
                               input_tokens=None,
                               async_splunk_client=None):
    """
    Fetch DashboardData given visualization_id
    :param request_context:
    :param dashboard_visualization_id:
    :param visualization:
    :param input_tokens:
    :param async_splunk_client:
    :return:
    """
    dashboard_id = dashboard_visualization_id.dashboard_id
    visualization_id = dashboard_visualization_id.visualization_id
    owner, app_name, _ = dashboard_helpers.parse_dashboard_id(dashboard_id)

    LOGGER.info("Start fetch_dashboard_data dashboard_id={}, visualization_id={}"
                .format(dashboard_id, visualization_id))

    # inject methods can handle the empty input_tokens
    visualization.search.query = inject_tokens_into_string(input_tokens, visualization.search.query)
    visualization.search.earliest, visualization.search.latest = inject_time_tokens(input_tokens,
                                                                                    visualization.search.earliest,
                                                                                    visualization.search.latest)

    # perform export call to retrieve visualization data without search_id
    visualization_data = await fetch_visualization_data(request_context=request_context,
                                                        owner=owner,
                                                        app_name=app_name,
                                                        visualization=visualization,
                                                        async_splunk_client=async_splunk_client)

    trellis_enabled = json.loads(visualization.options_map).get('trellis.enabled')
    trellis_enabled_bool = False if trellis_enabled is None else bool(int(trellis_enabled))
    visualization.search.trellis_enabled = trellis_enabled_bool
    visualization.search.trellis_split_by = json.loads(visualization.options_map).get('trellis.splitBy')
    if trellis_enabled_bool:
        trellis_visualization_data = process_trellis_format(visualization.search, visualization_data)
        dashboard_data = DashboardData(dashboard_visualization_id=dashboard_visualization_id,
                                       trellis_visualization_data=trellis_visualization_data)
    else:
        dashboard_data = DashboardData(dashboard_visualization_id=dashboard_visualization_id,
                                       visualization_data=visualization_data)

    LOGGER.info("Finished fetch_dashboard_data dashboard_id={}, visualization_id={}, visualization.search.query={}"
                .format(dashboard_id, visualization_id, visualization.search.query))

    return dashboard_data


async def fetch_visualization_data(request_context,
                                   owner=None,
                                   app_name=None,
                                   visualization=None,
                                   async_splunk_client=None):
    """
    Perform async call to fetch visualization search data

    NOTE: This function doesn't support saved searches (i.e. 'ref' attribute)
    :param request_context:
    :param owner:
    :param app_name:
    :param visualization:
    :param async_splunk_client:
    :return:
    """

    LOGGER.info(
        "Start fetch_visualization_data owner={}, app_name={}, visualization.id={}, visualization.search.query={}"
            .format(owner, app_name, visualization.id, visualization.search.query))

    # validate search
    if visualization.search is None:
        raise SpacebridgeApiRequestError("Search is Empty for visualization_id={}".format(visualization.id),
                                         status_code=HTTPStatus.NO_CONTENT)

    # populate search params
    search = visualization.search
    params = get_search_job_request_params(query=search.query,
                                           earliest_time=search.earliest,
                                           latest_time=search.latest,
                                           sample_ratio=search.sample_ratio,
                                           exec_mode=constants.EXEC_MODE_ONESHOT)
    if not params:
        raise SpacebridgeApiRequestError("Search Query is Empty for visualization_id={}".format(visualization.id),
                                         status_code=HTTPStatus.BAD_REQUEST)

    response = await async_splunk_client.async_get_search_data_request(owner=owner,
                                                                       app_name=app_name,
                                                                       auth_header=request_context.auth_header,
                                                                       data=urllib.urlencode(params))

    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(
            "Failed to get search data search_query={}, response.code={}, response.text={}".format(
                params['search'], response.code, response_text), status_code=response.code)

    response_json = await response.json()
    visualization_data = VisualizationData.from_response_json(response_json)

    # Log warning message if fields, columns are empty
    # If fields and columns are empty we should log messages if available
    if visualization_data.is_empty_data() and 'messages' in response_json and response_json['messages']:
        for message in response_json['messages']:
            msg_type = message['type'] if 'type' in message else "no_type"
            text = message['text'] if 'text' in message else "no_text"
            LOGGER.info("Search Data Message search_query={}, type={}, text={}"
                        .format(params['search'], msg_type, text))

    return visualization_data


async def get_list_dashboard_data(request_context, dashboard_description=None, async_splunk_client=None,
                                  input_tokens=None):
    # Find all the visualizations in the dashboard and get the data
    list_dashboard_data = []
    if dashboard_description is not None:
        list_dashboard_visualizations = dashboard_description.get_all_visualizations()
        for visualization in list_dashboard_visualizations:
            # Create DashboardVisualizationId
            dashboard_visualization_id = DashboardVisualizationId(dashboard_id=dashboard_description.dashboard_id,
                                                                  visualization_id=visualization.id)
            # Attempt to fetch dashboard visualization data
            dashboard_data = await fetch_dashboard_data(request_context,
                                                        dashboard_visualization_id=dashboard_visualization_id,
                                                        visualization=visualization,
                                                        async_splunk_client=async_splunk_client,
                                                        input_tokens=input_tokens)
            # Don't want to add failed dashboard_data
            if dashboard_data is not None:
                list_dashboard_data.append(dashboard_data)

    return list_dashboard_data


async def get_search_job_content(auth_header, owner=None, app_name=None, search_id=None, async_splunk_client=None,
                                 params={}) -> SearchJobMetadata:
    """
    Return search job content referenced by search_id is in the Done state
    :param auth_header:
    :param owner:
    :param app_name:
    :param search_id:
    :param async_splunk_client:
    :return:
    """

    params[constants.OUTPUT_MODE] = constants.JSON
    if not hasattr(params, constants.COUNT):
        params[constants.COUNT] = '10000'

    response = await async_splunk_client.async_get_search_job_request(owner=owner,
                                                                      app_name=app_name,
                                                                      search_id=search_id,
                                                                      params=params,
                                                                      auth_header=auth_header)
    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        entry_json_list = response_json.get('entry')
        if entry_json_list:
            search_job_metadata = to_search_job_metadata(entry_json_list[0])
            return search_job_metadata
    else:
        response_text = await response.text()
        LOGGER.info("Failed to get metadata for search_id={}, response.code={}, response.text={}"
                    .format(search_id, response.code, response_text))
        return None


async def fetch_search_job_results_visualization_data(auth_header,
                                                      owner=None,
                                                      app_name=None,
                                                      search_id=None,
                                                      post_search=None,
                                                      async_splunk_client=None):
    """
    Return results of search referenced by search_id
    :param auth_header:
    :param owner:
    :param app_name:
    :param search_id:
    :param post_search:
    :param async_splunk_client:
    :return:
    """
    params = {
        'output_mode': 'json_cols',
        'count': '10000',
        'offset': '0',
        'show_metadata': 'true'  # return fields as a list of jsons
    }

    # Add post_search if specified
    if post_search:
        params['search'] = post_search

    response = await async_splunk_client.async_get_search_job_results_preview_request(owner=owner,
                                                                                      app_name=app_name,
                                                                                      search_id=search_id,
                                                                                      params=params,
                                                                                      auth_header=auth_header)

    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        visualization_data = VisualizationData.from_response_json(response_json)

        # Log warning message if fields, columns are empty
        # If fields and columns are empty we should log messages if available
        if visualization_data.is_empty_data() and 'messages' in response_json and response_json['messages']:
            for message in response_json['messages']:
                msg_type = message['type'] if 'type' in message else "no_type"
                text = message['text'] if 'text' in message else "no_text"
                LOGGER.info("Search Data Message search_id={}, type={}, text={}".format(search_id, msg_type, text))

        return visualization_data
    else:
        response_text = await response.text()
        LOGGER.error("Failed to get search job results search_id={}, response.code={}, response.text={}"
                     .format(search_id, response.code, response_text))
        return None


async def get_search_job_dashboard_data(request_context,
                                        owner=None,
                                        app_name=None,
                                        search_id=None,
                                        dashboard_visualization_id=None,
                                        async_splunk_client=None):
    """
    Get DashboardData given a search job id
    :param request_context:
    :param owner:
    :param app_name:
    :param search_id:
    :param dashboard_visualization_id:
    :param async_splunk_client:
    :return:
    """
    try:
        visualization_data = await fetch_search_job_results_visualization_data(owner=owner,
                                                                               app_name=app_name,
                                                                               search_id=search_id,
                                                                               auth_header=request_context.auth_header,
                                                                               async_splunk_client=async_splunk_client)

        # Return complete Dashboard Data object
        return DashboardData(dashboard_visualization_id=dashboard_visualization_id,
                             visualization_data=visualization_data)
    except Exception:
        LOGGER.exception('Unhandled Exception! search_id={}'.format(search_id))
        return None
