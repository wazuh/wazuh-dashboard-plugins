# python imports
import os
import sys
from typing import Optional, Union

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunklib.binding import HTTPError

# local imports
import logger_manager as log
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload
from rapid_diag.util import get_server_name
from rapid_diag.task_handler import TaskHandler
from rapid_diag.serializable import JsonObject

_LOGGER = log.setup_logging("task_information_endpoint")


class TaskInformationEndpoint(PersistentServerConnectionApplication):
    """ Persisten REST endpoint responsible for providing information about all running tasks.
    """
    def __init__(self, command_line: Optional[str] = None, command_arg: Optional[str] = None) -> None:
        pass

    def handle(self, args: Union[str, bytes]) -> JsonObject:
        """ Main handler body
        """
        return persistent_handler_wrap_handle(self._handle, args)

    def _handle(self, args: JsonObject) -> JsonObject:
        try:
            local_host = get_server_name(args['system_authtoken'])
        except HTTPError as e:
            _LOGGER.exception('Error trying to retrieve hostname for rapid_diag/task_information', exc_info=e)
            return create_rapiddiag_payload(error='Error trying to retrieve hostname for rapid_diag/task_information: ' +
                                                    e.reason)

        handler = TaskHandler()
        tasks = handler.list(local_host)
        resp = {"tasks": tasks, "splunk_server": local_host}
        return create_rapiddiag_payload(data=resp)
