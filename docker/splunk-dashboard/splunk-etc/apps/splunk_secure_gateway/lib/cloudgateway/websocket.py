"""
(C) 2019 Splunk Inc. All rights reserved.
"""
import sys
import os
import uuid
from abc import ABCMeta, abstractmethod

import cloudgateway.private.util.sdk_mode

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib'))

import base64
import requests
from cloudgateway.private.websocket.cloudgateway_connector import CloudgatewayConnector
from cloudgateway.private.encryption.encryption_handler import decrypt_session_token
from cloudgateway.private.messages.send import build_encrypted_payload
from cloudgateway.private.util.splunk_auth_header import SplunkAuthHeader
from cloudgateway.private.util.logger import DummyLogger
from cloudgateway.private.util import constants
from cloudgateway.private.registration.util import sb_message_endpoint, sb_auth_header, requests_ssl_context
from cloudgateway.private.util.config import SplunkConfig
from cloudgateway.private.websocket.parent_process_monitor import ParentProcessMonitor
from spacebridge_protocol import http_pb2
from enum import Enum

if sys.version_info >= (3,0):
    from cloudgateway.private.asyncio.websocket.aio_parent_process_monitor import AioParentProcessMonitor


try:
    # conditional import which will only work if using splunk's python
    if sys.version_info < (3,0):
        from cloudgateway.splunk.twisted.cluster.cluster_monitor import ClusterMonitor
    else:
        from cloudgateway.splunk.asyncio.cluster.cluster_monitor import ClusterMonitor
except:
    pass


class WebsocketMode(Enum):
    """
    Enum for supported modes of initiating websocket connection. Async means the websocket is run via a single threaded
    event loop and callbacks are expected to be non-blocking and return deferred objects. In threaded mode, callbacks
    can be blocking and each message received will be delegated to a thread from a pool.
    """
    ASYNC = 0
    THREADED = 1


class ServerResponse(object):
    """
    Class to encapsulate response message to be sent back to either the client or Cloudgateway
    """

    @staticmethod
    def create_rid():
        """
        Helper method to generate a unique guid
        :return:
        """
        return str(uuid.uuid4())

    def __init__(self, payload, request_id=None):
        self.payload = payload
        if request_id:
            self.request_id = request_id
        else:
            self.request_id = ServerResponse.create_rid()

    def __repr__(self):
        return str(
            {
                'payload': self.payload,
                'request_id': self.request_id
            }
        )


class CloudGatewayWsClient(object):
    def __init__(self, encryption_context, message_handler, logger=None, mode=WebsocketMode.THREADED,
                 config=SplunkConfig(), shard_id=None, websocket_context=None, key_bundle=None, device_info=None):
        """

        Args:
            encryption_context: [EncryptionContext] Can be a regular EncryptionContext or a subclass such
            as SplunkEncryptionContext depending on whether you want to run in standalone mode or not.
            handler can call Splunk APIs if needed
            message_handler: [AbstractMessageHandler] interface specifying how to handle messages from Cloudgateway
            logger: Optional logger parameter for logging purposes
            mode: [WebsocketMode] Enum specifying either threaded mode or async mode. Defaults to Threaded mode
            config: Optional [CloudgatewaySdkConfig] configuration class
            device_info: Optional [DeviceInfo] information for device observability
        """
        self.encryption_context = encryption_context
        self.logger = logger or DummyLogger()
        self.logger.info(encryption_context)
        self.message_handler = message_handler
        self.mode = mode
        self.config = config
        self.shard_id = shard_id
        self.key_bundle = key_bundle
        self.device_info = device_info
        if self.mode == WebsocketMode.THREADED:
            websocket_mode = constants.THREADED_MODE

        elif self.mode == WebsocketMode.ASYNC:
            websocket_mode = constants.ASYNC_MODE
        else:
            raise ValueError("Unsupported websocket mode")

        if self.encryption_context.mode == cloudgateway.private.util.sdk_mode.SdkMode.SPLUNK:
            session_key = self.encryption_context.session_key
            if sys.version_info < (3,0):
                parent_process_monitor = ParentProcessMonitor()
            else:
                parent_process_monitor = AioParentProcessMonitor()

            cluster_monitor = None
            if self.shard_id is None:
                cluster_monitor = ClusterMonitor(self.logger)
        else:
            session_key = ""
            # parent_process_monitor = ParentProcessMonitor() # For testing only, remove
            parent_process_monitor = None
            cluster_monitor = None

        self.connector = CloudgatewayConnector(self.message_handler,
                                               self.encryption_context,
                                               session_key,
                                               parent_process_monitor,
                                               cluster_monitor,
                                               self.logger,
                                               self.config,
                                               mode=websocket_mode,
                                               shard_id=self.shard_id,
                                               websocket_context=websocket_context,
                                               key_bundle=self.key_bundle,
                                               device_info=device_info
                                               )

    def connect(self, threadpool_size=None):
        """
        Initiate websocket connection to cloudgateway

        Args:
            threadpool_size: [Integer] Size of threadpool to use. Only applies in Threaded Mode.

        Returns: None
        """

        self.connector.connect(threadpool_size)

    def send(self, device_id, payload, request_id=None):
        """Send a message to a particular device using Cloud Gateway
        Args:
            device_id ([binary]): id of the device to send the message to
            payload ([string]): Message to be sent. Can be any format you want (json, serialized proto, etc.)
            request_id (str, optional): [description]. Defaults to "123".

        Returns:
            [requests.response]: response returned by requests object
        """
        if not request_id:
            request_id = ServerResponse.create_rid()

        send_message_request = http_pb2.SendMessageRequest()
        recipient_info = self.message_handler.fetch_device_info(device_id)

        build_encrypted_payload(recipient_info,
                                self.encryption_context,
                                payload,
                                request_id,
                                self.logger,
                                signed_envelope=send_message_request.signedEnvelope)

        # self.connector.factory.protocol.sendMessage(send_message_request.SerializeToString())


        spacebridge_header = {'Authorization': sb_auth_header(self.encryption_context)}

        with requests_ssl_context(self.key_bundle) as cert:
            return requests.post(sb_message_endpoint(self.config),
                                 headers=spacebridge_header,
                                 data=send_message_request.SerializeToString(),
                                 cert=cert.name,
                                 proxies=self.config.get_proxies()
                                 )



