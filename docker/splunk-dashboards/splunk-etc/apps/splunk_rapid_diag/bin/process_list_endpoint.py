# python imports
import os
import sys
from typing import Optional, Union

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from splunk.persistconn.application import PersistentServerConnectionApplication

# local imports
import logger_manager as log
from rapid_diag_handler_utils import persistent_handler_wrap_handle
from rapid_diag_handler_utils import create_rapiddiag_payload
from rapid_diag.serializable import JsonObject
from rapid_diag.session_globals import SessionGlobals

_LOGGER = log.setup_logging("process_list_endpoint")


class ProcessListEndpoint(PersistentServerConnectionApplication):
    """ Persisten REST endpoint responsible for providing a list
        of processes running on the server.
    """
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None):
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        """ Main handler body
        """
        def _handle(args : JsonObject) -> JsonObject:
            proc_data = SessionGlobals.get_process_lister().get_ui_process_list()
            _LOGGER.debug("Process Data for args %s : %s", args,  str(proc_data))
            return create_rapiddiag_payload(data=proc_data)
        return persistent_handler_wrap_handle(_handle, args)
