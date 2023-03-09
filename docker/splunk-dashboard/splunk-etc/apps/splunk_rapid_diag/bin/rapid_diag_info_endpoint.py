# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
import os
import sys
from typing import Optional, Union, List, Dict, Type

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from splunk.persistconn.application import PersistentServerConnectionApplication

# local imports
import logger_manager as log
from rapid_diag_handler_utils import  persistent_handler_wrap_handle, create_rapiddiag_payload
from rapid_diag.task_handler import TaskHandler
from rapid_diag.collector.tools_collector import ToolsCollector
from rapid_diag.collector.system_call_trace import SystemCallTrace
from rapid_diag.collector.stack_trace import StackTrace
from rapid_diag.collector.network_packet import NetworkPacket
from rapid_diag.collector.iops import IOPS
from rapid_diag.collector.netstat import NetStat
from rapid_diag.collector.ps import PS
from rapid_diag.collector.lsof import LSOF
from rapid_diag.serializable import JsonObject
from rapid_diag.session_globals import SessionGlobals
from rapid_diag.task import DEFAULT_OUTPUT_ROOT
from rapid_diag.util import get_server_name

_LOGGER = log.setup_logging("rapid_diag_info_endpoint")

collector_class_map : Dict[str, Type[ToolsCollector]] = {"system_call_trace": SystemCallTrace,
                       "stack_trace": StackTrace,
                       "network_packet": NetworkPacket,
                       "iops": IOPS,
                       "netstat":NetStat,
                       "ps":PS,
                       "lsof":LSOF}

def check_utilities() -> Dict[str, Dict[str, str]]:
    unavailable_utilities = {}
    # global collector_class_map
    for collector, klass in collector_class_map.items():
        message = klass.tool_missing()
        if message:
            unavailable_utilities[collector] = { klass.get_tool_name(): message }
    return unavailable_utilities


def check_allocated_resources(server : str) -> List[Optional[JsonObject]]:
    # TODO: use this in the UI later,
    # to not allow SystemCallTrace and StackTrace to run on same process
    allocated_resources = TaskHandler().get_allocated_resources(server)
    return [resource.to_json() for resource in allocated_resources]


def check_running_collectors(host : str) -> Dict[str, bool]:
    handler = TaskHandler()
    tasks = handler.list(host)
    running_collectors = {}
    running_tasks = [task for task in tasks if task["task"]["host"] == host and task.get("status","") == "Collecting"]
    # global collector_class_map
    for collector in collector_class_map:
        if "rapid_diag.collector." + collector + "." in str(running_tasks):
            running_collectors[collector] = True
    return running_collectors


def get_collector_availability_status(session_key : str) -> JsonObject:
    host = get_server_name(session_key)
    running_collectors = check_running_collectors(host)
    unavailable_utilities = check_utilities()
    allocated_resources = check_allocated_resources(host)
    return {"unavailable_utilities": unavailable_utilities,
            "running_collectors": running_collectors,
            "splunk_server": host,
            "output_directory": DEFAULT_OUTPUT_ROOT,
            "allocated_resources": allocated_resources }


class RapidDiagInfoEndpoint(PersistentServerConnectionApplication):
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None):
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        return persistent_handler_wrap_handle(self._handle, args)

    def _handle(self, args : JsonObject) -> JsonObject:
        force_reload = next((arg[1] for arg in args['query'] if arg[0]=='force_reload'), False)
        collector_availability_status : Union[List[JsonObject], JsonObject] = {}
        if force_reload:
            tool_manager = SessionGlobals.get_tool_availability_manager()
            tool_manager.reset()
        collector_availability_status = get_collector_availability_status(args['system_authtoken'])
        _LOGGER.debug("Response: %s", str(collector_availability_status))
        return create_rapiddiag_payload(data=collector_availability_status)
