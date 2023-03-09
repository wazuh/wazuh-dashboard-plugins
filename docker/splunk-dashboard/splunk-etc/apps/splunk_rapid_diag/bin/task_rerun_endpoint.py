# pylint: disable=missing-function-docstring,missing-class-docstring
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
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload, get_data_from_payload
from rapid_diag.task_handler import TaskHandler
from rapid_diag.util import get_server_name
from rapid_diag.serializable import JsonObject

_LOGGER = log.setup_logging("task_rerun_endpoint")


class TaskRerunEndpoint(PersistentServerConnectionApplication):
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None):
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        return persistent_handler_wrap_handle(self._handle, args, ['POST'])

    def _handle(self, args : JsonObject) -> JsonObject: # pylint: disable=too-many-locals
        current_host = get_server_name(args['system_authtoken'])
        task_id, new_task_id, _, host = get_data_from_payload(args)
        success = create_rapiddiag_payload(data="Task with ID " + str(task_id) + " has re-run.")
        handler = TaskHandler()

        try:
            tasks = handler.list(current_host)
            for task in tasks:
                if task["task"]["task_id"] == task_id and task["task"]["host"] == current_host:
                    if not new_task_id:
                        new_task_id = TaskHandler.build_task_id(task["task"]["name"], task["task"]["host"])
                    task["task"]["task_id"] = new_task_id
                    _LOGGER.info('starting new_task_id="' + new_task_id + '" task=' + json.dumps(
                        task["task"]))
                    task_body = json.dumps(task["task"])
                    task_handler = TaskHandler()
                    new_task = task_handler.create(task_body)
                    run_info = None
                    if new_task is not None:
                        run_info = task_handler.run_detached(new_task, args['system_authtoken'])
                    if run_info is None:
                        return create_rapiddiag_payload(error="Unable to start task collection process.")
                    return success

                _LOGGER.debug('task_id="%s" host="%s" does not match task=%s', task_id, host, json.dumps(task["task"]))
        except Exception as exc: # pylint: disable=broad-except
            _LOGGER.exception("Aborting: JSON decode error. Invalid JSON format or request body not found.\n%s",
                          str(exc), exc_info=exc)
            return create_rapiddiag_payload(error="Invalid JSON format or request body not found.")
        return create_rapiddiag_payload(error='Task task_id="{}" not found.'.format(task_id))
