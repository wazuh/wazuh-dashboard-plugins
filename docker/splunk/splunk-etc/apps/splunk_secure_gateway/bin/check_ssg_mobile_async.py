#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
# Splunk specific dependencies
import sys

from splunk.clilib.bundle_paths import make_splunkhome_path
from spacebridgeapp.util import py23

import asyncio
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.rest.clients.async_client import AsyncClient
from splunklib.searchcommands import dispatch, GeneratingCommand, Configuration, Option, validators


class EchoState(object):
    def __init__(self):
        self.ok = False
        self.message = ''


@Configuration(type='reporting')
class SecureGatewayAsyncCheck(GeneratingCommand):
    """
    This command checks spacebridge reachability by using twisted to make an http call to the health check endpoint.
    Any http return other than 200 is considered a failure.  By default it will inherit Splunk's proxy settings and use
    them.  In the command you can disable the proxy by passing useProxy=False.
    """
    useProxy = Option(require=False, validate=validators.Boolean(), default=True)

    def __init__(self):
        super(SecureGatewayAsyncCheck, self).__init__()
        self.echo_state = EchoState()

    async def run(self):
        proxy = config.get_https_proxy_settings()
        uri = "{}/health_check".format(config.get_spacebridge_domain())

        if not self.useProxy:
            proxy = None
        proxy_url = 'http://{}:{}'.format(proxy["host"], proxy["port"]) if proxy else None
        client = AsyncClient(AioHttpClient(proxy=proxy_url))

        try:
            result = await client.async_get_request(uri, None)
            if result.code == 200:
                self.echo_state.ok = True
            else:
                self.echo_state.message = 'Got http {}'.format(result.code)
        except Exception as e:
            self.echo_state.message = str(e)

        return {'https_async': self.echo_state.ok, 'message': self.echo_state.message}

    def generate(self):
        loop = asyncio.new_event_loop()
        r = loop.run_until_complete(self.run())
        loop.close()

        yield  r

    ''' HELPERS '''


dispatch(SecureGatewayAsyncCheck, sys.argv, sys.stdin, sys.stdout, __name__)
