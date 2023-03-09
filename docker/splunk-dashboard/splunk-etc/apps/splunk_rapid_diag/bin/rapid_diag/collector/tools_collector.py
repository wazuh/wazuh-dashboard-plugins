# pylint: disable=missing-function-docstring,missing-class-docstring
from __future__ import absolute_import
import sys
import subprocess
from time import sleep
from abc import abstractmethod
from typing import List, Optional, TextIO, Any

import logger_manager as log
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.conf_util import RapidDiagConf

_LOGGER = log.setup_logging("tools_collector")

IS_LINUX = sys.platform.startswith('linux')
CREATE_NEW_PROCESS_GROUP = 0x00000200
DETACHED_PROCESS = 0x00000008


class ToolsCollector(Collector):

    def __init__(self,
                 collection_time : float = None,
                 valid_return_code : List[Optional[int]] = None) -> None:
        Collector.__init__(self)
        self.collection_time : float = collection_time if collection_time else RapidDiagConf.get_collectors_startup_timeout()
        self.valid_return_code : List[Optional[int]] = valid_return_code if valid_return_code else [0]

    @staticmethod
    @abstractmethod
    def get_tool_name() -> str:
        """
        Returns the utility name depending on the platform.
        """
        pass

    @staticmethod
    @abstractmethod
    def get_tool_command(**kwrgs: Any) -> List[str]:
        """
        Returns the utility command depending on the platform.
        """
        pass

    @staticmethod
    @abstractmethod
    def get_tool_arguments() -> set:
        """
        Returns the tool utility arguments required
        """
        pass

    @staticmethod
    @abstractmethod
    def tool_missing() -> Optional[str]:
        """
        Check the utility to run the collector is available or not.
        """
        pass

    def run(self, command : str,
            output : TextIO,
            error : TextIO,
            poll_period : float = RapidDiagConf.get_collectors_startup_poll_interval()) -> CollectorResult:

        creationflags = 0 if IS_LINUX else (DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP)
        with subprocess.Popen(command, creationflags=creationflags, stdout=output, stderr=error) as process:
            return_code = self.__wait_for_completion(process, self.collection_time, poll_period)
            _LOGGER.debug("return_code : %s", str(return_code))

            if return_code is None:
                self.__terminate(process)

            if return_code not in self.valid_return_code:
                return CollectorResult.Failure("Error occurred for collector " + str(self.get_tool_name()) +
                                               " while running `" + " ".join(command) + "`\nProcess finished with " +
                                               "code=" + str(process.returncode) , _LOGGER)

        if self.get_state() == Collector.State.ABORTING:
            return CollectorResult.Aborted(self.get_tool_name() + " aborted by user", _LOGGER)

        return CollectorResult.Success()

    def __wait_for_completion(self, process : subprocess.Popen,
                              collection_time : float,
                              poll_period : float) -> Optional[int]:
        for i in range(0, int(collection_time / poll_period)):
            sleep(poll_period)
            return_code : Optional[int] = process.poll()
            _LOGGER.debug('Polling return_code for %s i = %d -- %s', str(self.get_tool_name()), i, str(return_code))
            if return_code is not None or self.get_state() == Collector.State.ABORTING:
                return return_code
        return None

    def __terminate(self, process : subprocess.Popen, command : Optional[List[str]] = None) -> None:
        _LOGGER.info("Terminating collector %s", self.get_tool_name() )
        if IS_LINUX:
            process.terminate()
        else:
            command = command if command is not None else ['taskkill', '/T', '/PID', str(process.pid)]
            subprocess.call(command)

        return_code = self.__wait_for_completion(process, 3, 0.1)
        if return_code is None:
            self.__kill(process)

    def __kill(self, process : subprocess.Popen) -> None:
        _LOGGER.info("Force terminating collector %s", self.get_tool_name() )
        if IS_LINUX:
            process.kill()
        else:
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(process.pid)])
        _LOGGER.info('Force killed collector to avoid excessive collection')
