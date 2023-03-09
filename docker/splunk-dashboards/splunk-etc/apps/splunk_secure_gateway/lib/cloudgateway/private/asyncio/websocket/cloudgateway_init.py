"""
(C) 2019 Splunk Inc. All rights reserved.

Defines methods to be called on open of websocket connection in instance
of SpacebridgeWebsocketProtocol class
"""

import asyncio
import time
from http import HTTPStatus

import aiohttp
import certifi
import ssl
from functools import partial

import requests

from spacebridge_protocol import http_pb2
from cloudgateway.private.encryption.encryption_handler import sign_detached
from cloudgateway.private.registration.util import sb_auth_header, requests_ssl_context
from cloudgateway.private.util import constants


def send_public_key_to_spacebridge(config, encryption_context, logger, key_bundle=None):
    """ Send the splapp public signing key to spacebridge
        Abstraction layer for the spacebrige request. This function:
        1. Signs the splapp public signing key with the splapp private signing key
        2. Creates a proto request with the public signing key and the signature
        3. Sends the proto request to spacebridge
        :param websocket_protocol: The websocket protocol
        :param config: The configuration used to make the request
    """

    logger.debug('Starting sending splapp public key to spacebridge')
    sign_func = partial(sign_detached,
                        encryption_context.sodium_client,
                        encryption_context.sign_private_key())
    public_signing_key = encryption_context.sign_public_key()
    request_proto = http_pb2.RegisterSigningPublicKeyRequest()
    request_proto.publicKeyForSigning = public_signing_key
    request_proto.signature = sign_func(public_signing_key)
    serialized_proto = request_proto.SerializeToString()

    return send_key(serialized_proto, config, encryption_context, logger, key_bundle)


class ServerException(Exception):
    """ Custom error raised when we get a 5xx
    response code back from spacebridge
    """
    pass


def retry(fn, retries, test_ok, attempt=0, last_result=None):
    if attempt > retries:
        return last_result

    result = fn()
    if test_ok(result):
        return result

    delay = 2 ** attempt
    time.sleep(delay)
    return retry(fn, retries, test_ok, attempt+1, result)


def send_key(data, config, encryption_context, logger, key_bundle):
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
    headers = {'Authorization': encryption_context.sign_public_key(transform=encryption_context.generichash_hex),
               'Content-Type': 'application/x-protobuf'}
    uri = "{}/api/public_keys".format(config.get_spacebridge_domain())

    def send():
        return requests.post(
            uri,
            headers=headers,
            data=data,
            proxies=config.get_proxies(),
            timeout=constants.TIMEOUT_SECONDS,
            cert=cert.name
        )

    def test_ok(response):
        return response.status_code == HTTPStatus.OK

    with requests_ssl_context(key_bundle) as cert:
        response = retry(send, 3, test_ok)
        if response.status_code != HTTPStatus.OK:
            logger.warn("Failed to upload public key to spacebridge. uri=%s", uri)
            extract_error(response, logger)
        else:
            logger.debug("Uploaded public key to spacebridge. uri=%s", uri)


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
        if response.status_code == 503:
            logger.error('Spacebridge encountered an internal error={} response status code={}'
                         .format(sb_response_proto.error.message,
                                 503))

        else:
            logger.error('Spacebridge request error=%s response status code=%s',
                         sb_response_proto.error.message,
                         response.status_code)
    else:
        logger.error("Spacebridge error=%s response status code=%s", response_content, response.status_code)
