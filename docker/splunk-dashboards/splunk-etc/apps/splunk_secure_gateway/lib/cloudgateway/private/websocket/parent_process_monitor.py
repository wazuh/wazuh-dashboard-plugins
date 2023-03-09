"""
(C) 2019 Splunk Inc. All rights reserved.
"""

import sys
import os
import platform
from cloudgateway.private.util.constants import WS_NO_RETRY

if sys.version_info >= (3,0):
    import asyncio


class ParentProcessMonitor(object):
    """
    Class which polls whether the parent process is still running and if parent is not running, stops the
    twisted reactor loop which will kill the python process.
    """
    MAC = 'Darwin'
    LINUX = 'Linux'
    WINDOWS = 'Windows'
    MONITOR_FREQENCY_SECONDS = 60

    def __init__(self):
        """
        Set the system os, pid of the parent
        """
        self.system_os = platform.system()

        if self.system_os == self.WINDOWS:
            self.parent_pid = None
        else:
            self.parent_pid = os.getppid()

    def monitor(self, logger, reactor=None, websocket_ctx=None, protocol=None):
        """
        Function which checks whether parent pid is still running and if it is not, then terminates the twisted loop.
        Note, only works for non-windows os. For windows, the function just dies because os.getpid doesn't work on
        windows.
        :param logger: instance of logger class to use for logging
        :param reactor: twisted reactor instance
        :return: None
        """


        logger.debug("Running monitor")
        if self.parent_pid:
            logger.debug("Checking if parent is running")
            is_parent_running = self.is_process_running(self.parent_pid)
            logger.debug("is parent running=%s" % str(is_parent_running))

            if not is_parent_running:
                logger.info("parent_pid=%s is not running. Stopping websocket" % self.parent_pid)

                if sys.version_info < (3,0):
                    reactor.stop()
                else:
                    # Websocket graceful shutdown
                    if websocket_ctx and protocol:
                        websocket_ctx.RETRY_INTERVAL_SECONDS = WS_NO_RETRY
                        protocol.sendClose()
                        return
                    # Other use cases e.g. subscriptions
                    else:
                        loop = asyncio.get_event_loop()
                        loop.stop()

                        return

            logger.debug("parent_pid=%s is still running. checking again in %d" % (self.parent_pid,
                                                                                      self.MONITOR_FREQENCY_SECONDS))
            if sys.version_info < (3,0):
                reactor.callLater(self.MONITOR_FREQENCY_SECONDS, self.monitor, logger, reactor)
            else:
                loop = asyncio.get_event_loop()
                loop.call_later(self.MONITOR_FREQENCY_SECONDS, self.monitor, logger, None, websocket_ctx, protocol)
        else:
            logger.debug("System OS is windows. Parent process monitor is not running. ")

    @staticmethod
    def is_process_running(process_id):
        """
        Check whether a process with a particular pid is running
        """
        try:
            os.kill(process_id, 0)
            return True
        except OSError:
            return False

