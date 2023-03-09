"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Base class for AsyncClient
"""
import sys
import contextvars
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient

import time
from spacebridgeapp.util.config import secure_gateway_config
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, HEADER_AUTHORIZATION, \
    HEADER_CONTENT_TYPE, APPLICATION_JSON
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.string_utils import encode_whitespace

LOGGER = setup_logging("{}_async.log".format(SPACEBRIDGE_APP_NAME), "async_client")

# Default Base Timeout
DEFAULT_TIMEOUT = secure_gateway_config.get_async_timeout_secs()


async def _instrument(operation, method, uri):
    start_time = time.time()
    try:
        result = await operation
    finally:
        time_taken = time.time() - start_time
        LOGGER.info("%s uri=%s, time_taken=%s", method, uri, time_taken)

    return result


class AsyncClient(object):
    """
    Client for handling asynchronous requests to KV Store
    """

    def __init__(self, client=None):
        """
        Our client wraps the  asyncio aiohttp client. This is so we can provide different implementations such as providing
        a mocked implementation to make testing easier.
        :param client: instance of AioHTTPClient or mock instance
        """
        self.client = client if client else AioHttpClient()

    def async_get_request(self, uri, auth_header, params=None, headers=None, timeout=DEFAULT_TIMEOUT, verify_ssl=None):
        """
        Makes a asynchronous get request to a given uri
        :param uri: string representing uri to make request to
        :param params: Optional parameters to be append as the query string to the URL
        :param auth_header: A value to supply for the Authorization header
        :param headers: Optional request headers
        :param timeout: Optional timeout
        :return: result of get request
        """

        uri = encode_whitespace(uri)

        if not headers:
            headers = {HEADER_CONTENT_TYPE: APPLICATION_JSON}

        if auth_header is not None:
            headers[HEADER_AUTHORIZATION] = repr(auth_header)

        LOGGER.debug('GET uri=%s, params=%s' % (uri, str(params)))

        kwargs = {'uri': uri, 'headers': headers, 'params': params, 'timeout': timeout}

        if verify_ssl:
            kwargs['verify_ssl'] = verify_ssl

        return _instrument(self.client.get(**kwargs), 'GET', uri)

    def async_delete_request(self, uri, auth_header, params=None, data=None, headers=None, timeout=DEFAULT_TIMEOUT,
                             verify_ssl=None):
        """
        :param uri:
        :param params:
        :param data:
        :param headers:
        :param auth_header: A value to supply for the Authorization header
        :param timeout: Optional timeout
        :return:
        """
        if not headers:
            headers = {HEADER_CONTENT_TYPE: APPLICATION_JSON, HEADER_AUTHORIZATION: repr(auth_header)}

        # In python 3 Treq requires post data to be bytes not string so we need to explicitly encode it
        # https://github.com/twisted/treq/issues/151
        if sys.version_info >= (3,0) and isinstance(data, str):
            data = data.encode('utf-8')

        LOGGER.debug('DELETE uri=%s, params=%s' % (uri, str(params)))

        kwargs = {'uri': uri, 'headers': headers, 'params': params, 'timeout': timeout}

        if verify_ssl:
            kwargs['verify_ssl'] = verify_ssl

        if data:
            kwargs['data'] = data

        return _instrument(self.client.delete(**kwargs), 'DELETE', uri)

    def async_post_request(self, uri, auth_header, params=None, data=None, headers=None, timeout=DEFAULT_TIMEOUT,
                           verify_ssl=None):
        """
        Makes a asynchronous post request to a given uri
        :param uri: string representing uri to make request to
        :param params: Optional parameters to be append as the query string to the URL
        :param data: Request body
        :param auth_header: A value to supply for the Authorization header
        :param headers: header to send with post request.
        :param timeout: Optional timeout
        :return:
        """

        uri = encode_whitespace(uri)

        if not headers:
            headers = {HEADER_CONTENT_TYPE: APPLICATION_JSON}

        if auth_header is not None:
            headers[HEADER_AUTHORIZATION] = repr(auth_header)

        # In python 3 Treq requires post data to be bytes not string so we need to explicitly encode it
        # https://github.com/twisted/treq/issues/151
        if sys.version_info >= (3,0) and isinstance(data, str):
            data = data.encode('utf-8')

        # don't log request data as username and passwords can be leaked in plaintext MSB-846
        LOGGER.debug('POST uri=%s, params=%s', uri, params)

        kwargs = {'uri': uri, 'headers': headers, 'params': params, 'data': data, 'timeout': timeout}

        if verify_ssl:
            kwargs['verify_ssl'] = verify_ssl

        return _instrument(self.client.post(**kwargs), 'POST', uri)

