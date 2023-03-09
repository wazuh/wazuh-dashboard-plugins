# pylint: disable=missing-function-docstring,missing-class-docstring
from __future__ import absolute_import
from typing import Optional
import threading
from rapid_diag.collector.tool_manager import ToolAvailabilityManager
from rapid_diag.collector.threadpool import ThreadPool
from rapid_diag.process_abstraction import ProcessLister


class SessionGlobals:
    __lock = threading.Lock()
    __tam : Optional[ToolAvailabilityManager] = None
    __pool : Optional[ThreadPool] = None
    __pl : Optional[ProcessLister] = None

    @staticmethod
    def reset() -> None:
        with SessionGlobals.__lock:
            SessionGlobals.__tam = None
            SessionGlobals.__pool = None
            SessionGlobals.__pl = None

    @staticmethod
    def get_tool_availability_manager() -> ToolAvailabilityManager:
        with SessionGlobals.__lock:
            if SessionGlobals.__tam is None:
                SessionGlobals.__tam = ToolAvailabilityManager()
            return SessionGlobals.__tam

    @staticmethod
    def get_threadpool() -> ThreadPool:
        with SessionGlobals.__lock:
            if SessionGlobals.__pool is None:
                SessionGlobals.__pool = ThreadPool()
            return SessionGlobals.__pool

    @staticmethod
    def get_process_lister() -> ProcessLister:
        with SessionGlobals.__lock:
            if SessionGlobals.__pl is None:
                SessionGlobals.__pl = ProcessLister()
            return SessionGlobals.__pl
