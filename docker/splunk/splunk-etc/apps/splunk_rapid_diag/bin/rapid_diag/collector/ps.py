# python imports
from __future__ import print_function, absolute_import
import os
import re
import sys
import threading
import tempfile
import shutil

# if colllector is ran from CLI
SPLUNK_HOME = os.environ.get('SPLUNK_HOME')
SPLUNK_DB = os.environ.get('SPLUNK_DB')
if not SPLUNK_HOME or not SPLUNK_DB:
    print('ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.\n'
          'Execute the file via Splunk\'s python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>', file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))


# local imports
import logger_manager as log
from rapid_diag.collector.resource import Resource
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.tools_collector import ToolsCollector
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.collector.tool_manager import ToolAvailabilityManager
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals

_LOGGER = log.setup_logging("ps")
IS_LINUX = sys.platform.startswith('linux')

REX_STDERR_NOT_LOGGABLE_LINE = re.compile('no matching address range')
REX_STDOUT_MAIN = re.compile('(?i)thread.*main')
REX_SYS_PROC_NOT_SUPPORTED = re.compile('System process is not supported')


class PS(ToolsCollector):
    """ RapidDiag collector allows collecting Report of current running process """

    def __init__(self, state : Collector.State = Collector.State.WAITING):
        ToolsCollector.__init__(self, valid_return_code=[0, None])
        self.tool_name = self.get_tool_name()
        self.state = state
        self.tool_manager_output = ToolAvailabilityManager.find(self.tool_name)

    @staticmethod
    def get_tool_name():
        return "ps" if IS_LINUX else "tasklist.exe"

    @staticmethod
    def get_tool_arguments():
        return set()

    @staticmethod
    def get_tool_command(**_kwargs):
        if IS_LINUX:
            return [ToolAvailabilityManager.find(PS.get_tool_name()).toolpath, 'aux', '-ejL']
        return [ToolAvailabilityManager.find(PS.get_tool_name()).toolpath, '/V', '/FO', 'CSV']

    @staticmethod
    def tool_missing():
        utility_name = PS.get_tool_name()
        tool_manager = SessionGlobals.get_tool_availability_manager()
        is_avail = tool_manager.is_available(utility_name)
        if is_avail:
            return None

        temp_dir = tempfile.mkdtemp()
        try:
            dummy_obj = PS()
            _ = dummy_obj.collect(Collector.RunContext('localhost', temp_dir, '', None))
            message = tool_manager.get_tool_message(utility_name)
            message = None if message == True else message # pylint: disable=singleton-comparison
        finally:
            shutil.rmtree(temp_dir, True)
        return message

    def get_type(self):
        return Collector.Type.SNAPSHOT

    def get_required_resources(self):
        if not IS_LINUX:
            return [Resource('tasklist')]
        return [Resource('ps')]

    def _get_json(self):
        pass

    @staticmethod
    def validate_json(obj):
        pass

    @staticmethod
    def from_json_obj(obj):
        ret = PS(Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])
        ret.set_result(obj.get("result", None))
        return ret

    def __repr__(self):
        return "PS"

    def _collect_impl(self, run_context):
        tool_manager = SessionGlobals.get_tool_availability_manager()
        if self.tool_manager_output.error_message is not None:
            status = CollectorResult.Failure(self.tool_manager_output.error_message,
                            _LOGGER, self.tool_manager_output.log_level)
        else:
            self.promote_state(Collector.State.COLLECTING, run_context.state_change_observers)
            collect_fun = self._collect_linux if IS_LINUX else self._collect_windows
            status = collect_fun(run_context.output_dir, run_context.suffix)
        tool_worked = status.isSuccess() or self.get_state() == Collector.State.ABORTING
        tool_manager.set_available(self.tool_name, True if tool_worked else self.tool_manager_output.error_message)
        return status

    def _collect_windows(self, output_dir, suffix):
        """ For windows, collect Report of current running processes using tasklist utility."""
        _LOGGER.info('Starting ps collector using tasklist with output_dir="%s" suffix="%s"', output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        fname = os.path.join(output_dir, 'ps' + suffix)
        command = self.get_tool_command()
        _LOGGER.info('Collecting %s into %s suffix %s', ' '.join(command), output_dir, suffix)

        with open(fname + ".csv", "a+") as output, open(fname + ".err", "a+") as error:
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

    def _collect_linux(self, output_dir, suffix):
        """For Linux, collect Report of current running processes using tasklist utility."""
        _LOGGER.info('Starting ps collector using ps with output_dir="%s" suffix="%s"', output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        command = self.get_tool_command()
        fname = os.path.join(output_dir, 'ps' + suffix)

        with open(fname + ".csv", "a+") as output, open(fname + ".err", "a+") as error:
            try:
                result = self.run(command, output, error)
            except EnvironmentError as e:
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name) +
                                                ', please confirm you have the ' + str(self.tool_name) + ' package ' +
                                                'installed in your system and that the ' + str(self.tool_name) +
                                                ' command is available -- path=' + os.getenv('PATH'), _LOGGER)
            except Exception as e: # pylint: disable=broad-except
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name), _LOGGER)

        return result


Serializable.register(PS)
