"""
(C) 2019 Splunk Inc. All rights reserved.

Defines methods to be called on open of websocket connection in instance
of SpacebridgeWebsocketProtocol class
"""

from functools import partial
from twisted.web import http
from twisted.internet import defer
from twisted.internet.error import ConnectingCancelledError
from spacebridge_protocol import http_pb2
from cloudgateway.private.encryption.encryption_handler import sign_detached
from cloudgateway.private.registration.util import sb_auth_header
from cloudgateway.private.util import constants
from cloudgateway.private.util.config import SplunkConfig
from cloudgateway.private.twisted.clients.async_client import AsyncClient

@defer.inlineCallbacks
def send_public_key_to_spacebridge(websocket_protocol, config=SplunkConfig()):
    """ Send the splapp public signing key to spacebridge
        Abstraction layer for the spacebrige request. This function:
        1. Signs the splapp public signing key with the splapp private signing key
        2. Creates a proto request with the public signing key and the signature
        3. Sends the proto request to spacebridge
        :param websocket_protocol: The websocket protocol
        :param config: The configuration used to make the request
    """

    websocket_protocol.logger.debug('Starting sending splapp public key to spacebridge')
    encryption_context = websocket_protocol.encryption_context
    sign_func = partial(sign_detached,
                        encryption_context.sodium_client,
                        encryption_context.sign_private_key()
                       )
    public_signing_key = encryption_context.sign_public_key()
    request_proto = http_pb2.RegisterSigningPublicKeyRequest()
    request_proto.publicKeyForSigning = public_signing_key
    request_proto.signature = sign_func(public_signing_key)
    serialized_proto = request_proto.SerializeToString()
    headers = {'Content-Type': 'application/x-protobuf',
               'Authorization': str(sb_auth_header(encryption_context))}
    client = AsyncClient()
    yield send_key(headers, serialized_proto, config, client, websocket_protocol)
    websocket_protocol.logger.debug('Finished send_key method. No logs after start message indicate success.')

class ServerException(Exception):
    """ Custom error raised when we get a 5xx
    response code back from spacebridge
    """
    pass

@defer.inlineCallbacks
def send_key(headers, data, config, client, websocket_protocol, retries=0):
    """
    Sends public key to spacebridge
    :param headers: The request headers
    :param data: The request data
    :param config: The configuration used to make the request
    :param client: The async request client
    :param websocket_protocol: The websocket protocol
    :param retries: Number of retries
    :return response: The response object
    """

    try:
        # in case we retry before response is defined
        response = None
        response = yield client.async_post_request(
            '{}/api/public_keys'.format(config.get_spacebridge_domain()),
            None,
            headers=headers,
            data=data,
            timeout=constants.TIMEOUT_SECONDS
        )

        if 500 <= response.code < 600:
            websocket_protocol.logger.debug('raising exception')
            raise ServerException()

        if not 200 <= response.code < 300:
            websocket_protocol.logger.error("Spacebridge error={} response status code={}"
                                            .format(response.content(),
                                                    response.code))

        defer.returnValue(response)

    except (ServerException, ConnectingCancelledError) as e:
        retry_connection(headers, data, config, client, websocket_protocol, retries, response, e)

        # on third retry, we need to return a deferred
        if retries == 3:
            defer.returnValue(response)

    except Exception as e:
        websocket_protocol.logger.exception('An error occurred contacting spacebridge')
        defer.returnValue(response)

def retry_connection(headers, data, config, client, websocket_protocol, retries, response, error):
    """
    Retries sending key to spacebridge based on number of retries

    :param headers: The request headers
    :param data: The request data
    :param config: The configuration used to make the request
    :param client: The async request client
    :param websocket_protocol: The websocket protocol
    :param retries: Number of retries
    :param response: The response object
    :param error: The error object
    """
    if retries < 3:
        wait = 2 ** retries
        retries = retries + 1
        websocket_protocol.logger.debug('connection retry#{} to send mdm public key to spacebridge'.format(retries))
        websocket_protocol.factory.reactor.callLater(wait, send_key, headers, data, config, client, websocket_protocol, retries)
    else:
        # there will be no response object so this has to go first
        if isinstance(error, ConnectingCancelledError):
            error_message = ('Did not receive a timely (within {} seconds) response from spacebridge'
                             .format(constants.TIMEOUT_SECONDS))
            websocket_protocol.logger.error(error_message)
            return

        extract_error(response, websocket_protocol.logger)

def extract_error(response, logger):
    """
    Logs error message based on response
    :param response: The response object
    :param logger: The logger instance
    """

    response_content = response.content()
    sb_response_proto = http_pb2.RegisterSigningPublicKeyResponse()
    try:
        sb_response_proto.ParseFromString(response_content)
    except:
        pass
        #don't care about parsing errors we just leave the proto blank

    if sb_response_proto.HasField('error'):
        if response.code == http.INTERNAL_SERVER_ERROR:
            logger.error('Spacebridge encountered an internal error={} response status code={}'
                         .format(sb_response_proto.error.message,
                                 http.INTERNAL_SERVER_ERROR))

        else:
            logger.error('Spacebridge request error={} response status code={}'
                         .format(sb_response_proto.error.message,
                                 response.code))

    else:
        logger.error("Spacebridge error={} response status code={}"
                     .format(response_content,
                             response.code))
