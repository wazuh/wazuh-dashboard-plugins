"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module providing client for making non-ssl asynchronous requests
"""
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient
from spacebridgeapp.rest.clients.async_client import AsyncClient


class AsyncNonSslClient(AsyncClient):
    """
        Client for handling asynchronous requests to KV Store
        """

    def __init__(self):
        super(AsyncNonSslClient, self).__init__(client=AioHttpClient(verify_ssl=False))
