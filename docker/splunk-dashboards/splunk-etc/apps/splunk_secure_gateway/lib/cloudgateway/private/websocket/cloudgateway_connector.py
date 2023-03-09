import sys

if sys.version_info < (3, 0):
    from OpenSSL import SSL
    from twisted.internet import ssl
    from twisted.internet.ssl import PrivateCertificate
    from autobahn.twisted.websocket import connectWS
    from twisted.internet import reactor
    from cloudgateway.private.twisted.websocket import cloudgateway_client_protocol
    from cloudgateway.private.twisted.auth_header import SplunkAuthHeader
    from cloudgateway.private.twisted.websocket.cloudgateway_message_handler import CloudgatewayMessageHandler
else:
    from cloudgateway.key_bundle import asyncio_ssl_context
    import asyncio
    from cloudgateway.private.util.splunk_auth_header import SplunkAuthHeader
    from cloudgateway.private.asyncio.websocket.aio_message_handler import AioMessageHandler
    from cloudgateway.private.asyncio.websocket.cloudgateway_init import send_public_key_to_spacebridge
    from cloudgateway.private.asyncio.websocket.aiohttp_wss_protocol import AiohttpWssProtocol
    from cloudgateway.private.asyncio.clients.async_spacebridge_client import AsyncSpacebridgeClient
    import types

from cloudgateway.private.registration.util import sb_auth_header
from cloudgateway.private.util.constants import (
    HEADER_AUTHORIZATION,
    HEADER_SHARD_ID,
    HEADER_SPACEBRIDGE_APP_ID,
    HEADER_SPACEBRIDGE_TENANT_ID,
    HEADER_SPACEBRIDGE_USER_AGENT,
    THREADED_MODE
)
from threading import Thread


def _run_asyncio_loop(aiohttp_wss_protocol, logger, key_bundle, retry_interval):
    try:
        with asyncio_ssl_context(key_bundle) as ctx:
            asyncio.run(aiohttp_wss_protocol.connect(ctx))

    except Exception as e:
        logger.exception("Could not establish connection with error=%s, retrying in %d seconds...", e, retry_interval)


