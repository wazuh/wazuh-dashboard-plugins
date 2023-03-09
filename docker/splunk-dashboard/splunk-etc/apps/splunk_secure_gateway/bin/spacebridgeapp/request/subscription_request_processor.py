"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process Subscription requests
"""
import asyncio
from functools import partial
from uuid import uuid4
from http import HTTPStatus

from spacebridgeapp.data.visualization_type import VisualizationType
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.request.dashboard_request_processor import get_search_job_content
from spacebridgeapp.search.search_job_params import create_search_query
from spacebridgeapp.subscriptions.process_trellis import get_default_split_by
from spacebridgeapp.subscriptions.subscription_helpers import generate_search_hash, refresh_to_seconds
from spacebridgeapp.subscriptions.subscription_map_requests import construct_cluster_map_post_search, \
    validate_choropleth_map_params, construct_choropleth_map_post_search
from spacebridgeapp.subscriptions.subscription_requests import validate_dashboard_search
from spacebridgeapp.subscriptions.subscription_search_requests import create_job_from_search
from spacebridgeapp.util import constants

from spacebridgeapp.util.time_utils import get_expiration_timestamp_str, get_current_timestamp_str
from spacebridgeapp.search.input_token_support import set_default_token_values, inject_tokens_into_string, \
    map_default_token_values
from spacebridgeapp.data.subscription_data import Subscription, SubscriptionSearch, SubscriptionCredential, \
    SearchUpdate
from spacebridgeapp.data.dashboard_data import DashboardVisualizationId, Search
from spacebridgeapp.data.search_type import SearchType
from spacebridgeapp.data.dispatch_state import DispatchState
from spacebridgeapp.udf.udf_subscriptions import create_search_from_data_source, get_default_input_token_map
from spacebridgeapp.udf.udf_data import UdfDashboardDescription
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SEARCHES_COLLECTION_NAME, \
    SUBSCRIPTIONS_COLLECTION_NAME, CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_REQUEST, \
    CLIENT_SUBSCRIBE_DASHBOARD_INPUT_SEARCH_REQUEST, CLIENT_SUBSCRIBE_SAVED_SEARCH_REQUEST, \
    CLIENT_SUBSCRIBE_UDF_DATASOURCE, NOBODY, \
    SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME, CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CLUSTER_MAP, \
    CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CHOROPLETH_MAP, SEARCH_UPDATES_COLLECTION_NAME, JWT_TOKEN_TYPE, \
    SPLUNK_SESSION_TOKEN_TYPE, CLIENT_SUBSCRIBE_GENERIC_MESSAGE, SUBSCRIPTION_CREDENTIAL_GLOBAL
from spacebridgeapp.request.request_processor import get_splunk_cookie, JWTAuthHeader
from spacebridgeapp.request.generic_request_processor import process_generic_message_request
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.dashboard.dashboard_helpers import parse_dashboard_id, get_dashboard_input_tokens

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_subscription_request_processor.log",
                       "subscription_request_processor")


async def _spawn_search_job(request_context, async_splunk_client, subscription_search, input_tokens, sid):
    owner, app_name, dashboard_name = parse_dashboard_id(subscription_search.dashboard_id)
    sid = await create_job_from_search(request_context.auth_header, subscription_search, app_name,
                                       request_context.current_user, input_tokens, async_splunk_client, sid)

    LOGGER.info("Created search job sid={}".format(sid))
    return sid


def log_dashboard_source_subscription(dashboard_id,
                                      search_type_id,
                                      search_key,
                                      subscription_id):
    """
    Helper method to log a Dashboard Source Subscription Creation
    :param dashboard_id:
    :param search_type_id:
    :param search_key:
    :param subscription_id:
    :return:
    """
    LOGGER.info(f"Dashboard Source Subscription Created: "
                f"dashboard_id={dashboard_id}, search_type_id={search_type_id}, search_key={search_key}, "
                f"subscription_id={subscription_id}")


async def process_subscribe_request(request_context,
                                    client_subscription_message=None,
                                    server_subscription_response=None,
                                    async_client_factory=None):
    """
    Process Different Subscribe Requests
    :param request_context:
    :param client_subscription_message:
    :param server_subscription_response:
    :param async_client_factory:
    :return:
    """

    if client_subscription_message.clientSubscribeRequest.HasField(CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_REQUEST):
        LOGGER.info("type=CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_REQUEST")
        await process_subscribe_dashboard_visualization_request(
            request_context,
            client_subscription_message,
            server_subscription_response,
            async_client_factory)

    elif client_subscription_message.clientSubscribeRequest.HasField(CLIENT_SUBSCRIBE_SAVED_SEARCH_REQUEST):
        LOGGER.info("type=CLIENT_SUBSCRIBE_SAVED_SEARCH_REQUEST")
        await process_subscribe_saved_search_request(
            request_context,
            client_subscription_message,
            server_subscription_response,
            async_client_factory)

    elif client_subscription_message.clientSubscribeRequest.HasField(CLIENT_SUBSCRIBE_DASHBOARD_INPUT_SEARCH_REQUEST):
        LOGGER.info("type=CLIENT_SUBSCRIBE_DASHBOARD_INPUT_SEARCH_REQUEST")
        await process_subscribe_dashboard_input_search_request(
            request_context,
            client_subscription_message,
            server_subscription_response,
            async_client_factory)

    elif client_subscription_message.clientSubscribeRequest.HasField(CLIENT_SUBSCRIBE_UDF_DATASOURCE):
        LOGGER.info("type=CLIENT_SUBSCRIBE_UDF_DATASOURCE")
        await process_subscribe_udf_datasource(
            request_context,
            client_subscription_message,
            server_subscription_response,
            async_client_factory)

    elif client_subscription_message.clientSubscribeRequest.HasField(CLIENT_SUBSCRIBE_GENERIC_MESSAGE):
        LOGGER.info("type=CLIENT_SUBSCRIBE_GENERIC_MESSAGE")
        response = await process_generic_message_request(
            request_context,
            client_subscription_message,
            server_subscription_response,
            async_client_factory)

        return response


async def process_subscribe_update_request(request_context,
                                           client_subscription_message=None,
                                           server_subscription_response=None,
                                           async_client_factory=None):
    async_kvstore_client = async_client_factory.kvstore_client()
    client_subscription_update = client_subscription_message.clientSubscriptionUpdate
    server_subscription_response.serverSubscribeResponse.SetInParent()

    if client_subscription_update.HasField(CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CLUSTER_MAP):
        LOGGER.info("type=CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CLUSTER_MAP")
        await process_dashboard_visualization_map_update(
            request_context=request_context,
            construct_post_search_string=construct_cluster_map_post_search,
            dashboard_visualization_map=client_subscription_update.dashboardVisualizationClusterMap,
            client_subscription_message=client_subscription_message,
            server_subscription_response=server_subscription_response,
            async_kvstore_client=async_kvstore_client)

    elif client_subscription_update.HasField(CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CHOROPLETH_MAP):
        LOGGER.info("type=CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CHOROPLETH_MAP")
        await process_dashboard_visualization_map_update(
            request_context=request_context,
            validate_map_update=validate_choropleth_map_params,
            construct_post_search_string=construct_choropleth_map_post_search,
            dashboard_visualization_map=client_subscription_update.dashboardVisualizationChoroplethMap,
            client_subscription_message=client_subscription_message,
            server_subscription_response=server_subscription_response,
            async_kvstore_client=async_kvstore_client)
    elif client_subscription_update.HasField(CLIENT_SUBSCRIBE_GENERIC_MESSAGE):
        LOGGER.info("type=CLIENT_SUBSCRIBE_UPDATE_GENERIC_MESSAGE")
        await process_generic_message_request(
            request_context,
            client_subscription_message,
            server_subscription_response,
            async_client_factory)


async def process_dashboard_visualization_map_update(request_context,
                                                     validate_map_update=None,
                                                     construct_post_search_string=None,
                                                     dashboard_visualization_map=None,
                                                     client_subscription_message=None,
                                                     server_subscription_response=None,
                                                     async_kvstore_client=None):
    # Retrieve Params
    client_subscription_update = client_subscription_message.clientSubscriptionUpdate
    subscription_id = client_subscription_update.subscriptionId

    # Validate subscription_id
    LOGGER.debug('Start process_subscription_update subscription_id=%s', subscription_id)

    # See if subscription_id exists in KVStore
    get_response = await async_kvstore_client.async_kvstore_get_request(
        collection=SUBSCRIPTIONS_COLLECTION_NAME,
        key_id=subscription_id,
        owner=NOBODY,
        auth_header=request_context.auth_header)

    if get_response.code != HTTPStatus.OK:
        error = await get_response.text()
        error_message = "Update failed. Subscription ID Not Found! status_code={}, error={},subscription_id={}" \
            .format(get_response.code, error, subscription_id)
        raise SpacebridgeApiRequestError(error_message, status_code=get_response.code)

    await process_post_search(request_context=request_context,
                              validate_map_update=validate_map_update,
                              construct_post_search_string=construct_post_search_string,
                              dashboard_visualization_map=dashboard_visualization_map,
                              subscription_id=subscription_id,
                              server_subscription_response=server_subscription_response,
                              async_kvstore_client=async_kvstore_client)


async def process_trellis_split_by(request_context,
                                   trellis_split_by=None,
                                   subscription_id=None,
                                   server_subscription_response=None,
                                   async_kvstore_client=None):
    subscription_update = SearchUpdate(trellis_split_by=trellis_split_by, key=subscription_id)
    await process_subscription_update(request_context,
                                      subscription_update,
                                      server_subscription_response,
                                      async_kvstore_client)


async def process_post_search(request_context,
                              validate_map_update=None,
                              construct_post_search_string=None,
                              dashboard_visualization_map=None,
                              subscription_id=None,
                              server_subscription_response=None,
                              async_kvstore_client=None):
    if validate_map_update:
        validate_error_list = validate_map_update(dashboard_visualization_map)

        if validate_error_list:
            error_message = ','.join(validate_error_list)
            raise SpacebridgeApiRequestError(error_message, status_code=HTTPStatus.BAD_REQUEST)

    post_search = construct_post_search_string(dashboard_visualization_map)
    subscription_update = SearchUpdate(post_search=post_search, key=subscription_id)

    await process_subscription_update(request_context,
                                      subscription_update,
                                      server_subscription_response,
                                      async_kvstore_client)


async def process_subscribe_dashboard_input_search_request(request_context: RequestContext,
                                                           client_subscription_message=None,
                                                           server_subscription_response=None,
                                                           async_client_factory=None):
    """
    Process Subscribe Dashboard Input Search Requests from Clients,
    will return subscription_id in successful subscription
    :param request_context:
    :param client_subscription_message:
    :param server_subscription_response:
    :param async_client_factory:
    :param async_client_factory:
    :return:
    """
    # async clients
    async_splunk_client = async_client_factory.splunk_client()
    async_kvstore_client = async_client_factory.kvstore_client()
    async_itsi_client = async_client_factory.itsi_client()

    # retrieve request params
    ttl_seconds = client_subscription_message.clientSubscribeRequest.ttlSeconds
    dashboard_input_search_subscribe = client_subscription_message.clientSubscribeRequest.dashboardInputSearchSubscribe
    dashboard_id = dashboard_input_search_subscribe.dashboardId
    query_id = dashboard_input_search_subscribe.queryId
    input_tokens = dict(dashboard_input_search_subscribe.inputTokens)

    # validate input search
    dashboard_description = await validate_dashboard_search(request_context=request_context,
                                                            dashboard_id=dashboard_id,
                                                            type_id=query_id,
                                                            search_type=SearchType.INPUT,
                                                            input_tokens=input_tokens,
                                                            async_kvstore_client=async_kvstore_client,
                                                            async_splunk_client=async_splunk_client,
                                                            async_itsi_client=async_itsi_client)

    dashboard_defn = dashboard_description.definition

    # Set Default input_token values
    default_input_tokens = get_dashboard_input_tokens(dashboard_defn)
    set_default_token_values(input_tokens, default_input_tokens)

    # Pull out validated input_token
    input_token = dashboard_description.get_input_token_by_query_id(query_id)
    search_defn = input_token.input_type.dynamic_options.search
    search_key = generate_search_hash(dashboard_id, query_id, input_tokens,
                                      user=request_context.current_user, refresh_interval=None)

    spawn_search_job = partial(_spawn_search_job, request_context, async_splunk_client)

    await lazy_load_subscription_search(request_context=request_context,
                                        dashboard_id=dashboard_id,
                                        search_type_id=query_id,
                                        search_type=SearchType.INPUT.value,
                                        search_defn=search_defn,
                                        search_key=search_key,
                                        input_tokens=input_tokens,
                                        dashboard_defn=dashboard_defn,
                                        async_kvstore_client=async_kvstore_client,
                                        async_splunk_client=async_splunk_client,
                                        spawn_search_job=spawn_search_job,
                                        shard_id=request_context.shard_id)

    # Create Subscription
    subscription_id = await create_subscription(request_context=request_context,
                                                search_key=search_key,
                                                ttl_seconds=ttl_seconds,
                                                shard_id=request_context.shard_id,
                                                async_splunk_client=async_splunk_client,
                                                async_kvstore_client=async_kvstore_client,
                                                visualization_id=dashboard_id)

    # Set ServerSubscribeResponse with created subscription key
    server_subscription_response.subscriptionId = subscription_id
    # TODO: Return fields about the search back to the user
    server_subscription_response.serverSubscribeResponse.SetInParent()

    # Log the Dashboard Source Subscription
    log_dashboard_source_subscription(dashboard_id=dashboard_id, search_type_id=query_id, search_key=search_key,
                                      subscription_id=subscription_id)


async def process_subscribe_saved_search_request(request_context: RequestContext,
                                                 client_subscription_message=None,
                                                 server_subscription_response=None,
                                                 async_client_factory=None):
    """
    Process saved search subscribe requests from clients, will return subscription_id in successful subscription
    :param request_context:
    :param client_subscription_message:
    :param server_subscription_response:
    :param async_client_factory:
    :return:
    """

    # async clients
    async_splunk_client = async_client_factory.splunk_client()
    async_kvstore_client = async_client_factory.kvstore_client()

    # retrieve request params
    ttl_seconds = client_subscription_message.clientSubscribeRequest.ttlSeconds
    saved_search_subscribe = client_subscription_message.clientSubscribeRequest.clientSavedSearchSubscribe
    saved_search_id = saved_search_subscribe.savedSearchId
    input_tokens = dict(saved_search_subscribe.inputTokens)
    search = Search(ref=saved_search_id)

    search_key = generate_search_hash(request_context.shard_id, saved_search_id, input_tokens,
                                      user=request_context.current_user, refresh_interval=None)

    spawn_search_job = partial(_spawn_search_job, request_context, async_splunk_client)

    await lazy_load_subscription_search(request_context=request_context,
                                        search_type_id=saved_search_id,
                                        search_type=SearchType.SAVED_SEARCH.value,
                                        search_defn=search,
                                        search_key=search_key,
                                        input_tokens=input_tokens,
                                        async_kvstore_client=async_kvstore_client,
                                        async_splunk_client=async_splunk_client,
                                        spawn_search_job=spawn_search_job,
                                        shard_id=request_context.shard_id)

    # Create Subscription
    subscription_id = await create_subscription(request_context=request_context,
                                                search_key=search_key,
                                                ttl_seconds=ttl_seconds,
                                                shard_id=request_context.shard_id,
                                                async_splunk_client=async_splunk_client,
                                                async_kvstore_client=async_kvstore_client,
                                                visualization_id=search_key)

    # Set ServerSubscribeResponse with created subscription key
    server_subscription_response.subscriptionId = subscription_id
    # TODO: Return fields about the search back to the user
    server_subscription_response.serverSubscribeResponse.SetInParent()


async def process_subscribe_udf_datasource(request_context: RequestContext,
                                           client_subscription_message,
                                           server_subscription_response,
                                           async_client_factory):
    """
    Takes a requestof type clientSubscribeRequest.udfDataSourceSubscribe. Validates that the provided dashboard
    actually has the requested data source. If it does, we create a pubsub entry in KV store and send back
    the subscription id as we do with all pubsub requests
    :param request_context:
    :param client_subscription_message: UdfDataSourceSubscribe
    :param server_subscription_response: ServerSubscriptionResponse
    :param async_client_factory:
    :return: None, mutates the server subscription response input object.
    """
    # async clients
    async_splunk_client = async_client_factory.splunk_client()
    async_kvstore_client = async_client_factory.kvstore_client()
    async_itsi_client = async_client_factory.itsi_client()

    ttl_seconds = client_subscription_message.clientSubscribeRequest.ttlSeconds
    udf_ds_subscribe = client_subscription_message.clientSubscribeRequest.udfDataSourceSubscribe
    dashboard_id = udf_ds_subscribe.dashboardId
    data_source_id = udf_ds_subscribe.dataSourceId
    input_tokens = dict(udf_ds_subscribe.inputTokens)

    dashboard_description = await validate_dashboard_search(request_context=request_context,
                                                            dashboard_id=dashboard_id,
                                                            search_type=SearchType.DATA_SOURCE,
                                                            type_id=data_source_id,
                                                            input_tokens=input_tokens,
                                                            async_kvstore_client=async_kvstore_client,
                                                            async_splunk_client=async_splunk_client,
                                                            async_itsi_client=async_itsi_client)

    # The validate dashboard search call above verifies that exactly one data source matches the given id, so we can
    # safely take the first element
    udf_data_source = dashboard_description.definition.get_data_source_by_id(data_source_id)
    search_defn = create_search_from_data_source(udf_data_source=udf_data_source,
                                                 defaults_json=dashboard_description.definition.defaults_json)

    # Set Default input_token values
    default_input_tokens = get_default_input_token_map(dashboard_description.definition.inputs_json)
    input_tokens = map_default_token_values(input_tokens, default_input_tokens)

    # Determine search_key switch on refresh_interval
    refresh_interval = None
    if search_defn:
        search_defn.refresh = inject_tokens_into_string(input_tokens, search_defn.refresh)
        refresh_interval = refresh_to_seconds(search_defn.refresh)
    search_key = generate_search_hash(dashboard_id=dashboard_id,
                                      search_id=data_source_id,
                                      input_tokens=input_tokens,
                                      user=request_context.current_user,
                                      refresh_interval=refresh_interval)

    if search_defn:
        spawn_search_job = partial(_spawn_search_job, request_context, async_splunk_client)

        await lazy_load_subscription_search(request_context=request_context,
                                            dashboard_id=dashboard_id,
                                            search_type_id=data_source_id,
                                            search_type=SearchType.DATA_SOURCE.value,
                                            search_defn=search_defn,
                                            search_key=search_key,
                                            input_tokens=input_tokens,
                                            dashboard_defn=dashboard_description.definition,
                                            async_kvstore_client=async_kvstore_client,
                                            async_splunk_client=async_splunk_client,
                                            spawn_search_job=spawn_search_job,
                                            shard_id=request_context.shard_id)
    else:  # Assume ds.test data_source in no Search object created
        await load_udf_ds_test_subscription_search(request_context=request_context,
                                                   dashboard_id=dashboard_id,
                                                   search_key=search_key,
                                                   data_source_id=data_source_id,
                                                   input_tokens=input_tokens,
                                                   udf_data_source=udf_data_source,
                                                   async_kvstore_client=async_kvstore_client)

    # Create Subscription
    # TODO: no visualization_id here, and param is required in function
    subscription_id = await create_subscription(request_context=request_context,
                                                search_key=search_key,
                                                ttl_seconds=ttl_seconds,
                                                shard_id=request_context.shard_id,
                                                async_splunk_client=async_splunk_client,
                                                async_kvstore_client=async_kvstore_client,
                                                visualization_id=data_source_id)

    # Set ServerSubscribeResponse with created subscription key
    server_subscription_response.subscriptionId = subscription_id
    # TODO: Return fields about the search back to the user
    server_subscription_response.serverSubscribeResponse.SetInParent()

    # Log the Dashboard Source Subscription
    log_dashboard_source_subscription(dashboard_id=dashboard_id, search_type_id=data_source_id, search_key=search_key,
                                      subscription_id=subscription_id)


async def process_subscribe_dashboard_visualization_request(request_context: RequestContext,
                                                            client_subscription_message,
                                                            server_subscription_response,
                                                            async_client_factory):
    """
    Process Subscribe Dashboard Visualization Requests from Clients,
    will return subscription_id in successful subscription
    :param request_context:
    :param client_subscription_message:
    :param server_subscription_response:
    :param async_client_factory:
    :return:
    """
    LOGGER.debug("process_subscribe_dashboard_visualization_request start")
    # async clients
    async_splunk_client = async_client_factory.splunk_client()
    async_kvstore_client = async_client_factory.kvstore_client()
    async_itsi_client = async_client_factory.itsi_client()

    # retrieve request params
    ttl_seconds = client_subscription_message.clientSubscribeRequest.ttlSeconds
    dashboard_visualization_subscribe = client_subscription_message.clientSubscribeRequest.dashboardVisualizationSubscribe
    dashboard_visualization_id = DashboardVisualizationId()
    dashboard_visualization_id.from_protobuf(dashboard_visualization_subscribe.dashboardVisualizationId)
    dashboard_id = dashboard_visualization_id.dashboard_id
    visualization_id = dashboard_visualization_id.visualization_id
    input_tokens = dict(dashboard_visualization_subscribe.inputTokens)

    # Validate dashboard_id, visualization_id excepts if fail, return dashboard_description if ok
    dashboard_description = await validate_dashboard_search(request_context=request_context,
                                                            dashboard_id=dashboard_id,
                                                            type_id=visualization_id,
                                                            input_tokens=input_tokens,
                                                            async_kvstore_client=async_kvstore_client,
                                                            async_splunk_client=async_splunk_client,
                                                            async_itsi_client=async_itsi_client)

    dashboard_defn = dashboard_description.definition

    # Set Default input_token values
    default_input_tokens = get_dashboard_input_tokens(dashboard_defn)
    set_default_token_values(input_tokens, default_input_tokens)

    visualization = dashboard_description.get_visualization(visualization_id)
    visualization_type = visualization.visualization_type

    search_id = visualization.search.id

    if not search_id:
        search_id = visualization_id

    visualization.search.refresh = inject_tokens_into_string(input_tokens, visualization.search.refresh)
    search_key = generate_search_hash(dashboard_id, search_id, input_tokens,
                                      user=request_context.current_user,
                                      refresh_interval=refresh_to_seconds(visualization.search.refresh))

    spawn_search_job = partial(_spawn_search_job, request_context, async_splunk_client)

    trellis_enabled = dashboard_visualization_subscribe.trellisEnabled

    if trellis_enabled:
        trellis_split_by = dashboard_visualization_subscribe.trellisSplitBy

        if not trellis_split_by:
            LOGGER.debug("Trellis split by field not provided by client device, calculating trellis split by field")
            search_query = create_search_query(visualization.search.query)
            response = await async_splunk_client.async_post_search_ast(request_context.auth_header, search_query)
            if response.code == HTTPStatus.OK:
                jsn = await response.json()
                default_split_by_field = get_default_split_by(jsn['ast'])
                trellis_split_by = default_split_by_field
            else:
                message = await response.text()
                LOGGER.error(f"Could not get search AST for query={visualization.search.query} with error={message}. "
                             f"Calculating default trellis split by")
    else:
        trellis_enabled = False
        trellis_split_by = None

    await lazy_load_subscription_search(request_context=request_context,
                                        dashboard_id=dashboard_id,
                                        search_type_id=visualization_id,
                                        search_type=SearchType.VISUALIZATION.value,
                                        search_defn=visualization.search,
                                        search_key=search_key,
                                        input_tokens=input_tokens,
                                        dashboard_defn=dashboard_defn,
                                        async_kvstore_client=async_kvstore_client,
                                        async_splunk_client=async_splunk_client,
                                        spawn_search_job=spawn_search_job,
                                        shard_id=request_context.shard_id,
                                        visualization_type=visualization_type,
                                        trellis_enabled=trellis_enabled,
                                        trellis_split_by=trellis_split_by)

    subscription_id = await create_subscription(request_context=request_context,
                                                ttl_seconds=ttl_seconds,
                                                search_key=search_key,
                                                shard_id=request_context.shard_id,
                                                async_splunk_client=async_splunk_client,
                                                async_kvstore_client=async_kvstore_client,
                                                visualization_id=visualization_id)

    # Set ServerSubscribeResponse with created subscription key
    server_subscription_response.subscriptionId = subscription_id
    # TODO: Return fields about the search back to the user
    server_subscription_response.serverSubscribeResponse.SetInParent()

    # Log the Dashboard Source Subscription
    log_dashboard_source_subscription(dashboard_id=dashboard_id, search_type_id=visualization_id, search_key=search_key,
                                      subscription_id=subscription_id)

    if dashboard_visualization_subscribe.HasField(CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CLUSTER_MAP):
        await process_post_search(
            request_context=request_context,
            construct_post_search_string=construct_cluster_map_post_search,
            dashboard_visualization_map=dashboard_visualization_subscribe.dashboardVisualizationClusterMap,
            subscription_id=subscription_id,
            server_subscription_response=server_subscription_response,
            async_kvstore_client=async_kvstore_client)

    elif dashboard_visualization_subscribe.HasField(CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CHOROPLETH_MAP):
        await process_post_search(
            request_context=request_context,
            validate_map_update=validate_choropleth_map_params,
            construct_post_search_string=construct_choropleth_map_post_search,
            dashboard_visualization_map=dashboard_visualization_subscribe.dashboardVisualizationChoroplethMap,
            subscription_id=subscription_id,
            server_subscription_response=server_subscription_response,
            async_kvstore_client=async_kvstore_client)


def _get_base_search(dashboard_definition, base_id):
    """
    Private helper to return the Search object for a base_id given the DashboardDescription type
    :param dashboard_definition:
    :param base_id:
    :return:
    """
    if isinstance(dashboard_definition, UdfDashboardDescription):
        udf_data_source = dashboard_definition.get_data_source_by_id(base_id)
        return create_search_from_data_source(
            udf_data_source=udf_data_source, defaults_json=dashboard_definition.defaults_json)
    return dashboard_definition.find_base_search(base_id)


async def load_udf_ds_test_subscription_search(request_context, input_tokens, search_key, data_source_id, dashboard_id,
                                               udf_data_source, async_kvstore_client):
    """
    Helper method to create a SubscriptionSearch specifically for a udf ds.test data source.
    A ds.test data source defines all values completely in a dashboard definition so no search job is required.
    A SubscriptionSearch object is created and stored in KVStore in order to process subscriptions accordingly.

    :param request_context:
    :param input_tokens:
    :param search_key:
    :param data_source_id:
    :param dashboard_id:
    :param udf_data_source:
    :param async_kvstore_client:
    :return:
    """
    # Initialize the update_time so SubscriptionSearch will be cleaned-up
    refresh_interval_seconds = 0
    next_update_time = get_expiration_timestamp_str(ttl_seconds=refresh_interval_seconds)
    last_update_time = get_current_timestamp_str()

    # Build SubscriptionSearch
    subscription_search = SubscriptionSearch(_key=search_key,
                                             dashboard_id=dashboard_id,
                                             search_type_id=data_source_id,
                                             search_type=SearchType.DATA_SOURCE.value,
                                             owner=request_context.current_user,
                                             input_tokens=input_tokens,
                                             shard_id=request_context.shard_id,
                                             refresh_interval_seconds=refresh_interval_seconds,
                                             next_update_time=next_update_time,
                                             last_update_time=last_update_time,
                                             done_progress=1.0,  # Since not an actual search job, fake the status
                                             dispatch_state=DispatchState.DONE.value,
                                             ds_test=udf_data_source.json)
    # Save SubscriptionSearch
    http_result = await create_search(request_context,
                                      subscription_search,
                                      async_kvstore_client)

    if http_result not in [HTTPStatus.CREATED, HTTPStatus.CONFLICT]:
        raise SpacebridgeApiRequestError(message='Failed to create subscription search', status_code=http_result)

    return subscription_search


async def lazy_load_subscription_search(request_context, input_tokens, search_key,
                                        search_type, search_type_id, search_defn,
                                        async_kvstore_client, async_splunk_client,
                                        shard_id, spawn_search_job, dashboard_defn=None, dashboard_id=None,
                                        visualization_type=None, trellis_enabled=False, trellis_split_by=None):
    """
    Lazily create a SubscriptionSearch object and save Search in kvstore
    :param trellis_enabled:
    :param request_context:
    :param input_tokens:
    :param search_key:
    :param search_type:
    :param search_type_id:
    :param search_defn:
    :param async_kvstore_client:
    :param async_splunk_client:
    :param shard_id:
    :param spawn_search_job:
    :param dashboard_defn:
    :param dashboard_id:
    :param visualization_type:
    :param trellis_split_by:
    :return:
    """
    parent_id = None
    search_query = search_defn.query

    sid = None
    if search_defn.base:
        parent_search_defn = _get_base_search(dashboard_definition=dashboard_defn, base_id=search_defn.base)

        refresh_interval = None
        if parent_search_defn:
            parent_search_defn.refresh = inject_tokens_into_string(input_tokens, parent_search_defn.refresh)
            refresh_interval = refresh_to_seconds(parent_search_defn.refresh)
        parent_search_key = generate_search_hash(dashboard_id=dashboard_id,
                                                 search_id=parent_search_defn.id,
                                                 input_tokens=input_tokens,
                                                 user=request_context.current_user,
                                                 refresh_interval=refresh_interval)

        LOGGER.debug("Base search exists, base=%s", parent_search_defn)

        # For UDF data sources we need to set the appropriate SearchType
        parent_st = SearchType.DATA_SOURCE if isinstance(dashboard_defn, UdfDashboardDescription) else SearchType.ROOT
        parent = await lazy_load_subscription_search(request_context=request_context,
                                                     input_tokens=input_tokens,
                                                     search_key=parent_search_key,
                                                     search_type=parent_st.value,
                                                     search_type_id=parent_search_defn.id,
                                                     search_defn=parent_search_defn,
                                                     async_kvstore_client=async_kvstore_client,
                                                     async_splunk_client=async_splunk_client,
                                                     shard_id=request_context.shard_id,
                                                     spawn_search_job=spawn_search_job,
                                                     dashboard_defn=dashboard_defn,
                                                     dashboard_id=dashboard_id,
                                                     visualization_type=visualization_type,
                                                     trellis_enabled=trellis_enabled,
                                                     trellis_split_by=trellis_split_by)
        sid = parent.sid
        parent_id = parent.key()

    # i.e. no parent search
    if not sid:
        sid = search_key

    subscription_search = build_subscription_search(request_context, dashboard_id, search_defn, search_query,
                                                    input_tokens, parent_id, search_key, search_type,
                                                    search_type_id, shard_id, sid,
                                                    visualization_type=visualization_type,
                                                    trellis_enabled=trellis_enabled, trellis_split_by=trellis_split_by)

    params = {}
    if visualization_type is not None and VisualizationType(
        visualization_type) == VisualizationType.DASHBOARD_VISUALIZATION_EVENT:
        params[constants.COUNT] = '200'

    job_status = await get_search_job_content(request_context.auth_header, subscription_search.owner,
                                              SPACEBRIDGE_APP_NAME, subscription_search.sid, async_splunk_client,
                                              params=params)
    if not job_status:
        LOGGER.debug("Start search job, sid=%s", sid)
        await spawn_search_job(subscription_search, input_tokens, sid)

    http_result = await create_search(request_context,
                                      subscription_search,
                                      async_kvstore_client)

    if http_result not in [HTTPStatus.CREATED, HTTPStatus.CONFLICT]:
        raise SpacebridgeApiRequestError(message='Failed to create subscription search', status_code=http_result)

    return subscription_search


def build_subscription_search(request_context,
                              dashboard_id,
                              search_defn,
                              search_query,
                              input_tokens,
                              parent_id,
                              search_key,
                              search_type,
                              search_type_id,
                              shard_id,
                              sid,
                              visualization_type=None,
                              trellis_enabled=False,
                              trellis_split_by=None):
    try:
        # Dashboard Definition refresh will override and refresh_interval
        refresh_interval_seconds = refresh_to_seconds(search_defn.refresh)

        # extract username and password
        query = search_query
        earliest_time = search_defn.earliest
        latest_time = search_defn.latest
        sample_ratio = search_defn.sample_ratio
        ref = search_defn.ref
        app = search_defn.app
        base = search_defn.base

        next_update_time = get_expiration_timestamp_str(ttl_seconds=refresh_interval_seconds)
        last_update_time = get_current_timestamp_str()
        # Create Search object
        subscription_search = SubscriptionSearch(_key=search_key,
                                                 dashboard_id=dashboard_id,
                                                 search_type_id=search_type_id,
                                                 search_type=search_type,
                                                 owner=request_context.current_user,
                                                 ref=ref,
                                                 app=app,
                                                 base=base,
                                                 sid=sid,
                                                 query=query,
                                                 parent_search_key=parent_id,
                                                 earliest_time=earliest_time,
                                                 latest_time=latest_time,
                                                 sample_ratio=sample_ratio,
                                                 refresh_interval_seconds=refresh_interval_seconds,
                                                 next_update_time=next_update_time,
                                                 last_update_time=last_update_time,
                                                 input_tokens=input_tokens,
                                                 shard_id=shard_id,
                                                 visualization_type=visualization_type,
                                                 trellis_enabled=trellis_enabled,
                                                 trellis_split_by=trellis_split_by)
    except Exception as e:
        LOGGER.exception("Failed to build subscription_search")
        raise e

    return subscription_search


async def create_search(request_context,
                        subscription_search,
                        async_kvstore_client):
    """
    Create a subscription search object in kvstore collection [searches]
    :param request_context:
    :param subscription_search:
    :param async_kvstore_client:
    :return:
    """

    http_result = await save_search(request_context=request_context,
                                    subscription_search=subscription_search,
                                    async_kvstore_client=async_kvstore_client)

    return http_result


async def save_search(request_context,
                      subscription_search=None,
                      async_kvstore_client=None):
    """
    Method to save_search to kvstore, updates if search_key is passed in
    :param request_context:
    :param subscription_search:
    :param async_kvstore_client:
    :return:
    """

    # create search and return _key
    response = await async_kvstore_client.async_kvstore_post_request(
        collection=SEARCHES_COLLECTION_NAME,
        data=subscription_search.to_json(),
        auth_header=request_context.auth_header)

    if response.code == HTTPStatus.OK or response.code == HTTPStatus.CREATED:
        LOGGER.debug("Subscription Search Created. search_key=%s", subscription_search.key())
        return HTTPStatus.CREATED

    # This is the case when user tries to save a subscription_search but a search with the same _key exists
    if response.code == HTTPStatus.CONFLICT:
        LOGGER.debug("Subscription Search was already Created. search_key=%s", subscription_search.key())
        return HTTPStatus.CONFLICT

    # Return Error in the case where response isn't successful
    error = await response.text()
    error_message = "Failed to create Subscription Search. status_code={}, error={}".format(response.code, error)
    raise SpacebridgeApiRequestError(error_message, status_code=response.code)


async def _create_subscription(request_context, subscription, async_kvstore_client):
    # create subscription and return _key
    response = await async_kvstore_client.async_kvstore_post_request(
        collection=SUBSCRIPTIONS_COLLECTION_NAME,
        data=subscription.to_json(),
        auth_header=request_context.auth_header)

    if response.code == HTTPStatus.OK or response.code == HTTPStatus.CREATED or response.code == HTTPStatus.CONFLICT:
        LOGGER.debug("Subscription Created. subscription_id=%s, expired_time=%s",
                     subscription.key(), subscription.expired_time)
        return subscription
    else:
        error = await response.text()
        error_message = "Failed to create Subscription. status_code={}, error={}".format(response.code, error)
        raise SpacebridgeApiRequestError(error_message, status_code=response.code)


async def _create_subscription_credentials(request_context, auth, async_kvstore_client):
    # create subscription and return _key
    response = await async_kvstore_client.async_kvstore_post_or_update_request(
        owner=request_context.current_user,
        collection=SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME,
        data=auth.to_json(),
        auth_header=request_context.auth_header,
        key_id=SUBSCRIPTION_CREDENTIAL_GLOBAL)

    if response.code == HTTPStatus.OK or response.code == HTTPStatus.CREATED:
        LOGGER.debug("Subscription Created. subscription_id=%s", auth.subscription_id)
        return auth
    else:
        error = await response.text()
        error_message = "Failed to create Subscription credentials. status_code={}, error={}".format(
            response.code, error)
        raise SpacebridgeApiRequestError(error_message, status_code=response.code)


async def fetch_session_key_and_type(request_context, async_splunk_client):
    """
    Function that returns session_key and session_key type
    :param request_context:
    :param async_splunk_client:
    """
    if isinstance(request_context.auth_header, JWTAuthHeader):
        LOGGER.debug("JWTAuthHeader detected. Setting session_key_type = {}".format(JWT_TOKEN_TYPE))
        session_key_type = JWT_TOKEN_TYPE
        session_key = request_context.auth_header.token
    else:
        LOGGER.debug("SplunkAuthHeader detected. Setting session_key_type = {}".format(SPLUNK_SESSION_TOKEN_TYPE))
        session_key_type = SPLUNK_SESSION_TOKEN_TYPE
        try:
            session_key = await get_splunk_cookie(request_context=request_context,
                                                  async_splunk_client=async_splunk_client,
                                                  username=request_context.auth_header.username,
                                                  password=request_context.auth_header.password)
        except Exception:
            # remove after figuring out why auth_header.username errors out above
            session_key = 'fubar'

    return session_key, session_key_type


async def create_subscription(request_context,
                              ttl_seconds,
                              search_key,
                              shard_id,
                              async_splunk_client,
                              async_kvstore_client,
                              visualization_id,
                              id_gen=uuid4
                              ):
    """
    Create a visualization subscription object in kvstore collection [subscriptions]
    :param request_context:
    :param ttl_seconds:
    :param search_key:
    :param shard_id
    :param async_splunk_client:
    :param async_kvstore_client:
    :param visualization_id:
    :param id_gen:
    :return:
    """
    # extract params for subscription
    subscription_id = str(id_gen())

    device_id = request_context.device_id
    expiration_time = get_expiration_timestamp_str(ttl_seconds=ttl_seconds)

    if isinstance(request_context.auth_header, JWTAuthHeader):
        LOGGER.debug("JWTAuthHeader detected. Setting session_key_type=%s", JWT_TOKEN_TYPE)
        session_type = JWT_TOKEN_TYPE
        session_key = request_context.auth_header.token
    else:
        LOGGER.debug("SplunkAuthHeader detected. Setting session_key_type=%s", SPLUNK_SESSION_TOKEN_TYPE)
        session_type = SPLUNK_SESSION_TOKEN_TYPE
        session_key = await get_splunk_cookie(request_context=request_context,
                                              async_splunk_client=async_splunk_client,
                                              username=request_context.auth_header.username,
                                              password=request_context.auth_header.password)

    now = get_current_timestamp_str()

    # Create Subscription object
    subscription = Subscription(_key=subscription_id,
                                ttl_seconds=ttl_seconds,
                                device_id=device_id,
                                subscription_key=search_key,
                                expired_time=expiration_time,
                                shard_id=shard_id,
                                user=request_context.current_user,
                                visualization_id=visualization_id,
                                last_update_time=now)

    auth = SubscriptionCredential(subscription_id=subscription_id,
                                  session_key=session_key,
                                  session_type=session_type,
                                  shard_id=request_context.shard_id,
                                  last_update_time=now,
                                  _key=SUBSCRIPTION_CREDENTIAL_GLOBAL)

    await asyncio.gather(
        _create_subscription(request_context, subscription, async_kvstore_client),
        _create_subscription_credentials(request_context, auth, async_kvstore_client)
    )

    LOGGER.info("Subscription created. subscription_id=%s, search_key=%s", subscription_id, search_key)
    return subscription_id


async def process_unsubscribe_request(request_context,
                                      client_single_subscription=None,
                                      server_subscription_response=None,
                                      async_kvstore_client=None):
    """
    Process and unsubscribe request, will delete the subscription give the subscription_id from kv store
    :param request_context:
    :param client_single_subscription:
    :param server_subscription_response:
    :param async_kvstore_client:
    :return:
    """
    # Populate response fields
    subscription_id = client_single_subscription.clientUnsubscribeRequest.subscriptionId
    server_subscription_response.subscriptionId = subscription_id
    LOGGER.debug('Start process_unsubscribe_request subscription_id=%s', subscription_id)

    response = await async_kvstore_client.async_kvstore_delete_request(
        collection=SUBSCRIPTIONS_COLLECTION_NAME,
        key_id=subscription_id,
        owner=NOBODY,
        auth_header=request_context.auth_header)

    # If error case
    if response.code == HTTPStatus.NOT_FOUND:
        # Treat 404s as a deletion as the end result is the same but log it
        error = await response.text()
        LOGGER.debug("Subscription Id not found. status_code=%s, error=%s, subscription_id=%s",
                     response.code, error, subscription_id)
    elif response.code != HTTPStatus.OK:
        error = await response.text()
        LOGGER.error("Failed to unsubscribe. status_code=%s, error=%s, subscription_id=%s",
                     response.code, error, subscription_id)
        raise SpacebridgeApiRequestError(error, status_code=response.code)

    LOGGER.info("Finished process_unsubscribe_request subscription_id=%s", subscription_id)

    server_subscription_response.serverUnsubscribeResponse.SetInParent()


async def process_ping_request(request_context,
                               client_single_subscription=None,
                               server_subscription_ping=None,
                               async_client_factory=None):
    """
    Process a subscription ping request, ping_request don't return any responses
    :param request_context:
    :param client_single_subscription:
    :param server_subscription_ping: Server subscription ping that will be sent back as a response
    :param async_client_factory:
    :return:
    """
    subscription_id = client_single_subscription.clientSubscriptionPing.subscriptionId

    subscription_client = async_client_factory.subscription_client()
    subscription_client.on_ping(request_context.current_user, request_context.auth_header, subscription_id)

    server_subscription_ping.subscriptionId = subscription_id


async def process_subscription_update(request_context,
                                      subscription,
                                      server_subscription_response=None,
                                      async_kvstore_client=None):
    """
    Process and update request, will update the subscription given the subscription_id from kv store
    :param request_context: Meta data for the request
    :param subscription: SubscriptionUpdate object containing post_search and/or trellis_split_by and subscription key
    :param server_subscription_response: Server subscription id that will be sent back as a response
    :param async_kvstore_client: Factory used to create async clients
    :return:
    """

    LOGGER.debug('Start process_subscription_update subscription_key={}'.format(subscription.key()))
    search_update_key = subscription.key()

    # Update existing subscription_id, otherwise create a new key if not found
    # This code is written with the assumption that update will happen more often than create
    post_response = await async_kvstore_client.async_kvstore_post_request(
        collection=SEARCH_UPDATES_COLLECTION_NAME,
        data=subscription.to_json(),
        key_id=search_update_key,
        owner=NOBODY,
        auth_header=request_context.auth_header)

    if post_response.code == HTTPStatus.NOT_FOUND:
        post_response = await async_kvstore_client.async_kvstore_post_request(
            collection=SEARCH_UPDATES_COLLECTION_NAME,
            data=subscription.to_json(),
            owner=NOBODY,
            auth_header=request_context.auth_header)

    if post_response.code not in [HTTPStatus.OK, HTTPStatus.CREATED]:
        error = await post_response.text()
        error_message = "Failed to update subscription search_update. status_code={}, error={}, subscription_key={}" \
            .format(post_response.code, error, search_update_key)
        raise SpacebridgeApiRequestError(error_message, status_code=post_response.code)

    server_subscription_response.subscriptionId = search_update_key
    server_subscription_response.serverSubscribeResponse.postSearch = subscription.get_post_search()
    server_subscription_response.serverSubscribeResponse.trellisEnabled = subscription.trellis_enabled
    server_subscription_response.serverSubscribeResponse.trellisSplitBy = subscription.get_trellis_split_by()

    LOGGER.debug("Subscription Post Search Updated subscription_key={}, post_search={}"
                 .format(search_update_key, subscription.post_search))
