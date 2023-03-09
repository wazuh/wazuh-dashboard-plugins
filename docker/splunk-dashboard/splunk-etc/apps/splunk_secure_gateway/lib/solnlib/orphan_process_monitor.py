#
# Copyright 2021 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""Orphan process monitor."""

import os
import threading
import time
from typing import Callable

__all__ = ["OrphanProcessChecker", "OrphanProcessMonitor"]


class OrphanProcessChecker:
    """Orphan process checker.

    Only work for Linux platform. On Windows platform, is_orphan is
    always False and there is no need to do this monitoring on Windows.
    """

    def __init__(self, callback: Callable = None):
        """Initializes OrphanProcessChecker.

        Arguments:
            callback: (optional) Callback for orphan process.
        """
        if os.name == "nt":
            self._ppid = 0
        else:
            self._ppid = os.getppid()
        self._callback = callback

    def is_orphan(self) -> bool:
        """Check process is orphan.

        For windows platform just return False.

        Returns:
            True for orphan process else False.
        """

        if os.name == "nt":
            return False
        return self._ppid != os.getppid()

    def check_orphan(self) -> bool:
        """Check if the process becomes orphan.

        If the process becomes orphan then call callback function
        to handle properly.

        Returns:
            True for orphan process else False.
        """

        res = self.is_orphan()
        if res and self._callback:
            self._callback()
        return res


class OrphanProcessMonitor:
    """Orphan process monitor.

    Check if process become orphan in background thread per interval and
    call callback if process become orphan.
    """

    def __init__(self, callback: Callable, interval: int = 1):
        """Initializes OrphanProcessMonitor.

        Arguments:
            callback: Callback for orphan process monitor.
            interval: (optional) Interval to monitor.
        """
        self._checker = OrphanProcessChecker(callback)
        self._thr = threading.Thread(target=self._do_monitor)
        self._thr.daemon = True
        self._started = False
        self._interval = interval

    def start(self):
        """Start orphan process monitor."""

        if self._started:
            return
        self._started = True

        self._thr.start()

    def stop(self):
        """Stop orphan process monitor."""

        joinable = self._started
        self._started = False
        if joinable:
            self._thr.join(timeout=1)

    def _do_monitor(self):
        while self._started:
            if self._checker.check_orphan():
                break

            for _ in range(self._interval):
                if not self._started:
                    break
                time.sleep(1)
