import asyncio
import aiohttp
from cloudgateway.private.websocket.parent_process_monitor import ParentProcessMonitor
from cloudgateway.private.util.constants import WS_NO_RETRY


class AioParentProcessMonitor(ParentProcessMonitor):
    """ Aiohttp based Parent Process Monitor """

    LOOP_POLL_FREQUENCY = 1

    async def async_monitor(self, logger, websocket_ctx=None, protocol=None):
        logger.debug("Running monitor")
        time_lasped_seconds = self.MONITOR_FREQENCY_SECONDS
        if self.parent_pid:
            while not protocol.closed:
                if time_lasped_seconds >= self.MONITOR_FREQENCY_SECONDS:
                    logger.debug("Checking if parent is running")
                    is_parent_running = self.is_process_running(self.parent_pid)
                    logger.debug("is parent running=%s" % str(is_parent_running))

                    if not is_parent_running:
                        logger.info("parent_pid=%s is not running. Stopping websocket" % self.parent_pid)

                        # Websocket graceful shutdown
                        if websocket_ctx and protocol:
                            websocket_ctx.RETRY_INTERVAL_SECONDS = WS_NO_RETRY
                            await protocol.close()
                            return
                        # Other use cases e.g. subscriptions
                        else:
                            loop = asyncio.get_event_loop()
                            loop.stop()
                            return

                    logger.debug("parent_pid=%s is still running. checking again in %d" % (self.parent_pid,
                                                                                           self.MONITOR_FREQENCY_SECONDS))
                    time_lasped_seconds = 0
                await asyncio.sleep(self.LOOP_POLL_FREQUENCY)
                time_lasped_seconds += self.LOOP_POLL_FREQUENCY
        else:
            logger.debug("System OS is windows. Parent process monitor is not running. ")
