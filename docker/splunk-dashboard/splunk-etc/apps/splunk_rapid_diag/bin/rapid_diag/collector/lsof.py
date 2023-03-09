# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import print_function, absolute_import
import os
import sys
import threading
import tempfile
import shutil

# if collector is ran from CLI
SPLUNK_HOME = os.environ.get('SPLUNK_HOME')
SPLUNK_DB = os.environ.get('SPLUNK_DB')
if not SPLUNK_HOME or not SPLUNK_DB:
    print('ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.'
          '\nExecute the file via Splunk\'s python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>', file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.realpath(__file__)))))


# local imports
import logger_manager as log
from rapid_diag.collector.resource import Resource
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.tools_collector import ToolsCollector
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.collector.tool_manager import ToolAvailabilityManager
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals
from rapid_diag.process_abstraction import Process, ProcessLister

_LOGGER = log.setup_logging("lsof")
IS_LINUX = sys.platform.startswith('linux')


NO_TASK_MSG = "no tasks located"
NO_PROCESS_ID_MSG = "process ID not located"


class LSOF(ToolsCollector):
    """ RapidDiag collector allows collecting list of open files by given process """

    def __init__(self, process : Process, state : Collector.State = Collector.State.WAITING):
        ToolsCollector.__init__(self, valid_return_code=[0, None])
        self.process = process
        self.pid = 0
        self.state = state
        self.tool_name = self.get_tool_name()
        self.tool_manager_output = ToolAvailabilityManager.find(self.tool_name)

    @staticmethod
    def get_tool_name():
        """
        TODO: Change handle64 to handle
        ISSUE: In windows os handle internally starts up handle64 as a child.
        At the time of running a handle with subprocess it popups the console
        output instead of writing output to *.out file. The solution for this
        is to use STARTF_USESHOWWINDOW dwflag with startupinfo and hide the
        window output. But neither our creation flags and startupinfo can be
        clubbed together nor creation flags can be removed(creation flags were
        used as a workaround for other problems).
        Changes are also required in resource.py
        """
        return "lsof" if IS_LINUX else "handle64.exe"

    @staticmethod
    def tool_missing():
        utility_name = LSOF.get_tool_name()
        tool_manager = SessionGlobals.get_tool_availability_manager()
        is_avail = tool_manager.is_available(utility_name)
        if is_avail:
            return None

        temp_dir = tempfile.mkdtemp()
        try:
            process = ProcessLister.build_process_from_pid(os.getpid())
            dummy_obj = LSOF(process)
            _ = dummy_obj.collect(Collector.RunContext('localhost', temp_dir, '', None))
            message = tool_manager.get_tool_message(utility_name)
            message = None if message == True else message  # pylint: disable=singleton-comparison
        finally:
            shutil.rmtree(temp_dir, True)
        return message

    def get_custom_display_name(self):
        return self.process.get_custom_display_name()

    @staticmethod
    def get_tool_arguments():
        return {'pid'}

    @staticmethod
    def get_tool_command(**args):
        assert frozenset(args.keys()) <= LSOF.get_tool_arguments()
        if IS_LINUX:
            return [ToolAvailabilityManager.find(LSOF.get_tool_name()).toolpath,
                    '-s', '-V', '-n', '-a', '-K', '-p', str(args['pid'])]
        return [ToolAvailabilityManager.find(LSOF.get_tool_name()).toolpath,
                    '-a', '-nobanner', '-p',  str(args['pid']), '-accepteula']

    def get_process_name(self):
        return self.process.get_process_name()

    def get_type(self):
        return Collector.Type.SNAPSHOT

    def get_required_resources(self):
        if not IS_LINUX:
            return [Resource('handle64')]
        return [Resource('lsof', self.process)]

    def _get_json(self):
        return {
            'process': self.process,
        }

    def __repr__(self):
        return "LSOF(Process: %r)" % (self.process)

    @staticmethod
    def validate_json(obj):
        data_types = {"process": (object,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj):
        ret = LSOF(obj['process'], Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])
        ret.set_result(obj.get("result", None))
        return ret

    def _collect_impl(self, run_context):
        tool_manager = SessionGlobals.get_tool_availability_manager()
        if not self.preflight_checks():
            tool_manager.set_available(self.tool_name, self.tool_manager_output.error_message)
            return CollectorResult.Failure()

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

    def _collect_helper(self, command, fname):
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

    def _collect_windows(self, output_dir, suffix):
        """ For windows, collect list of open files by given process using handle utility."""
        _LOGGER.info('Starting lsof collector using handle: collect with process=%s output_dir=%s suffix=%s',
                        str(self.process), output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        fname = os.path.join(output_dir, 'handle64_' + str(self.pid) + suffix)

        args = {'pid': str(self.pid)}
        command = self.get_tool_command(**args)
        _LOGGER.debug('Collecting %s into %s suffix %s', ' '.join(command), output_dir, suffix)

        return self._collect_helper(command, fname)

    def _collect_linux(self, output_dir, suffix):
        """For Linux, collect list of open files by given process using lsof utility."""
        _LOGGER.info('Starting lsof collector using lsof: collect with process=%s output_dir=%s suffix=%s',
                        str(self.process), output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        # TODO: -E only works in newer versions of lsof (version greater or equal to 4.89)
        args = {'pid' : str(self.pid)}
        command = self.get_tool_command(**args)

        fname = os.path.join(output_dir, 'lsof_' + str(self.pid) + suffix)

        result = self._collect_helper(command, fname)


        if result.status == CollectorResult.Status.FAILURE:
            output_string = None
            with open(fname + ".out", "r") as output:
                output_string = output.read()

            # if -K option fails rerun the lsof without -K option.
            if (not NO_PROCESS_ID_MSG in output_string) and NO_TASK_MSG in output_string:
                _LOGGER.info('Rerunnig lsof collector using lsof without -K option: '
                             'collect with process=%s output_dir=%s suffix=%s',
                             str(self.process), output_dir, suffix)
                command.remove("-K")
                result = self._collect_helper(command, fname)
        return result

    def preflight_checks(self):
        return self._check_process() and self._check_access()

    def _check_process(self):
        best_match = SessionGlobals.get_process_lister().get_best_running_match(self.process)
        if best_match:
            self.process = best_match
            self.pid = best_match.get_pid()
            return True
        _LOGGER.error("Can't read data for process=%s : process not running", str(self.process))
        return False

    def _check_access(self):
        if IS_LINUX:
            if not os.access('/proc/' + str(self.pid), os.R_OK | os.X_OK):
                _LOGGER.error("Can't read data for process=%s from path '/proc/%s': insufficient permissions.",
                                str(self.process), str(self.pid))
                return False
        return True

Serializable.register(LSOF)
