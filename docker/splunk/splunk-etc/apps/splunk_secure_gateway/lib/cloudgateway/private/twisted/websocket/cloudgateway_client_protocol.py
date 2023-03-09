"""
(C) 2019 Splunk Inc. All rights reserved.

Defines the Web socket protocol used to talk to Cloudgateway.
"""

from autobahn.twisted.websocket import WebSocketClientProtocol
from cloudgateway.private.util import time_utils
from cloudgateway.private.util import constants
from cloudgateway.private.twisted.websocket.cloudgateway_init import send_public_key_to_spacebridge
from autobahn.twisted.websocket import WebSocketClientFactory
from twisted.internet.protocol import ReconnectingClientFactory


class CloudgatewayClientFactory(WebSocketClientFactory, ReconnectingClientFactory):
    """
    Client factory implementation to handle autoreconnect on connection fail or loss
    """

    def configure(self, client_protocol,  max_reconnect_delay):
        self.protocol = client_protocol
        self.maxDelay = int(max_reconnect_delay)

    def clientConnectionFailed(self, connector, reason):
        self.retry(connector)

    def clientConnectionLost(self, connector, reason):
        self.retry(connector)


class SpacebridgeWebsocketProtocol(WebSocketClientProtocol):
    """ Defines websocket protocol for talking to Cloudgateway.
    """

    PING_FREQUENCY_SECONDS = 60
    SPACEBRIDGE_RECONNECT_THRESHOLD_SECONDS = 60

    def onConnect(self, response):
        """[summary]

        Arguments:
            response {[type]} -- [description]
        """

        self.logger.info("Connected to server. self=%s, response=%s" % (id(self), str(response)))
        if self.factory:
            self.factory.resetDelay()

    def onClose(self, wasClean, code, reason):
        self.logger.info("WebSocket connection closed: self=%s, wasClean=%s, code=%s, reason=%s"
                         % (id(self), wasClean, code, str(reason)))

        if hasattr(self, 'ping_call_id') and self.ping_call_id:
            self.ping_call_id.cancel()

        if hasattr(self, 'check_spacebridge_ping_id') and self.check_spacebridge_ping_id:
            self.check_spacebridge_ping_id.cancel()

    def onOpen(self):
        """ When connection is opened, start sending ping messages
        to Spacebridge every K seconds.
        """

        self.ping_call_id = None
        self.check_spacebridge_ping_id = None
        self.last_spacebridge_ping = time_utils.get_current_timestamp()
        self.logger.info("WebSocket connection open. self=%s, current_time=%s" % (id(self), self.last_spacebridge_ping))

        def hello():
            """ Send ping every K seconds.
            """

            try:
                self.sendPing()
                self.logger.debug("Sent Ping")
            except Exception:
                self.logger.exception("Exception sending ping to spacebridge")
            self.ping_call_id = self.factory.reactor.callLater(self.PING_FREQUENCY_SECONDS, hello)

        def check_spacebridge_pings():
            """
            Check if a ping was received from spacebridge within the last K seconds. If not, drop and reestablish
            the connection.
            """
            try:
                current_time = time_utils.get_current_timestamp()
                seconds_since_ping = current_time - self.last_spacebridge_ping

                self.logger.debug("Time since last spacebridge ping current_time=%s, last_spacebridge_ping=%s, "
                                  "seconds_since_ping=%d seconds, self=%s"
                                  % (current_time, self.last_spacebridge_ping, seconds_since_ping, id(self)))
                if seconds_since_ping > self.SPACEBRIDGE_RECONNECT_THRESHOLD_SECONDS:
                    self.logger.info("Attempting to reestablish connection with spacebridge")
                    self.transport.loseConnection()

                self.check_spacebridge_ping_id = self.factory.reactor.callLater(
                    self.SPACEBRIDGE_RECONNECT_THRESHOLD_SECONDS, check_spacebridge_pings)
            except:
                self.logger.exception("Exception checking spacebridge ping")

        # start sending messages every second ..
        hello()
        check_spacebridge_pings()
        send_public_key_to_spacebridge(self)

        if self.parent_process_monitor:
            self.parent_process_monitor.monitor(self.logger, self.factory.reactor)

        # Start Cluster Monitor
        if self.cluster_monitor is not None:
            self.cluster_monitor.monitor(self.system_auth_header, self.factory.reactor)

    def onPong(self, payload):
        """ When receiving pong message from server
        """

        self.logger.info("Received Pong")

    def onPing(self, payload):
        self.last_spacebridge_ping = time_utils.get_current_timestamp()
        self.logger.debug("Received Ping from Spacebridge self=%s, time=%s" % (id(self), self.last_spacebridge_ping))
        self.sendPong()
        self.logger.debug("Sent Pong")

    def onMessage(self, payload, is_binary):
        """ function is called when message is received over
        web socket.

        Arguments:
            payload {text or binary}
            is_binary {bool} -- indicating whether payload is binary or not
        """

        try:
            if self.mode == constants.THREADED_MODE:
                self.factory.reactor.callInThread(self.message_handler.on_message, payload, self)
            else:
                self.message_handler.on_message(payload, self)
        except Exception as e:
            self.logger.info("Exception processing message with exception={0}".format(e))
