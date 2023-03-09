from __future__ import print_function, absolute_import
import sys
import os
import threading
import tempfile
import shutil

# if collector is ran from CLI
SPLUNK_HOME = os.environ.get("SPLUNK_HOME")
SPLUNK_DB = os.environ.get("SPLUNK_DB")
if not SPLUNK_HOME or not SPLUNK_DB:
    print("ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.\n"
          "Execute the file via Splunk's python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>", file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))

# local imports
import logger_manager as log
from rapid_diag.collector.resource import Resource
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.tools_collector import ToolsCollector
from rapid_diag.collector.collector_result import CollectorResult, AggregatedCollectorResult
from rapid_diag.collector.tool_manager import ToolAvailabilityManager
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals

_LOGGER = log.setup_logging("netstat")
IS_LINUX = sys.platform.startswith('linux')

class NetStat(ToolsCollector):
    """RapidDiag Collector  gathers network statistics and network connections"""

    def __init__(self, state=Collector.State.WAITING):
        ToolsCollector.__init__(self)
        self.state = state
        self.tool_name = self.get_tool_name()
        self.tool_manager_output = ToolAvailabilityManager.find(self.tool_name)

    @staticmethod
    def get_tool_name():
        return "netstat" if IS_LINUX else "netstat.exe"

    @staticmethod
    def get_tool_arguments():
        return set()

    @staticmethod
    def get_tool_command(**_kwargs):
        if IS_LINUX:
            return [ToolAvailabilityManager.find(NetStat.get_tool_name()).toolpath, "-a", "-n", "-v", "-e", "-p"]
        return [ToolAvailabilityManager.find(NetStat.get_tool_name()).toolpath, "-a", "-n", "-o"]

    @staticmethod
    def tool_missing():
        utility_name = NetStat.get_tool_name()
        tool_manager = SessionGlobals.get_tool_availability_manager()
        is_avail : bool = tool_manager.is_available(utility_name)
        if is_avail:
            return None
        temp_dir = tempfile.mkdtemp()
        try:
            dummy_obj = NetStat()
            _ = dummy_obj.collect(Collector.RunContext('localhost', temp_dir, "", None))
            message = tool_manager.get_tool_message(utility_name)
            message = None if message == True else message # pylint: disable=singleton-comparison
        finally:
            shutil.rmtree(temp_dir, True)
        return message

    def get_type(self):
        return Collector.Type.SNAPSHOT

    def get_required_resources(self):
        return [Resource('netstat')]

    def __repr__(self):
        return "Netstat"

    def _get_json(self):
        pass

    @staticmethod
    def validate_json(obj):
        pass

    @staticmethod
    def from_json_obj(obj):
        ret = NetStat(Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])
        ret.set_result(obj.get("result", None))
        return ret

    def _collect_impl(self, run_context):
        tool_manager = SessionGlobals.get_tool_availability_manager()
        if self.tool_manager_output.error_message is not None:
            status = CollectorResult.Failure(self.tool_manager_output.error_message, _LOGGER,
                                        self.tool_manager_output.log_level)
        else:
            self.promote_state(Collector.State.COLLECTING, run_context.state_change_observers)
            collect_fun = self._collect_linux if IS_LINUX else self._collect_windows
            status = collect_fun(run_context.output_dir, run_context.suffix)
        tool_worked = status.isSuccess() or self.get_state() == Collector.State.ABORTING
        tool_manager.set_available(self.tool_name, True if tool_worked else self.tool_manager_output.error_message)
        return status

    def _collect_linux(self, output_dir, suffix):
        """Collects network statistics and current network connections in Windows.
        `netstat` is required to run this collection.
        Collector gathers data and stores output in `.out` file and errors in `.err` file

        Parameters
        ----------
        output_dir : string
            Data collection directory path
        suffix : string
            Suffix to the file

        Returns
        -------
        CollectorResult
            CollectorResult.Success() if successful
            OR CollectorResult.Failure() if failure
            OR CollectorResult.Exception() otherwise
        """

        _LOGGER.info('Starting Netstat collector with: output_dir="%s" suffix="%s"', output_dir, suffix)
        _LOGGER.debug('Task assigned to thread: %s', str(threading.current_thread().name))
        _LOGGER.debug('ID of process running task: %s', str(os.getpid()))

        status = AggregatedCollectorResult()
        command = [self.tool_manager_output.toolpath, "-s"]
        status.add_result(self._collect_helper(command, output_dir, "statistics" ,suffix))
        command = self.get_tool_command()
        status.add_result(self._collect_helper(command, output_dir, "connections", suffix))
        return status

    def _collect_windows(self, output_dir, suffix):
        """Collects network statistics and current network connections in Windows.
        `netstat.exe` is required to run this collection.
        Collector gathers data and stores output in `.out` file and errors in `.err` file

        Parameters
        ----------
        output_dir : string
            Data collection directory path
        suffix : string
            Suffix to the file

        Returns
        -------
        CollectorResult
            CollectorResult.Success() if successful
            OR CollectorResult.Failure() if failure
            OR CollectorResult.Exception() otherwise
        """

        _LOGGER.info('Starting Netstat collector with: output_dir="%s", suffix="%s"', output_dir, suffix)
        _LOGGER.debug('Task assigned to thread: %s', str(threading.current_thread().name))
        _LOGGER.debug('ID of process running task: %s', str(os.getpid()))

        status = AggregatedCollectorResult()
        command = [self.tool_manager_output.toolpath, "-s"]
        status.add_result(self._collect_helper(command, output_dir, "statistics", suffix))
        command = self.get_tool_command()
        status.add_result(self._collect_helper(command, output_dir, "connections", suffix))
        return status

    def _collect_helper(self, command, output_dir, prefix, suffix):
        fname = os.path.join(output_dir, "netstat_" + prefix + suffix)
        with open(fname + ".out", "a+") as output, open(fname + ".err", "a+") as error:
            try:
                result = self.run(command, output, error)
            except EnvironmentError as e:
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name) +
                                                ', please confirm you have the ' + str(self.tool_name) + ' package ' +
                                                'installed in your system and that the ' + str(self.tool_name) +
                                                ' command is available and is in your PATH.', _LOGGER)
            except Exception as e: # pylint: disable=broad-except
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name), _LOGGER)

        return result

Serializable.register(NetStat)
