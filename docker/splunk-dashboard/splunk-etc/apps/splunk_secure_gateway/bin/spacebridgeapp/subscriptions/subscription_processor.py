"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Subscription asynchronous processor methods

"""
from http import HTTPStatus
from cloudgateway.splunk.auth import SplunkAuthHeader
from spacebridgeapp.data.dispatch_state import DispatchState
from spacebridgeapp.request.dashboard_request_processor import fetch_search_job_results_visualization_data, \
    get_search_job_content
from spacebridgeapp.dashboard.dashboard_helpers import parse_dashboard_id
from spacebridgeapp.request.request_processor import JWTAuthHeader
from spacebridgeapp.subscriptions.job_result import JobResult
from spacebridgeapp.subscriptions.subscription_search_requests import build_subscription_update, \
    send_subscription_updates, start_job_and_update_search, fetch_visualization_data, update_job_status, \
    fetch_search
from spacebridgeapp.subscriptions.subscription_requests import fetch_subscriptions
from spacebridgeapp.subscriptions.subscription_update_message import build_server_subscription_update
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, JWT_TOKEN_TYPE
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.data.visualization_type import VisualizationType
from spacebridgeapp.data.dashboard_data import VisualizationData
from spacebridgeapp.search.input_token_support import inject_tokens_into_string, load_input_tokens
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.time_utils import is_datetime_expired, get_current_timestamp_str

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_subscription_processor.log", "subscription_processor")


async def _update_subscriptions_with_post_search(auth_header, subscription_search, subscriptions, input_tokens,
                                                 encryption_context, job_status, async_spacebridge_client,
                                                 async_kvstore_client, async_splunk_client, post_search_map,
                                                 subscriber_update_ids):

    new_subscriber_update_ids = {}
    for subscription in subscriptions:
        post_search = post_search_map.get(subscription.key(), None)
        try:
            current_results = await fetch_visualization_data(auth_header=auth_header,
                                                             owner=subscription_search.owner,
                                                             app_name=SPACEBRIDGE_APP_NAME,
                                                             subscription_search=subscription_search,
                                                             input_tokens=input_tokens,
                                                             async_splunk_client=async_splunk_client,
                                                             map_post_search=post_search)

        except SpacebridgeApiRequestError:
            LOGGER.warn("Failed to fetch visualization data with post search, update cannot be sent")
            return new_subscriber_update_ids

        LOGGER.debug("Search results={}".format(current_results))
        subscription_update = build_subscription_update(subscription_search, current_results, job_status)

        new_subscriber_update_ids = await send_subscription_updates(auth_header=auth_header,
                                                                    subscriptions=[subscription],  # Wrap in a list
                                                                    subscription_update=subscription_update,
                                                                    encryption_context=encryption_context,
                                                                    async_spacebridge_client=async_spacebridge_client,
                                                                    async_kvstore_client=async_kvstore_client,
                                                                    subscriber_update_ids=subscriber_update_ids)

    return new_subscriber_update_ids


async def _update_subscriptions_without_post_search(auth_header, subscription_search, input_tokens,
                                                    encryption_context, job_status, async_spacebridge_client,
                                                    async_kvstore_client, async_splunk_client,
                                                    subscriptions, subscriber_update_ids):
    new_subscriber_update_ids = {}
    if subscriptions:
        try:
            current_results = await fetch_visualization_data(auth_header=auth_header,
                                                             owner=subscription_search.owner,
                                                             app_name=SPACEBRIDGE_APP_NAME,
                                                             subscription_search=subscription_search,
                                                             input_tokens=input_tokens,
                                                             async_splunk_client=async_splunk_client)
        except SpacebridgeApiRequestError:
            LOGGER.warn("Failed to fetch visualization data, update cannot be sent")
            return new_subscriber_update_ids

        LOGGER.debug("Search sid=%s, results=%s", subscription_search.key(), current_results)
        subscription_update = build_subscription_update(subscription_search, current_results, job_status)

        new_subscriber_update_ids = await send_subscription_updates(auth_header=auth_header,
                                                                    subscriptions=subscriptions,
                                                                    subscription_update=subscription_update,
                                                                    encryption_context=encryption_context,
                                                                    async_spacebridge_client=async_spacebridge_client,
                                                                    async_kvstore_client=async_kvstore_client,
                                                                    subscriber_update_ids=subscriber_update_ids)

    return new_subscriber_update_ids


async def _broadcast_data_update(auth_header, subscription_search, subscriptions, search_updates,
                                 input_tokens, encryption_context, job_status, async_spacebridge_client,
                                 async_kvstore_client, async_splunk_client, subscriber_update_ids):

    visualization_type = VisualizationType.from_value(subscription_search.visualization_type)
    if visualization_type == VisualizationType.DASHBOARD_VISUALIZATION_MAP:
        subscriptions_with_post_searches = {key for key in search_updates}
        post_search_map = {key: search_updates[key].get_post_search() for key in subscriptions_with_post_searches}

        new_subscriber_update_ids = await _update_subscriptions_with_post_search(auth_header=auth_header,
                                                                                 subscription_search=subscription_search,
                                                                                 subscriptions=subscriptions,
                                                                                 input_tokens=input_tokens,
                                                                                 encryption_context=encryption_context,
                                                                                 job_status=job_status,
                                                                                 async_spacebridge_client=async_spacebridge_client,
                                                                                 async_kvstore_client=async_kvstore_client,
                                                                                 async_splunk_client=async_splunk_client,
                                                                                 post_search_map=post_search_map,
                                                                                 subscriber_update_ids=subscriber_update_ids)
    else:
        new_subscriber_update_ids = await _update_subscriptions_without_post_search(auth_header=auth_header,
                                                                                    subscription_search=subscription_search,
                                                                                    input_tokens=input_tokens,
                                                                                    encryption_context=encryption_context,
                                                                                    job_status=job_status,
                                                                                    async_spacebridge_client=async_spacebridge_client,
                                                                                    async_kvstore_client=async_kvstore_client,
                                                                                    async_splunk_client=async_splunk_client,
                                                                                    subscriptions=subscriptions,
                                                                                    subscriber_update_ids=subscriber_update_ids)

    return new_subscriber_update_ids


def _to_auth_header(credentials):
    auth_header = SplunkAuthHeader(credentials.session_key)
    if credentials.session_type == JWT_TOKEN_TYPE:
        auth_header = JWTAuthHeader(credentials.user, credentials.session_key)

    return auth_header


_TERMINAL_STATES = [DispatchState.DONE.value, DispatchState.FAILED.value]


def _is_job_complete(job_status):
    return job_status.dispatch_state in _TERMINAL_STATES


async def _refresh_search_job(subscription_search, credentials, input_tokens,
                              async_splunk_client, async_kvstore_client):

    if not credentials:
        LOGGER.debug("Refresh failed, no credentials associated with search.  search_key=%s",
                     subscription_search.key())
        return

    user_creds = credentials[subscription_search.owner]
    LOGGER.debug("Refresh search with credentials user=%s, key=%s, search_key=%s",
                 user_creds.user, user_creds.key, subscription_search.key())
    user_auth_header = _to_auth_header(user_creds)

    try:
        await start_job_and_update_search(user_auth_header, subscription_search, input_tokens,
                                          async_splunk_client, async_kvstore_client)
    except StopIteration:
        LOGGER.info("Failed to start search job, credentials missing. search_key=%s",
                    subscription_search.key())
    except SpacebridgeApiRequestError:
        LOGGER.exception("Failed to start search job, search_key=%s", subscription_search.key())

    return True


async def _refresh_search_job_if_expired(subscription_search, credentials, input_tokens, job_status,
                                         async_splunk_client, async_kvstore_client):
    is_refreshing = subscription_search.is_refreshing()
    is_update_passed = is_datetime_expired(subscription_search.next_update_time)
    is_job_complete = _is_job_complete(job_status)

    is_refresh_required = is_refreshing and is_update_passed and is_job_complete

    LOGGER.debug("Refresh required check search_key=%s, is_refresh_required=%s, is_refreshing=%s, is_update_passed=%s, is_job_complete=%s",
                 subscription_search.key(), is_refresh_required, is_refreshing, is_update_passed, is_job_complete)

    if is_refresh_required:
        await _refresh_search_job(subscription_search, credentials, input_tokens,
                                  async_splunk_client, async_kvstore_client)

    return True


async def _handle_expired_sid(system_auth_header, subscription_search, credentials, input_tokens,
                              async_splunk_client, async_kvstore_client):
    LOGGER.info("Job status not found, search_key=%s", subscription_search.key())
    await _refresh_search_job(subscription_search, credentials, input_tokens,
                              async_splunk_client, async_kvstore_client)

    job_status = await get_search_job_content(system_auth_header, subscription_search.owner, SPACEBRIDGE_APP_NAME,
                                              subscription_search.sid, async_splunk_client)

    return job_status


async def process_pubsub_subscription(system_auth_header, encryption_context, async_spacebridge_client,
                                      async_kvstore_client, async_splunk_client, search_context, subscription_update_ids):
    """
    :param system_auth_header:
    :param encryption_context:
    :param async_spacebridge_client:
    :param async_kvstore_client:
    :param async_splunk_client:
    :param search_context:
    :param dependant_searches:
    :return:
    """
    subscription_search = search_context.search

    credentials = search_context.subscription_credentials

    search_updates = search_context.search_updates

    user_subscriptions = search_context.subscriptions

    dependant_searches = search_context.dependant_search_counts

    LOGGER.debug(
        "Found valid subscribers, search_key=%s, user_subscriber_count=%s, search_updates=%s",
        subscription_search.key(),
        len(user_subscriptions),
        search_updates)

    input_tokens = load_input_tokens(subscription_search.input_tokens)

    if not subscription_search.sid:
        LOGGER.info("Pubsub search has no sid, search_key=%s", subscription_search.key())
        return JobResult(False)

    job_status = await get_search_job_content(system_auth_header, subscription_search.owner, SPACEBRIDGE_APP_NAME,
                                              subscription_search.sid, async_splunk_client)

    LOGGER.debug("Search job status, search_key=%s, job=%s", subscription_search.key(), job_status)
    dependant_search_count = dependant_searches[subscription_search.key()]

    LOGGER.debug("Search job dependants search_key=%s, user_subscriptions=%s, dependant_search_count=%s",
                 subscription_search.key(), len(user_subscriptions), dependant_search_count)
    if not job_status and (len(user_subscriptions) > 0 or dependant_search_count > 0):
        job_status = await _handle_expired_sid(system_auth_header, subscription_search,
                                               credentials, input_tokens,
                                               async_splunk_client, async_kvstore_client)

    if not job_status:
        LOGGER.warn("Job status could not be retrieved, search_key=%s, sid=%s",
                    subscription_search.key(), subscription_search.sid)
        return JobResult(False)

    new_subscription_update_ids = {}
    # only send updates if the job was still running the last time we saw it
    if len(user_subscriptions) > 0:
        LOGGER.debug("Broadcast Data Updates: search_key=%s, updates=%s", subscription_search.key(), search_updates)
        new_subscription_update_ids = await _broadcast_data_update(system_auth_header, subscription_search,
                                                                   user_subscriptions, search_updates,
                                                                   input_tokens, encryption_context, job_status,
                                                                   async_spacebridge_client, async_kvstore_client,
                                                                   async_splunk_client, subscription_update_ids)

    update_job_status(subscription_search, job_status)

    if user_subscriptions or dependant_search_count:
        LOGGER.debug("Search has subscribers search_key=%s, subscriber_count=%s, dependant_search_count=%s",
                     subscription_search.key(), len(user_subscriptions), dependant_search_count)

        await _refresh_search_job_if_expired(subscription_search, credentials, input_tokens, job_status,
                                             async_splunk_client, async_kvstore_client)

        subscription_search.last_update_time = get_current_timestamp_str()

    LOGGER.debug("Persisting search job state, search_key=%s, job_status=%s",
                 subscription_search.key(), job_status)

    return JobResult(True, subscription_search, new_subscription_update_ids)


async def process_subscription(request_context=None,
                               subscription_id=None,
                               server_subscription_update=None,
                               async_client_factory=None,
                               map_post_search=None):
    """
    Process subscription given subscription_id.  This will populate a server_subscription_update with data if
    subscription saved data exists.

    :param request_context:
    :param subscription_id:
    :param server_subscription_update:
    :param async_client_factory:
    :param map_post_search:
    :return:
    """
    # Pull out async_kvstore_client
    async_kvstore_client = async_client_factory.kvstore_client()

    # Make KVStore call to the subscription and pull out device_id, search_key, check expired?
    subscriptions = await fetch_subscriptions(auth_header=request_context.auth_header,
                                              subscription_id=subscription_id,
                                              async_kvstore_client=async_kvstore_client)
    # list of subscriptions returned
    if not subscriptions:
        error_message = "Failed to fetch subscription. subscription_id={}".format(subscription_id)
        raise SpacebridgeApiRequestError(error_message, status_code=HTTPStatus.NOT_FOUND)

    # Get first subscription
    subscription = subscriptions[0]

    # Make KVStore call with search_key to fetch the search
    search = await fetch_search(request_context.auth_header,
                                search_key=subscription.subscription_key,
                                async_kvstore_client=async_kvstore_client)

    LOGGER.debug("Retrieved search.  search_key=%s, search=%s", subscription.subscription_key, search)

    # Pull out async_splunk_client
    async_splunk_client = async_client_factory.splunk_client()

    # if sid from search exists then return a ServerSubscriptionUpdate with data from sid if finished processing
    if search and search.sid:
        LOGGER.debug("Search job found, search_key=%s, sid=%s", subscription.subscription_key, search.sid)
        await process_single_subscription_update(request_context=request_context,
                                                 search=search,
                                                 visualization_id=subscription.visualization_id,
                                                 server_subscription_update=server_subscription_update,
                                                 async_splunk_client=async_splunk_client,
                                                 map_post_search=map_post_search)
    elif search and search.ds_test:  # This means we have a ds.test data_source
        LOGGER.debug("ds.test data source found, search_key=%s, sid=%s, data_source_id=%s",
                     subscription.subscription_key, search.sid, search.search_type_id)
        build_ds_test_update(search=search, server_subscription_update=server_subscription_update)
    else:
        LOGGER.debug("Search not found, search_key=%s, sid=%s", subscription.subscription_key, search.sid)


async def process_single_subscription_update(request_context,
                                             search,
                                             visualization_id,
                                             server_subscription_update,
                                             async_splunk_client,
                                             map_post_search=None):
    """
    An async processor which will create a subscription data event
    :param request_context:
    :param search:
    :param visualization_id:
    :param server_subscription_update:
    :param async_splunk_client:
    :param map_post_search:
    :return:
    """
    user, app_name, dashboard_name = parse_dashboard_id(search.dashboard_id)

    # Add post_search if search is dependent (i.e. defines a base)

    post_search = None
    sid = search.sid
    if search.base:
        input_tokens = load_input_tokens(search.input_tokens)
        post_search = inject_tokens_into_string(input_tokens, search.query)
        LOGGER.debug("Search has base, using parent sid, search_key=%s, sid=%s, post_search=%s",
                     search.key(), sid, post_search)

    if not post_search:
        post_search = map_post_search
    elif map_post_search:
        post_search += " " + map_post_search

    # Query the job status
    job_status = await get_search_job_content(auth_header=request_context.system_auth_header,
                                              owner=user,
                                              app_name=app_name,
                                              search_id=sid,
                                              async_splunk_client=async_splunk_client)

    # If no job_status we don't try to send this update
    if job_status is not None:
        # call api with sid
        visualization_data = await fetch_search_job_results_visualization_data(
            owner=user,
            app_name=app_name,
            search_id=sid,
            post_search=post_search,
            auth_header=request_context.system_auth_header,
            async_splunk_client=async_splunk_client)

        # populate update if data available, if no data is available it means job is still processing or error occurred
        # its okay if we miss this update as it should get processing in looping update
        if visualization_data:

            subscription_update = build_subscription_update(search=search,
                                                            visualization_data=visualization_data,
                                                            job_status=job_status)

            build_server_subscription_update(subscription_update, server_subscription_update)
            _log_subscription_update_event(search, subscription_update, server_subscription_update)
        else:
            LOGGER.debug("No visualization data found, sid=%s, visualization_id=%s", sid, visualization_id)
    else:
        LOGGER.debug("No search job status found, sid=%s, visualization_id=%s", sid, visualization_id)


def build_ds_test_update(search, server_subscription_update):
    """
    This helper method will be SubscriptionUpdate from ds_test specified values
    :param search:
    :param server_subscription_update:
    :return:
    """
    # Read search and build subscription_update from visualization_data stored in search.ds.test
    # Build visualization_data
    visualization_data = VisualizationData.from_ds_test(search.ds_test)
    subscription_update = build_subscription_update(search=search, visualization_data=visualization_data)
    build_server_subscription_update(subscription_update, server_subscription_update)
    _log_subscription_update_event(search, subscription_update, server_subscription_update)


def _log_subscription_update_event(search, subscription_update, server_subscription_update):
    """
    Helper method to used to log the subscription update event for the post process updates
    :param search: 
    :param subscription_update: 
    :param server_subscription_update: 
    :return: 
    """
    # Log this Subscription Event
    LOGGER.info(f"Send Post Process Single Subscription Update. search_key={search.key()}, "
                f"subscription_id={server_subscription_update.subscriptionId}, "
                f"update_id={server_subscription_update.updateId}, "
                f"request_id={server_subscription_update.requestId}, "
                f"type={type(subscription_update).__name__}, "
                f"done_progress={subscription_update.done_progress}, "
                f"dispatch_state={subscription_update.dispatch_state}")
