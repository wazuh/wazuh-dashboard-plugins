
"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Initiates websocket connection used for end to end test
"""

import base64
import sys
import json
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23
import asyncio
from google.protobuf.json_format import ParseDict
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from cloudgateway.websocket import (AbstractMessageHandler, CloudGatewayWsClient, ServerResponse,
                                    AbstractWebsocketContext)
from cloudgateway.private.asyncio.messages.send import send_response
from splapp_protocol import envelope_pb2
from spacebridgeapp.util.constants import CLIENT_SINGLE_REQUEST, CLIENT_SUBSCRIBE_REQUEST, CLIENT_SUBSCRIPTION_UPDATE, \
    CLIENT_SUBSCRIPTION_MESSAGE

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "e2e_wss_test")

GENERIC_MESSAGE = "genericMessage"
NAMESPACE = "namespace"
MESSAGE = "message"


def build_request(jsn_request, session_token, rid, type=CLIENT_SINGLE_REQUEST):
    client_application_message = {
        type: {
            "userAgent": "userAgent",
            "requestId": rid,
            "clientVersion": "1.0.0",
            "sessionToken": session_token
        }
    }

    if type == CLIENT_SINGLE_REQUEST and GENERIC_MESSAGE in jsn_request:
        msg = ParseDict(client_application_message, envelope_pb2.ClientApplicationMessage())
        msg.clientSingleRequest.genericMessage.message = jsn_request[GENERIC_MESSAGE][MESSAGE].encode('utf-8')
        msg.clientSingleRequest.genericMessage.namespace = jsn_request[GENERIC_MESSAGE][NAMESPACE].encode('utf-8')
        return msg

    elif type == CLIENT_SUBSCRIPTION_MESSAGE and CLIENT_SUBSCRIBE_REQUEST in jsn_request \
            and GENERIC_MESSAGE in jsn_request[constants.CLIENT_SUBSCRIBE_REQUEST]:

        message = jsn_request[CLIENT_SUBSCRIBE_REQUEST][GENERIC_MESSAGE][MESSAGE].encode('utf-8')
        namespace = jsn_request[CLIENT_SUBSCRIBE_REQUEST][GENERIC_MESSAGE][NAMESPACE].encode('utf-8')
        msg = ParseDict(client_application_message, envelope_pb2.ClientApplicationMessage())
        msg.clientSubscriptionMessage.clientSubscribeRequest.genericMessage.message = message
        msg.clientSubscriptionMessage.clientSubscribeRequest.genericMessage.namespace = namespace
        return msg

    else:
        for k in jsn_request:
            client_application_message[type][k] = jsn_request[k]

        return ParseDict(client_application_message, envelope_pb2.ClientApplicationMessage())


class WebsocketContext(AbstractWebsocketContext):

    def __init__(self, recipient_info, logger, request, is_subscription):
        self.recipient_info = recipient_info
        self.logger = logger
        self.request = request
        self.RETRY_INTERVAL_SECONDS = -1
        self.is_subscription = is_subscription
        self.protocol = None

    async def on_open(self, protocol):
        self.protocol = protocol
        await send_response(ServerResponse(self.request), self.recipient_info, protocol, self.logger)

        await asyncio.sleep(5)
        await self.protocol.close()

    async def on_pong(self, payload, protocol):
        pass

    async def on_ping(self, payload, protocol):
        pass

    async def on_close(self, wasClean, code, reason, protocol):
        pass


class ClientMessageHandler(AbstractMessageHandler):

    def __init__(self, encryption_context, server, logger, request, responses, websocket_ctx, is_subscription):
        self.encryption_context = encryption_context
        self.server = server
        self.logger = logger
        self.request = request
        self.responses = responses
        self.websocket_ctx = websocket_ctx
        self.is_subscription = is_subscription

    async def handle_application_message(self, msg, sender, rid):
        server_app_msg = envelope_pb2.ServerApplicationMessage()
        server_app_msg.ParseFromString(msg)
        self.responses.append(server_app_msg)

        if not self.is_subscription:
            await self.websocket_ctx.protocol.close()

    async def handle_cloudgateway_message(self, msg):
        pass

    async def fetch_device_info(self, device_id):
        return self.server


def run_wss_test(request_jsn, credentials_bundle, client_encryption_ctx, server_info, request_id,
                 type=constants.CLIENT_SINGLE_REQUEST):

    is_subscription = False if type == constants.CLIENT_SUBSCRIBE_REQUEST else True
    request = build_request(request_jsn, credentials_bundle.session_token, request_id, type=type)
    responses = []
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    websocket_context = WebsocketContext(server_info,
                                         LOGGER,
                                         request.SerializeToString(), is_subscription)
    client_message_handler = ClientMessageHandler(client_encryption_ctx, server_info, LOGGER, request, responses,
                                                  websocket_context, is_subscription)
    client_ws = CloudGatewayWsClient(client_encryption_ctx,
                                     client_message_handler,
                                     logger=LOGGER,
                                     websocket_context=websocket_context)

    client_ws.connect()

    return responses



