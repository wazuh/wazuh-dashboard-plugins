"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for subscription_requests used by ssg_subscription_modular_input
"""

import json
from cloudgateway.splunk.auth import SplunkAuthHeader
from http import HTTPStatus
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SEARCHES_COLLECTION_NAME, \
    SUBSCRIPTIONS_COLLECTION_NAME, SEARCH_KEY, QUERY, NOBODY, \
    SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME, FIELDS, KEY, PARENT_SEARCH_KEY, SHARD_ID, VERSION, SUBSCRIPTION_VERSION_2, \
    SEARCH, AND_OPERATOR, SUBSCRIPTION_TYPE, SUBSCRIPTION_KEY
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.request.dashboard_request_processor import fetch_dashboard_description
from spacebridgeapp.data.subscription_data import SubscriptionSearch, Subscription, SubscriptionCredential
from spacebridgeapp.data.search_type import SearchType
from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_subscription_requests.log",
                       "subscription_requests")


async def fetch_searches(auth_header, async_kvstore_client):
    query = {VERSION: SUBSCRIPTION_VERSION_2}
    params = {QUERY: json.dumps(query)}

    LOGGER.debug("Querying for searches, params=%s", params)

    searches = await _fetch_searches(auth_header=auth_header,
                                     params=params,
                                     async_kvstore_client=async_kvstore_client)

    LOGGER.debug("Found active searches count=%d", len(searches))

    return searches


async def _fetch_searches(auth_header, params=None, async_kvstore_client=None):
    """
    Fetch all search objects from kvstore collection [searches]
    :param auth_header:
    :param params:
    :param async_kvstore_client:
    :return:
    """

    # Get all Searches so no input params
    response = await async_kvstore_client.async_kvstore_get_request(
        collection=SEARCHES_COLLECTION_NAME,
        params=params,
        auth_header=auth_header)

    searches = []
    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        if response_json:
            searches = [SubscriptionSearch.from_json(search) for search in response_json]
    else:
        error = await response.text()
        LOGGER.error("Unable to fetch_all_searches. status_code=%s, error=%s", response.code, error)

    return searches


async def fetch_subscription_credential(auth_header, owner, subscription_id, async_kvstore_client):
    response = await async_kvstore_client.async_kvstore_get_request(
        collection=SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME,
        owner=owner,
        key_id=subscription_id,
        auth_header=auth_header)

    auth = None
    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        auth = SubscriptionCredential.from_json(response_json)

    return auth


async def validate_subscription_credential(subscription_credential, async_splunk_client):
    if not subscription_credential:
        return None

    auth_header = SplunkAuthHeader(subscription_credential.session_key)
    is_valid_session_key = await auth_header.validate(async_splunk_client)

    if not is_valid_session_key:
        auth_header = None

    return auth_header


async def count_dependant_searches(auth_header, search_key, async_kvstore_client):
    query = json.dumps({PARENT_SEARCH_KEY: search_key})
    fields = [KEY]
    params = {QUERY: query, FIELDS: ','.join(fields)}
    r = await async_kvstore_client.async_kvstore_get_request(SEARCHES_COLLECTION_NAME, auth_header,
                                                             params=params)

    if r.code != HTTPStatus.OK:
        error = await r.text()
        LOGGER.warn("Search dependants fetch failed search_key=%s, code=%s, error=%s", search_key, r.code, error)
        return 0
    else:
        dependants = await r.json()
        return len(dependants)


async def fetch_credentials(auth_header, subscriptions, async_splunk_client, async_kvstore_client):
    result = {}
    for subscription in subscriptions:
        credential = await fetch_subscription_credential(auth_header, subscription.user, subscription.key(),
                                                         async_kvstore_client)
        subscription_auth_header = await validate_subscription_credential(credential, async_splunk_client)

        if subscription_auth_header:
            result[subscription.key()] = subscription_auth_header

    return result


async def fetch_subscriptions(auth_header, subscription_id=None, search_key=None, async_kvstore_client=None):
    """
    Fetch subscription objects from kvstore collection [subscription] with search_key
    :param auth_header:
    :param subscription_id:
    :param search_key:
    :param async_kvstore_client:
    :return:
    """
    if search_key:
        query = {AND_OPERATOR: [{SUBSCRIPTION_KEY: search_key}, {SUBSCRIPTION_TYPE: SEARCH}]}
        params = {QUERY: json.dumps(query)}
    else:
        query = {SUBSCRIPTION_TYPE: SEARCH}
        params = {QUERY: json.dumps(query)}

    response = await async_kvstore_client.async_kvstore_get_request(
        collection=SUBSCRIPTIONS_COLLECTION_NAME,
        owner=NOBODY,
        key_id=subscription_id,
        params=params,
        auth_header=auth_header)

    subscriptions = []
    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        if isinstance(response_json, list):
            subscriptions = [Subscription.from_json(subscription) for subscription in response_json]
        else:
            if response_json:
                subscriptions.append(Subscription.from_json(response_json))
    else:
        error = await response.text()
        LOGGER.error("Unable to fetch_subscriptions. status_code=%s, error=%s, search_key=%s",
                     response.code, error, search_key)

    return subscriptions


async def delete_subscription(auth_header, owner=None, subscription_key=None, async_kvstore_client=None):
    """
    Delete subscription
    :param auth_header:
    :param owner:
    :param subscription_key:
    :param async_kvstore_client:
    :return:
    """
    response = await async_kvstore_client.async_kvstore_delete_request(
        collection=SUBSCRIPTIONS_COLLECTION_NAME,
        owner=owner,
        key_id=subscription_key,
        auth_header=auth_header)

    if response.code == HTTPStatus.OK:
        LOGGER.info("Subscription Deleted. subscription_key=%s", subscription_key)
        return True

    # if not OK then log the error and return false
    error = await response.text()
    LOGGER.error("Unable to delete_subscription. status_code=%s, error=%s, subscription_key=%s",
                 response.code, error, subscription_key)
    return False


async def delete_search(auth_header, search_key=None, async_kvstore_client=None):
    """
    Delete search from kvstore collection [searches] by search_key
    :param auth_header:
    :param search_key:
    :param async_kvstore_client:
    :return:
    """
    response = await async_kvstore_client.async_kvstore_delete_request(
        collection=SEARCHES_COLLECTION_NAME,
        key_id=search_key,
        auth_header=auth_header)

    if response.code == HTTPStatus.OK:
        LOGGER.info("Search Deleted. search_key=%s", search_key)
        return True

    # if not OK then log the error and return false
    error = await response.text()
    LOGGER.error("Unable to delete_search. status_code=%s, error=%s, search_key=%s",
                 response.code, error, search_key)
    return False


async def validate_dashboard_search(request_context,
                                    dashboard_id=None,
                                    type_id=None,
                                    search_type=SearchType.VISUALIZATION,
                                    input_tokens=None,
                                    async_kvstore_client=None,
                                    async_splunk_client=None,
                                    async_itsi_client=None):
    """
    Validation method to validate a dashboard_id and visualization_id.  Will except a SpacebridgeApiRequestError if
    issues are detected and return a dashboard_description if valid

    :param request_context:
    :param dashboard_id:
    :param type_id:
    :param search_type:
    :param input_tokens:
    :param async_kvstore_client:
    :param async_splunk_client:
    :param async_itsi_client:
    :return:
    """
    # Validate params
    if not dashboard_id or not type_id:
        error_message = f"Invalid Request Params dashboard_id={dashboard_id}, search_type_id={type_id}, " \
                        f"search_type={search_type}"
        raise SpacebridgeApiRequestError(error_message, status_code=HTTPStatus.BAD_REQUEST)

    # fetch dashboard body
    dashboard_description = await fetch_dashboard_description(
        request_context=request_context,
        dashboard_id=dashboard_id,
        async_splunk_client=async_splunk_client,
        async_kvstore_client=async_kvstore_client,
        async_itsi_client=async_itsi_client)

    search = None
    if search_type == SearchType.VISUALIZATION:
        visualization = dashboard_description.get_visualization(type_id)
        if not visualization:
            error_message = f"Dashboard visualization not found. " \
                            f"dashboard_id={dashboard_id}, visualization_id={type_id}"
            raise SpacebridgeApiRequestError(error_message, status_code=HTTPStatus.NOT_FOUND)
        search = visualization.search
    elif search_type == SearchType.INPUT:
        input_token = dashboard_description.get_input_token_by_query_id(type_id)
        if not input_token:
            error_message = f"Input Search not found. dashboard_id={dashboard_id}, query_id={type_id}"
            raise SpacebridgeApiRequestError(error_message, status_code=HTTPStatus.NOT_FOUND)
        search = input_token.input_type.dynamic_options.search
    elif search_type == SearchType.DATA_SOURCE:
        datasources = [d for d in dashboard_description.definition.udf_data_sources if d.name == type_id]
        if len(datasources) != 1:
            raise SpacebridgeApiRequestError(
                f"Unexpected number of matching datasources in dashboard. Expected 1 but found {len(datasources)}",
                status_code=HTTPStatus.CONFLICT)

    # validate depends
    if search and not search.are_render_tokens_defined(input_tokens):
        error_message = f"Search is waiting for input. depends={search.depends}, rejects={search.rejects}, " \
                        f"dashboard_id={dashboard_id}, type_id={type_id}, search_type={search_type}"
        raise SpacebridgeApiRequestError(error_message, status_code=HTTPStatus.NOT_FOUND)

    return dashboard_description