class CloudgatewayConnector(object):
    """
    Abstract class used to initiate a connection to cloudgateway via websocket. This is abstract because there are
    different methods by which we may want to connect to Cloudgateway.
    """

    DEFAULT_RETRY_INTERVAL_SECONDS = 2

    def __init__(self,
                 message_handler,
                 encryption_context,
                 system_session_key,
                 parent_process_monitor,
                 cluster_monitor,
                 logger,
                 config,
                 max_reconnect_delay=60,
                 mode=THREADED_MODE,
                 shard_id=None,
                 websocket_context=None,
                 key_bundle=None,
                 device_info=None):
        """
        Args:
            message_handler: IMessageHandler interface for delegating messages
            encryption_context: EncryptionContext object
            system_session_key: SplunkAuthHeader
            parent_process_monitor: ParentProcessMonitor
            logger: Logger object for logging purposes
            max_reconnect_delay: optional parameter to specify how long to wait before attempting to reconnect
            device_info: optional parameter to track websocket device information
        """
        self.message_handler = message_handler
        self.encryption_context = encryption_context
        self.system_session_key = system_session_key
        self.parent_process_monitor = parent_process_monitor
        self.cluster_monitor = cluster_monitor
        self.logger = logger
        self.max_reconnect_delay = max_reconnect_delay
        self.mode = mode
        self.config = config
        self.shard_id = shard_id
        self.websocket_context = websocket_context
        self.key_bundle = key_bundle
        self.device_info = device_info
        self.factory = self.build_client_factory()

        if parent_process_monitor:
            self.logger.info("parent pid %s", parent_process_monitor.parent_pid)

    def build_client_factory(self):
        """
        Setup a cloudgatewayclientfactory object before a connection is established to Cloudgateway. Configures
        things like the uri to connect on, auth headers, websocket protocol options, observability headers, etc.

        Returns: CloudgatewayClientFactory object

        """

        headers = {HEADER_AUTHORIZATION: sb_auth_header(self.encryption_context)}

        if self.shard_id:
            headers[HEADER_SHARD_ID] = self.shard_id
            self.logger.info("Using shard_id={}".format(self.shard_id))

        ws_url = "wss://{0}/deployment".format(self.config.get_spacebridge_server())
        proxy, auth = self.config.get_ws_https_proxy_settings()

        if auth:
            headers['Proxy-Authorization'] = 'Basic ' + auth

        if self.device_info:
            if self.device_info.app_id:
                headers[HEADER_SPACEBRIDGE_APP_ID] = self.device_info.app_id

            if self.device_info.tenant_id:
                headers[HEADER_SPACEBRIDGE_TENANT_ID] = self.device_info.tenant_id

            if self.device_info.user_agent:
                headers[HEADER_SPACEBRIDGE_USER_AGENT] = self.device_info.user_agent

        if sys.version_info < (3, 0):
            factory = cloudgateway_client_protocol.CloudgatewayClientFactory(ws_url, headers=headers, proxy=proxy)
            factory.configure(cloudgateway_client_protocol.SpacebridgeWebsocketProtocol, self.max_reconnect_delay)
            factory.setProtocolOptions(autoFragmentSize=65536)
            factory.protocol.encryption_context = self.encryption_context
            factory.protocol.system_auth_header = SplunkAuthHeader(self.system_session_key)
            factory.protocol.parent_process_monitor = self.parent_process_monitor
            factory.protocol.logger = self.logger
            factory.protocol.mode = self.mode
            factory.protocol.cluster_monitor = self.cluster_monitor
            factory.protocol.websocket_context = self.websocket_context
        else:
            factory = types.SimpleNamespace()
            factory.proxy = proxy
            factory.auth = auth
            factory.ws_url = ws_url
            factory.headers = headers

        return factory

    def connect(self, threadpool_size=None):
        """
        Initiate a websocket connection to cloudgateway and kicks off an event loop to handle inbound messages.

        The event loop used to handle traffic differs based on Python version:
            Python 2 --> Twisted
            Python 3 --> Asyncio
        """
        if sys.version_info < (3, 0):
            if threadpool_size and self.mode == THREADED_MODE:
                reactor.suggestThreadPoolSize(threadpool_size)
            async_message_handler = CloudgatewayMessageHandler(self.message_handler,
                                                               self.encryption_context,
                                                               self.logger)

            self.factory.protocol.message_handler = async_message_handler

            ssl_context = ssl.optionsForClientTLS(u"{}".format(self.config.get_spacebridge_server()))

            connectWS(self.factory, contextFactory=ssl_context)

            if self.mode == THREADED_MODE:
                Thread(target=reactor.run, args=(False,)).start()
            else:
                reactor.run()
        else:
            send_public_key_to_spacebridge(self.config, self.encryption_context, self.logger, self.key_bundle)
            while True:
                # Dynamically check context for retry interval
                if self.websocket_context:
                    retry_interval = self.websocket_context.RETRY_INTERVAL_SECONDS
                else:
                    retry_interval = self.DEFAULT_RETRY_INTERVAL_SECONDS

                aiohttp_wss_protocol = self._create_asyncio_protocol()
                _run_asyncio_loop(aiohttp_wss_protocol, self.logger, self.key_bundle, retry_interval)

                if retry_interval > 0:
                    asyncio.run(asyncio.sleep(retry_interval))
                else:
                    return

    def connect_nowait(self, ssl_context):
        """
        Establishes a connection to spacebridge and configures listeners for handling inbound messages.

        Callers should call "close" on the object the returned awaitable resolves to.

        This is only supported in Python 3.

        NOTE: Unlike the blocking "connect" above, this does not send this client's public keys to spacebridge. Make
        sure to send keys during registration, before calling this method.
        """
        if sys.version_info < (3, 0):
            raise RuntimeError('"connect_nowait" is not supported on python 2')
        # TODO: It probably makes sense to offer retrying for this.
        protocol = self._create_asyncio_protocol()
        return protocol.connect_nowait(ssl_context=ssl_context)

    def _create_asyncio_protocol(self):
        async_spacebridge_client = AsyncSpacebridgeClient(config=self.config, key_bundle=self.key_bundle)
        async_message_handler = AioMessageHandler(message_handler=self.message_handler,
                                                  encryption_context=self.encryption_context,
                                                  async_spacebridge_client=async_spacebridge_client,
                                                  logger=self.logger)
        proxy = f'http://{self.factory.proxy["host"]}:{self.factory.proxy["port"]}' if self.factory.proxy else None
        return AiohttpWssProtocol(ws_url=self.factory.ws_url,
                                  headers=self.factory.headers,
                                  proxy=proxy,
                                  message_handler=async_message_handler,
                                  logger=self.logger,
                                  encryption_ctx=self.encryption_context,
                                  websocket_ctx=self.websocket_context,
                                  parent_process_monitor=self.parent_process_monitor)
