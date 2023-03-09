"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process Generic Message requests and forward those requests to the corresponding companion splunk app
"""
import base64
import json

from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient
from spacebridgeapp.util import constants, cache
from spacebridgeapp.logging import setup_logging
from splapp_protocol import subscription_pb2, request_pb2
from http import HTTPStatus
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError, \
    SpacebridgeCompanionAppNotRegisteredError, SpacebridgeUnsupportedMessageTypeError

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_generic_request_processor.log", "generic_request_processor")

# Cached Companion Apps so that we don't have to query kvstore on every request
__CACHED_COMPANION_APPS: cache.CachedResult = None
CACHE_TTL_SECONDS = 60

# String Constants
MESSAGE_FIELD = "message"
NAMESPACE_FIELD = "namespace"
APP_NAME_FIELD = "app_name"
BASE_URL_FIELD = "base_url"
REQUEST_ID_FIELD = "request_id"
CLIENT_VERSION_FIELD = "client_version"
SUBSCRIPTION_ID = "subscription_id"
IS_ALERT = "is_alert"

def _disable_cache():
    """
    A hook intended to be used by tests
    :return:
    """
    global CACHE_TTL_SECONDS
    CACHE_TTL_SECONDS = 0


async def _fetch_registered_apps(auth_header, async_splunk_client):
    """
    Fetch registered companion apps from the services/ssg/registration/companion_apps endpoint.
    Returns dictionary of app id to app bundle (json of app registration info)
    """
    response = await async_splunk_client.async_fetch_companion_apps(auth_header)

    if response.code != HTTPStatus.OK:
        raise SpacebridgeApiRequestError(
            "Error fetching registered companion apps with code={}".format(response.code), status_code=response.code)

    jsn = await response.json()
    companion_apps = {}

    for app in jsn:
        companion_apps[app[constants.KEY]] = app

    return companion_apps


async def fetch_registered_apps(auth_header, async_splunk_client):
    await cache_companion_app_list(auth_header, async_splunk_client)
    return __CACHED_COMPANION_APPS.value


async def cache_companion_app_list(auth_header, async_splunk_client):
    """ Check if cached companion apps list needs to be updated (cache ttl is expired) and if so, update the cached
    companion apps list.
    """
    global __CACHED_COMPANION_APPS
    if not __CACHED_COMPANION_APPS or not __CACHED_COMPANION_APPS.is_valid():
        LOGGER.info("Refreshing cached companion app list")
        registered_apps = await _fetch_registered_apps(auth_header, async_splunk_client)
        __CACHED_COMPANION_APPS = cache.CachedResult(registered_apps, ttl=CACHE_TTL_SECONDS)


def extract_generic_message(client_request):
    """ Helper method to extract message, namespace and request type from client application message"""
    request_type = 'unknown'
    if isinstance(client_request, subscription_pb2.ClientSubscriptionMessage) and \
            client_request.HasField(constants.CLIENT_SUBSCRIBE_REQUEST):

        namespace = client_request.clientSubscribeRequest.genericMessage.namespace
        message = client_request.clientSubscribeRequest.genericMessage.message
        request_type = constants.SUBSCRIPTION

    elif isinstance(client_request, subscription_pb2.ClientSubscriptionMessage) and \
            client_request.HasField(constants.CLIENT_SUBSCRIPTION_UPDATE):

        namespace = client_request.clientSubscriptionUpdate.genericMessage.namespace
        message = client_request.clientSubscriptionUpdate.genericMessage.message
        request_type = constants.SUBSCRIPTION

    elif isinstance(client_request, request_pb2.ClientSingleRequest):

        namespace = client_request.genericMessage.namespace
        message = client_request.genericMessage.message
        request_type = constants.SINGLE_REQUEST
    else:
        raise SpacebridgeUnsupportedMessageTypeError(request_type)

    return (namespace, message, request_type)


async def process_generic_message_request(request_context, client_request, server_response, async_client_factory):
    """
    Process a generic message request. Forward the message part of request to corresponding companion app. Take
    the response and send it back as a generic message.
    """
    LOGGER.info("Processing generic message request")

    namespace, message, request_type = extract_generic_message(client_request)
    async_splunk_client = async_client_factory.splunk_client()
    async_non_ssl_client = async_client_factory.non_ssl_client()

    # Cache companion app list so that we don't need to fetch the list on every call
    app_list = await fetch_registered_apps(request_context.auth_header, async_splunk_client)

    LOGGER.debug("Number of registered apps={}".format(len(app_list)))

    matching_app_ids = [app_id for app_id in app_list if namespace.startswith(app_id)]

    if not matching_app_ids:
        raise SpacebridgeCompanionAppNotRegisteredError(
            "Namespace {} is not a associated with a registered app on this instance".format(namespace))

    if len(matching_app_ids) > 1:
        raise SpacebridgeApiRequestError(
            "Request was associated with multiple companion apps. Namespace should be unique",
            status_code=HTTPStatus.BAD_REQUEST)

    app_bundle = app_list[matching_app_ids[0]]

    headers = {
        constants.HEADER_CONTENT_TYPE: constants.APPLICATION_JSON,
        constants.HEADER_USER_AGENT: client_request.userAgent
    }

    data = {
        REQUEST_ID_FIELD: request_context.request_id,
        CLIENT_VERSION_FIELD: client_request.clientVersion,
        NAMESPACE_FIELD: namespace,
        MESSAGE_FIELD: base64.b64encode(message).decode('utf-8'),
        constants.SHARD_ID: request_context.shard_id,
        constants.DEVICE_ID: request_context.device_id,
        IS_ALERT: request_context.is_alert
    }

    uri = get_forward_uri(request_type, app_bundle[BASE_URL_FIELD])
    response = await async_non_ssl_client.async_post_request(uri=uri,
                                                             auth_header=request_context.auth_header,
                                                             data=json.dumps(data),
                                                             headers=headers)
    if response.code == HTTPStatus.NO_CONTENT:
        return False

    if response.code != HTTPStatus.OK:
        msg = await response.text()
        LOGGER.error("Error forwarding request to app={}, base_url={}, e={}"
                     .format(app_bundle[APP_NAME_FIELD], app_bundle[BASE_URL_FIELD], msg))
        raise SpacebridgeApiRequestError("Error forwarding request to companion app with error={}".format(msg),
                                         status_code=response.code)

    jsn = await response.json()
    app_response = base64.b64decode(jsn[MESSAGE_FIELD].encode('utf-8'))
    response_namespace = jsn[NAMESPACE_FIELD]
    subscription_id = jsn[SUBSCRIPTION_ID] if SUBSCRIPTION_ID in jsn else ""

    if isinstance(server_response, subscription_pb2.ServerSubscriptionResponse):
        server_response.serverSubscribeResponse.genericMessage.message = app_response
        server_response.serverSubscribeResponse.genericMessage.namespace = response_namespace
        server_response.subscriptionId = subscription_id

    else:
        server_response.genericMessage.message = app_response
        server_response.genericMessage.namespace = response_namespace

    LOGGER.info("Finished processing generic message request")


def get_forward_uri(request_type, base_url):
    if request_type == constants.SINGLE_REQUEST:
        return '{}/process_request'.format(base_url)
    elif request_type == constants.SUBSCRIPTION:
        return '{}/process_subscription'.format(base_url)
    raise Exception("Unsupported request_type={}".format(request_type))
