"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Utilities for creating Splunk facing REST endpoints that use Twisted APIs and asynchronous code. Usage is similar to
base_endpoint.BaseRestHandler but instead of get, post, put, and delete, subclasses should override async_get,
async_post, async_put, and async_delete respectively.

Users of base_endpoint.BaseRestHandler should use async_base_endpoint.call(...) if migrating to
async_base_endpoint.AsyncBaseRestHandler is too much of an inconvenience but there is still a use case for getting a
result from asynchronous code.

Example usage:

class MyRestHandler(async_base_endpoint.AsyncBaseRestHandler):

    @defer.inlineCallbacks
    def async_get(self, request):
        some_async_result = yield some_async_method()
        defer.returnValue({
            'payload': some_async_result,
            'status': 200
        })

** NOTE **
Do not pass a deferred to defer.returnValue. This is not supported by Twisted, but more annoyingly, will cause an
infinite loop that will prevent your request from succeeding AND prevent you from manually stopping Splunk with the
splunk stop command line command. You will have to manually kill the process with something like:

    lsof -i tcp:8089
    kill -9 <process IDs from the previous command>
"""
import sys

from splunk.clilib.bundle_paths import make_splunkhome_path
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from spacebridgeapp import logging
from spacebridgeapp.rest import base_endpoint
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.util import constants
from splunk import rest
from splunk.persistconn import application
import asyncio
import spacebridgeapp.util.constants


LOGGER = logging.setup_logging(constants.SPACEBRIDGE_APP_NAME + '.log', 'async_base_rest_handler')


def call(async_func, *args, **kwargs):
    """Executes an awaitable synchronously."""
    return asyncio.run(async_func(*args, **kwargs))


class AsyncBaseRestHandler(base_endpoint.BaseRestHandler, application.PersistentServerConnectionApplication):
    """Base class for REST handlers that would like to use Twisted APIs to handle requests."""

    def __init__(self, command_line, command_arg, async_client_factory=None):
        # command_line and command_arg are passed in (but for some reason unused??) by the Splunk REST framework.
        # Accepting them at this level saves us from making all subclasses accept them.
        super(AsyncBaseRestHandler, self).__init__()
        self.async_client_factory = async_client_factory or AsyncClientFactory(rest.makeSplunkdUri())

    @staticmethod
    def render(status_code, response):
        return {
            constants.STATUS: status_code,
            constants.PAYLOAD: response
        }

    def handle_request(self, request):
        method = request['method']
        if method == 'GET':
            return call(self.get, request)
        elif method == 'POST':
            return call(self.post, request)
        elif method == 'PUT':
            return call(self.put, request)
        elif method == 'DELETE':
            return call(self.delete, request)
        return base_endpoint.unsupported_method_response(method)

    async def get(self, request):
        return base_endpoint.unsupported_method_response('GET')

    async def post(self, request):
        return base_endpoint.unsupported_method_response('POST')

    async def put(self, request):
        return base_endpoint.unsupported_method_response('PUT')

    async def delete(self, request):
        return base_endpoint.unsupported_method_response('DELETE')

    async def handleStream(self, handle, in_string):
        # This isn't used by the Splunk REST framework yet but IDEs will generally complain if it isn't implemented by
        # subclasses of PersistentServerConnectionApplication.
        pass
