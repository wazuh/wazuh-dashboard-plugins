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
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload, get_data_from_payload
from rapid_diag.task_handler import TaskHandler
from rapid_diag.util import get_server_name
from rapid_diag.serializable import JsonObject

_LOGGER = log.setup_logging("task_delete_endpoint")


class TaskDeleteEndpoint(PersistentServerConnectionApplication):
    """ Persisten REST endpoint responsible for task deletion.

        It takes one argument:
            task_id - ID of the task to be deleted.
    """
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None) -> None:
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        """ Main handler body
        """
        return persistent_handler_wrap_handle(self._handle, args, ['POST'])

    def _handle(self, args : JsonObject) -> JsonObject:
        def delete_local(host_del : str) -> bool:
            for task in tasks:
                if task_id == task["task"]["task_id"] and host_del == task["task"]["host"]:
                    task_handler = TaskHandler()
                    task_handler.delete(json.dumps(task))
                    return True
            return False

        task_id, _, _, _ = get_data_from_payload(args)
        current_host = get_server_name(args['system_authtoken'])
        success = create_rapiddiag_payload(data="Started deleting the Task with ID: " + str(task_id) + ".")
        handler = TaskHandler()
        tasks = handler.list(current_host)
        _LOGGER.debug("current host had tasks: %s current host %s", str(len(tasks)), str(current_host))
        if delete_local(current_host):
            return success
        return create_rapiddiag_payload(error='Task task_id="{}" not found.'.format(task_id))
