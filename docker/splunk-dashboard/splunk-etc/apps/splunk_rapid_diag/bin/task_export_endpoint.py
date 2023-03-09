# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
import os
import sys
import json
from typing import Optional, Union

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

# splunk imports
from splunk.persistconn.application import PersistentServerConnectionApplication

# local imports
import logger_manager as log
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload
from rapid_diag.task_handler import TaskHandler
from rapid_diag.util import get_server_name
from rapid_diag.serializable import JsonObject

_LOGGER = log.setup_logging("task_export_endpoint")


class TaskExportEndpoint(PersistentServerConnectionApplication):
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None):
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        return persistent_handler_wrap_handle(self._handle, args)

    def _handle(self, args : JsonObject) -> JsonObject:
        task_id = next((arg[1] for arg in args['query'] if arg[0]=='task_id'), '')
        current_host = get_server_name(args['system_authtoken'])
        host = next((arg[1] for arg in args['query'] if arg[0]=='host'), current_host)

        handler = TaskHandler()
        tasks = handler.list(current_host)

        for task in tasks:
            if task_id == task["task"]["task_id"] and host == task["task"]["host"]:
                return create_rapiddiag_payload(data=task)
            _LOGGER.debug('task_id="%s" host="%s" does not match task=%s', task_id, host, json.dumps(task["task"]))

        return create_rapiddiag_payload(error='Task task_id="{}" not found.'.format(task_id))
