# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
import os
import sys
from typing import Optional, Union

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from splunk.persistconn.application import PersistentServerConnectionApplication

# local imports
import logger_manager as log
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload
from rapid_diag.serializable import JsonObject
from rapid_diag.util import get_log_files

_LOGGER = log.setup_logging("log_file_list_endpoint")


class LogFileListEndpoint(PersistentServerConnectionApplication):
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None):
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        return persistent_handler_wrap_handle(self._handle, args)

    def _handle(self, args : JsonObject) -> JsonObject:
        log_files = get_log_files()
        _LOGGER.debug("List of log files arg %s: %s", str(args) , str(log_files))
        log_files_payload = {str(idx): val for idx, val in enumerate(sorted(log_files))} # pylint: disable=unnecessary-comprehension
        return create_rapiddiag_payload(data=log_files_payload)
