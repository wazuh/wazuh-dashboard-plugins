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
from rapid_diag.task_handler import TaskHandler
from rapid_diag.serializable import JsonObject

_LOGGER = log.setup_logging("static_task_information")


class StaticTaskInformationEndpoint(PersistentServerConnectionApplication):
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None):
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        return persistent_handler_wrap_handle(self._handle, args)

    def _handle(self, _ : JsonObject) -> JsonObject:
        return create_rapiddiag_payload(data=TaskHandler().static_tasks_list())