class AbstractWebsocketContext(object):
    """
    Optional context class if you want finer grain control over behaviour of websocket
    """

    __metaclass__ = ABCMeta

    RETRY_INTERVAL_SECONDS = 2

    @abstractmethod
    def on_open(self, protocol):
        pass

    @abstractmethod
    def on_ping(self, payload, protocol):
        pass

    @abstractmethod
    def on_pong(self, payload, protocol):
        pass

    @abstractmethod
    def on_close(self, wasClean, code, reason, protocol):
        pass


class AbstractMessageHandler(object):
    """
    Used to delegate methods necessary when a message is received from Cloudgateway.
    """
    __metaclass__ = ABCMeta

    def __init__(self, encryption_context):
        """
        If you override the constructor, make sure to call this constructor, the session key is necessary to construct
        the encryption context necessary for encrypting and decrypting messages
        Args:
            encryption_context: [EncryptionContext] object which is necessary for message handler to decrypt incoming
                messages
        """
        self.system_auth_header = ""
        self.encryption_context = encryption_context

        if hasattr(encryption_context, 'session_key'):
            self.system_auth_header = SplunkAuthHeader(encryption_context.session_key)

    @abstractmethod
    def handle_application_message(self, msg, sender, request_id):
        """

        Args:
            msg: message payload sent by a client device
            sender: byte array of device sending message
            request_id: string representing unique identifier of message sent by the sender

        Returns: ServerResponse or List[ServerResponse] which represent payloads to be sent back to the client device.

        """
        raise NotImplementedError

    @abstractmethod
    def handle_cloudgateway_message(self, msg):
        """

        Args:
            msg: message payload strinng sent by cloud gatewayy

        Returns: ServerResponse or List[ServerResponse]

        """
        raise NotImplementedError

    @abstractmethod
    def fetch_device_info(self, device_id):
        """
        Given device id, fetch DeviceInfo object associated to that device

        Args:
            device_id: byte array representing device id

        Returns: DeviceInfo object

        """
        raise NotImplementedError

    def decrypt_session_token(self, encrypted_session_token):
        """

        Args:
            encrypted_session_token: An encrypted session token string

        Returns: Decrypted session tokenn string

        """
        public_key = self.encryption_context.encrypt_public_key()
        private_key = self.encryption_context.encrypt_private_key()
        raw_token = base64.b64decode(encrypted_session_token)
        return decrypt_session_token(self.encryption_context.sodium_client, raw_token, public_key, private_key)


