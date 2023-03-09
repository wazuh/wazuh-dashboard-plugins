import asyncio
import logging
import os
import platform
from typing import Callable, Optional


class ParentProcessMonitor:
    """ Aiohttp based Parent Process Monitor """
    MAC = 'Darwin'
    LINUX = 'Linux'
    WINDOWS = 'Windows'
    MONITOR_TEST_FREQENCY_SECONDS = 1
    MONITOR_LOG_FREQUENCY_SECONDS = 300

    log: logging.Logger
    system_os: str
    parent_pid: Optional[int]

    def __init__(self, log: logging.Logger):
        """
        Set the system os, pid of the parent
        """
        self.log = log
        self.system_os = platform.system()

        if self.system_os == self.WINDOWS:
            self.parent_pid = None
        else:
            self.parent_pid = os.getppid()

    @staticmethod
    def is_process_running(parent_id):
        # on debian, when the process gets orphaned the ppid changes to 1
        # https://unix.stackexchange.com/questions/476191/processes-ppid-changed-to-1-after-closing-parent-shell
        if parent_id != os.getppid():
            return False

        try:
            os.kill(parent_id, 0)
            return True
        except OSError:
            return False

    async def _test_parent_process(self, callback: Callable):
        time_elapsed = 0
        while asyncio.get_event_loop().is_running():
            is_parent_running = self.is_process_running(self.parent_pid)

            log_event = (time_elapsed >= self.MONITOR_LOG_FREQUENCY_SECONDS) or not is_parent_running

            if log_event:
                self.log.info("Parent process test, result=%s, ppid=%s, os=%s", is_parent_running, self.parent_pid,
                              os.getppid())
                time_elapsed = 0

            if not is_parent_running:
                callback()
                break

            await asyncio.sleep(self.MONITOR_TEST_FREQENCY_SECONDS)
            time_elapsed += self.MONITOR_TEST_FREQENCY_SECONDS
        self.log.info("Parent process monitor stopping")
        callback()

    async def start(self, callback: Callable):
        self.log.info("Running monitor")
        if self.parent_pid:
            await self._test_parent_process(callback)
        else:
            self.log.info("System OS is windows. Parent process monitor is not running. ")
