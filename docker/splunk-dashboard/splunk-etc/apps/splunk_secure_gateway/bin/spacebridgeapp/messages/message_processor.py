"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Message Processing module for taking serialized protobuf
messages received over websocket, process them and take the
appropriate action (fetch alerts, add subscription, etc) and
produce a serialized protobuf message to send back.
"""

import asyncio
import sys
import contextvars

from spacebridgeapp.util import py23
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.request.spacebridge_request_processor import unregister_device, mdm_authentication_request
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.versioning import app_version, minimum_build, is_version_ok
from spacebridgeapp.versioning.client_minimum import format_version
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SERVER_SUBSCRIPTION_RESPONSE, \
    SERVER_SUBSCRIBE_RESPONSE, CLIENT_SINGLE_REQUEST, CLIENT_SUBSCRIPTION_MESSAGE, UNREGISTER_EVENT, \
    MDM_REGISTRATION_REQUEST, REQUEST_CONTEXT
from spacebridgeapp.util.guid_generator import get_guid
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeError, OperationHaltedError, \
    SpacebridgeCompanionAppError, SpacebridgeUnsupportedMessageTypeError
from spacebridgeapp.request import connectivity_test_request_processor
from spacebridgeapp.request.request_processor import parse_session_token, parse_run_as_credentials
from spacebridgeapp.subscriptions import subscription_processor
from spacebridgeapp.request.request_list import REQUESTS, SUBSCRIPTION_REQUESTS, ENCRYPTION_CONTEXT
from spacebridgeapp.request.request_type import RequestType
from spacebridgeapp.metrics.websocket_metrics import send_websocket_metrics_to_telemetry
from spacebridgeapp.logging import setup_logging
from splapp_protocol import envelope_pb2
from splapp_protocol import common_pb2

from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', SPACEBRIDGE_APP_NAME, 'lib']))

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_message_processor.log", "message_processor")


async def post_process_message(request_context,
                               input_server_application_message,
                               async_client_factory,
                               guid_generator):
    # Post processing on serverSubscriptionResponse
    if input_server_application_message.HasField(SERVER_SUBSCRIPTION_RESPONSE):
        try:
            # Create Server Application Message to return for post_processing
            server_application_message = envelope_pb2.ServerApplicationMessage()

            # Populate a server_subscription_update which
            server_subscription_update = server_application_message.serverSubscriptionUpdate
            server_subscription_update.requestId = guid_generator()
            server_subscription_update.updateId = guid_generator()

            # Get subscription_id
            server_subscription_response = input_server_application_message.serverSubscriptionResponse
            subscription_id = server_subscription_response.subscriptionId
            server_subscription_update.subscriptionId = subscription_id

            if server_subscription_response.HasField(SERVER_SUBSCRIBE_RESPONSE):
                # Only process if server_subscription_response doesn't set subscription_type
                if not server_subscription_response.serverSubscribeResponse.WhichOneof("subscription_type"):
                    LOGGER.info(f"Start Post Process Single Subscription Update. subscription_id={subscription_id}, "
                                f"update_id={server_subscription_update.updateId}, "
                                f"request_id={server_subscription_update.requestId}")
                    map_post_search = server_subscription_response.serverSubscribeResponse.postSearch or None
                    await subscription_processor.process_subscription(request_context,
                                                                      subscription_id,
                                                                      server_subscription_update,
                                                                      async_client_factory,
                                                                      map_post_search=map_post_search)

        except SpacebridgeError as e:
            LOGGER.exception("SpacebridgeError during post_process_message")
            e.set_proto(server_subscription_update)
        except Exception as e:
            LOGGER.exception("Unhandled exception during post_process_message")
            server_subscription_update.error.code = common_pb2.Error.ERROR_UNKNOWN
            server_subscription_update.error.message = str(e)

        # Send out response if any errors or an update is encountered
        if not server_subscription_update.WhichOneof('subscription_update'):
            LOGGER.info(f"No Post Processing Response required for subscription_id={subscription_id}")
            return None

        # Send out response if update is specified, returns errors and single saved search responses
        return server_application_message.SerializeToString()


async def process_message(message_sender, client_application_message, server_application_message, async_client_factory,
                          encryption_context, server_response_id, system_auth_header, shard_id):
    device_id = py23.b64encode_to_str(message_sender)
    device_key = py23.urlsafe_b64encode_to_str(message_sender)

    encryption_context = encryption_context
    async_request_client = async_client_factory.request_client()
    async_request_client.on_request(device_key)

    if client_application_message.HasField(CLIENT_SINGLE_REQUEST):
        request_object = client_application_message.clientSingleRequest
        response_object = server_application_message.serverSingleResponse
        response_object.replyToMessageId = request_object.requestId
        response_object.serverVersion = str(app_version())

        processor = process_request
        request_type = CLIENT_SINGLE_REQUEST

    elif client_application_message.HasField(CLIENT_SUBSCRIPTION_MESSAGE):
        request_object = client_application_message.clientSubscriptionMessage

        # pings have a special case response, really they could be in their own modular input
        if client_application_message.clientSubscriptionMessage.HasField(RequestType.CLIENT_SUBSCRIPTION_PING.value):
            response_object = server_application_message.serverSubscriptionPing
        else:
            response_object = server_application_message.serverSubscriptionResponse
            response_object.replyToMessageId = request_object.requestId
            response_object.serverVersion = str(app_version())

        processor = process_subscription
        request_type = CLIENT_SUBSCRIPTION_MESSAGE

    else:
        LOGGER.warn("No suitable message type found client application request")
        return "device_id={}".format(device_id)

    response_object.requestId = server_response_id

    if request_object.HasField("runAs"):
        LOGGER.debug("run as credentials is present")
        auth_header = await parse_run_as_credentials(encryption_context, system_auth_header,
                                                     async_client_factory, request_object.runAs)
    else:
        auth_header = parse_session_token(encryption_context, request_object.sessionToken)

    request_context = RequestContext(auth_header, device_id=device_id,
                                     raw_device_id=message_sender, request_id=request_object.requestId,
                                     current_user=auth_header.username, system_auth_header=system_auth_header,
                                     client_version=request_object.clientVersion, user_agent=request_object.userAgent,
                                     shard_id=shard_id)

    try:
        validate_client_version(request_object, response_object)
        await auth_header.validate(async_client_factory.splunk_client(), LOGGER, request_context)

        # Create a new ContextVar Context for this request to encapsulate the request_context to this specific request.
        # This is necessary otherwise the request_context variable will be set in the global namespace and different
        # might access each other's request context.
        request_ctx_var = contextvars.ContextVar(REQUEST_CONTEXT)
        request_ctx_var.set(request_context)
        ctx = contextvars.copy_context()

        should_send_response = await ctx.run(processor, request_context, encryption_context, request_object,
                                             response_object, async_client_factory)

        # If we aren't sending a response in this request clear the server_application_message
        if not should_send_response:
            server_application_message.Clear()

    except OperationHaltedError:
        server_application_message.ClearField('app_message')
    except SpacebridgeCompanionAppError as e:
        LOGGER.warn("CompanionAppError error=%s", e.message)
        e.set_proto(response_object)
    except SpacebridgeError as e:
        LOGGER.exception("SpacebridgeError during process_message")
        e.set_proto(response_object)
    except Exception as e:
        LOGGER.exception("Unhandled exception during process_message")
        response_object.error.code = common_pb2.Error.ERROR_UNKNOWN
        response_object.error.message = str(e)
    LOGGER.info('Finished processing message. {}'.format(request_context))
    return request_context


def validate_client_version(request_object, response_object):
    user_agent = request_object.userAgent or "invalid"
    user_agent_parts = user_agent.split('|')
    app_id = user_agent_parts[0]
    LOGGER.debug("Checking {} version {}".format(app_id, request_object.clientVersion))
    if not is_version_ok(app_id, request_object.clientVersion):
        app_min_build = minimum_build(app_id)

        raise SpacebridgeError('Client does not meet minimum version: {}'.format(app_min_build),
                               code=common_pb2.Error.ERROR_REQUEST_UPGRADE_REQUIRED,
                               client_minimum_version=format_version(request_object.clientVersion, app_min_build))


async def handle_spacebridge_message(auth_header, spacebridge_message, async_client_factory, encryption_context):
    """
    :param auth_header:
    :param spacebridge_message:
    :param async_client_factory:
    :param encryption_context:
    :type async_client_factory: AsyncClientFactory
    """
    if spacebridge_message.HasField(UNREGISTER_EVENT):
        LOGGER.info("Spacebridge unregister event")
        await unregister_device(auth_header,
                                spacebridge_message.unregisterEvent,
                                async_client_factory.splunk_client(),
                                async_client_factory.kvstore_client())
    if spacebridge_message.HasField(MDM_REGISTRATION_REQUEST):
        request_id = get_guid()
        LOGGER.info(f"message=RECEIVED_ENVELOPE type={MDM_REGISTRATION_REQUEST}, "
                    f"creating request_id={MDM_REGISTRATION_REQUEST}")
        await mdm_authentication_request(auth_header,
                                         spacebridge_message.mdmRegistrationRequest,
                                         async_client_factory,
                                         encryption_context,
                                         request_id)
    else:
        LOGGER.info("Unknown spacebridge message received")


async def process_request(request_context,
                          encryption_context,
                          client_single_request,
                          server_single_response,
                          async_client_factory):
    """ Accepts the input client single request proto and a server
        application response proto.

        Based on the type of the request, routes to the appropriate
        method for the request type, e.g.
            1. alerts list request
            2. delete alert request
            3. dashboard list request
            4. dashboard get request
            5. etc.
        and populates the Server Application Response proto accordingly.

        Arguments:
            client_application_message {ClientApplicationMessage Proto}
            server_application_response {ServerApplicationResponse Proto}

         Return:
            N
    """
    should_send = await process_request_list(request_context,
                                             client_single_request,
                                             server_single_response,
                                             async_client_factory,
                                             REQUESTS,
                                             encryption_context)

    # if should_send has value return it
    if should_send is not None:
        return should_send

    # Special Case Processing
    if client_single_request.HasField(RequestType.CONNECTIVITY_TEST_REQUEST.value):
        LOGGER.info("type={}".format(RequestType.CONNECTIVITY_TEST_REQUEST.name))
        asyncio.create_task(send_websocket_metrics_to_telemetry(
            RequestType.CONNECTIVITY_TEST_REQUEST.name, request_context, async_client_factory.telemetry_client(),
            LOGGER, useragent=client_single_request.userAgent, params=get_params_for_metrics(client_single_request)))

        await connectivity_test_request_processor.process_connectivity_test_request(
            request_context,
            encryption_context,
            client_single_request,
            server_single_response,
            async_client_factory.spacebridge_client(),
            async_client_factory.kvstore_client())

        # The connectivity_test_request is sent over https so we don't want to send response over wss as well
        return False
    else:
        # Fall through here then message type was not found
        message_not_supported(client_single_request.WhichOneof("request_message"))
        return True


async def process_subscription(request_context,
                               encryption_context,
                               client_subscription_message,
                               server_subscription_response,
                               async_client_factory):
    """
    Analogous method as process_request for processing ClientSingleRequests.

    Base on the type of subscription request routes to the appropriate handler
    1. Client Subscribe Request
    2. Client Unsubscribe Request
    3. Client Subscription Ping

    :param request_context:
    :param encryption_context:
    :param client_subscription_message:
    :param server_subscription_response:
    :param async_client_factory:
    :return: None - modified the server_application_response
    """
    should_send = await process_request_list(request_context,
                                             client_subscription_message,
                                             server_subscription_response,
                                             async_client_factory,
                                             SUBSCRIPTION_REQUESTS,
                                             encryption_context)

    # if should_send has value return it
    if should_send is not None:
        return should_send

    # Fall through if no valid message found
    message_not_supported(client_subscription_message.WhichOneof('subscription_operation'))

    # By default return a response object over wss
    return True


async def process_request_list(request_context,
                               client_message,
                               server_response,
                               async_client_factory,
                               request_list,
                               encryption_context):
    """
    Helper method used to process request from a request_list
    :param request_context:
    :param client_message:
    :param server_response:
    :param async_client_factory:
    :param request_list:
    :param encryption_context:
    :return:
    """
    async_telemetry_client = async_client_factory.telemetry_client()
    useragent = client_message.userAgent

    for request in request_list:
        enum, process_function, args = request
        if client_message.HasField(enum.value):
            LOGGER.info("type={}".format(enum.name))
            if enum.name != "CLIENT_SUBSCRIPTION_PING":
                asyncio.create_task(send_websocket_metrics_to_telemetry(
                    enum.name, request_context, async_telemetry_client, LOGGER, useragent=useragent,
                    params=get_params_for_metrics(client_message)))

            # Build argument map
            kwargs = {arg: async_client_factory.from_value(arg) for arg in args}

            if ENCRYPTION_CONTEXT in args:
                kwargs[ENCRYPTION_CONTEXT] = encryption_context
            should_send = await process_function(
                                    request_context,
                                    client_message,
                                    server_response,
                                    **kwargs)
            return False if should_send is False else True


def message_not_supported(message_type="unknown"):
    raise SpacebridgeUnsupportedMessageTypeError(message_type)


def get_params_for_metrics(client_message):
    return {
        'requestId': client_message.requestId,
        'messageSize': client_message.ByteSize(),
        'splappVersion': str(app_version())
    }
