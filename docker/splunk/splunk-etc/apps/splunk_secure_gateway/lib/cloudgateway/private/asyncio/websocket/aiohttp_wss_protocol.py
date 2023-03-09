"""
Aiohttp based websocket implementation
"""
import aiohttp
import asyncio
import logging
import ssl

from aiohttp import ClientSession, WSMsgType
from dataclasses import dataclass
from cloudgateway.private.asyncio.websocket.aio_message_handler import AioMessageHandler
from cloudgateway.private.asyncio.websocket.aio_parent_process_monitor import AioParentProcessMonitor
from cloudgateway.private.util import time_utils
from typing import List


@dataclass(frozen=True)
class WebsocketSessionCloser:
    session: aiohttp.ClientSession
    ws: aiohttp.ClientWebSocketResponse
    tasks: List[asyncio.Task]

    async def close(self):
        await self.ws.close()
        await asyncio.gather(*self.tasks)
        await self.session.close()


class AiohttpWssProtocol(object):
    """ Defines protocol for talking to Spacebridge using asyncio"""

    PING_FREQUENCY_SECONDS = 60
    SPACEBRIDGE_RECONNECT_THRESHOLD_SECONDS = 60
    LOOP_POLL_FREQUENCY = 1

    def __init__(self,
                 ws_url: str,
                 headers: dict,
                 proxy: str,
                 message_handler: AioMessageHandler,
                 logger: logging.Logger,
                 encryption_ctx,
                 websocket_ctx,
                 parent_process_monitor: AioParentProcessMonitor):
        self.ws_url = ws_url
        self.headers = headers
        self.proxy = proxy
        self.message_handler = message_handler
        self.logger = logger
        self.encryption_ctx = encryption_ctx
        self.websocket_ctx = websocket_ctx
        self.parent_process_monitor = parent_process_monitor
        self.last_spacebridge_ping = time_utils.get_current_timestamp()

    async def connect(self, ssl):
        """ Initiates websocket connection"""
        self.logger.info("Initiating websocket connection, ws_url=%s, proxy=%s", self.ws_url, self.proxy)
        async with ClientSession() as session:
            async with session.ws_connect(self.ws_url,
                                          headers=self.headers,
                                          proxy=self.proxy,
                                          ssl_context=ssl,
                                          autoping=False) as ws:
                self.logger.info("WebSocket connection open. self=%s, current_time=%d",
                                 id(self),
                                 self.last_spacebridge_ping)

                websocket_tasks = self._start_ws_tasks(ws)
                await asyncio.gather(*websocket_tasks)

            self.logger.info("Exiting websocket session is_ws_closed=%s", ws.closed)

    async def connect_nowait(self, ssl_context: ssl.SSLContext = None) -> WebsocketSessionCloser:
        session = ClientSession()
        ws = await session.ws_connect(self.ws_url,
                                      headers=self.headers,
                                      proxy=self.proxy,
                                      ssl=ssl_context,
                                      autoping=False)
        tasks = self._start_ws_tasks(ws)
        return WebsocketSessionCloser(session, ws, tasks)

    def _start_ws_tasks(self, ws: aiohttp.ClientWebSocketResponse) -> List[asyncio.Task]:
        ws.encryption_context = self.encryption_ctx

        if self.websocket_ctx:
            asyncio.create_task(self.websocket_ctx.on_open(ws))

        keep_alive_task = asyncio.create_task(self.keep_alive_ping(ws, self.PING_FREQUENCY_SECONDS))
        incoming_messages_task = asyncio.create_task(self.dispatch_messages(ws))
        check_pings_task = asyncio.create_task(self.check_spacebridge_pings(ws))
        websocket_tasks = [keep_alive_task, incoming_messages_task, check_pings_task]

        if self.parent_process_monitor:
            parent_process_monitor_task = asyncio.create_task(
                self.parent_process_monitor.async_monitor(self.logger,
                                                          websocket_ctx=self.websocket_ctx,
                                                          protocol=ws)
            )
            websocket_tasks.append(parent_process_monitor_task)

        return websocket_tasks

    async def keep_alive_ping(self, ws: aiohttp.ClientWebSocketResponse, frequency: int):
        """ Sends ping messages to spacebridge """
        time_lapsed_seconds = frequency
        while not ws.closed:
            if time_lapsed_seconds >= frequency:
                self.logger.info("Total number of running_tasks={}".format(len(asyncio.tasks.all_tasks())))
                await ws.ping()
                self.logger.info(
                    "Sent ping to Spacebridge. Last Spacebridge ping was at={}".format(self.last_spacebridge_ping))
                time_lapsed_seconds = 0

            await asyncio.sleep(self.LOOP_POLL_FREQUENCY)
            time_lapsed_seconds += self.LOOP_POLL_FREQUENCY

        self.logger.info("Terminating keep_alive_task")

    async def check_spacebridge_pings(self, ws: aiohttp.ClientWebSocketResponse):
        """ Check when was the last time a ping was received. If it exceeds the threshold, close the connection"""
        time_lapsed_seconds = self.SPACEBRIDGE_RECONNECT_THRESHOLD_SECONDS
        while not ws.closed:
            if time_lapsed_seconds >= self.SPACEBRIDGE_RECONNECT_THRESHOLD_SECONDS:
                current_time = time_utils.get_current_timestamp()
                seconds_since_ping = current_time - self.last_spacebridge_ping
                self.logger.info("Time since last spacebridge ping current_time=%d, last_spacebridge_ping=%d, "
                                 "seconds_since_ping=%d seconds, self=%s", current_time, self.last_spacebridge_ping,
                                 seconds_since_ping, id(self))

                if seconds_since_ping > self.SPACEBRIDGE_RECONNECT_THRESHOLD_SECONDS:
                    self.logger.info("Seconds since last ping exceeded threshold. Attempting to disconnect and "
                                     "reconnect with spacebridge")

                    await ws.close()
                time_lapsed_seconds = 0

            await asyncio.sleep(self.LOOP_POLL_FREQUENCY)
            time_lapsed_seconds += self.LOOP_POLL_FREQUENCY

        self.logger.info("Terminating check_spacebridge_pings_task")

    async def dispatch_messages(self, ws: aiohttp.ClientWebSocketResponse):
        """ Routes websocket messages to corresponding handler for msg type  """
        while not ws.closed:
            msg = await ws.receive()
            try:
                if msg.type == aiohttp.WSMsgType.PING:
                    # Spin up a new task to handle since we don't want to block on completion before receiving another
                    # message
                    asyncio.create_task(self.onPing(ws, msg.data))

                elif msg.type == aiohttp.WSMsgType.PONG:
                    # Spin up a new task to handle since we don't want to block on completion before receiving another
                    # message
                    asyncio.create_task(self.onPong(ws, msg.data))

                elif msg.type == WSMsgType.BINARY:
                    # Spin up a new task to handle since we don't want to block on completion before receiving another
                    # message
                    asyncio.create_task(self.message_handler.on_message(msg.data, ws))

                elif msg.type == WSMsgType.CLOSE:
                    self.logger.info("Received close from spacebridge")
                    await ws.close()

                elif msg.type == WSMsgType.CLOSED:
                    self.logger.info("Received closed from spacebridge")
                    break

                elif msg.type == WSMsgType.CLOSING:
                    self.logger.info("Received closing from spacebridge")

                elif msg.type == WSMsgType.ERROR:
                    self.logger.error("Received error from spacebridge=%s", msg.data)

                else:
                    self.logger.error("Received msg of unknown type=%s", msg.type)

            except Exception as e:
                self.logger.exception("Exception processing incoming message=%s", e)

        self.logger.info("Websocket connection was closed")

    async def onPing(self, ws: aiohttp.ClientWebSocketResponse, payload: bytes):
        """
        When receiving ping message from spacebridge
        """
        self.last_spacebridge_ping = time_utils.get_current_timestamp()
        self.logger.info("Received Ping from Spacebridge self=%s, time=%d", id(self), self.last_spacebridge_ping)
        await ws.pong()
        self.logger.info("Sent Pong")

        if self.websocket_ctx:
            try:
                await self.websocket_ctx.on_ping(payload, ws)
            except Exception as e:
                self.logger.exception("Exception on websocket_ctx on_ping")

    async def onPong(self, ws: aiohttp.ClientWebSocketResponse, payload: bytes):
        """ When receiving pong message from spacebridge
        """

        self.logger.info("Received Pong, self={}".format(id(self)))
        if self.websocket_ctx:
            try:
                await self.websocket_ctx.on_pong(payload, ws)
            except Exception as e:
                self.logger.exception("Exception on websocket_ctx on_pong")
