# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import print_function, absolute_import
import os
import re
import sys
import threading
import tempfile
import shutil
import json

# if collector is ran from CLI
SPLUNK_HOME = os.environ.get('SPLUNK_HOME')
SPLUNK_DB = os.environ.get('SPLUNK_DB')
if not SPLUNK_HOME or not SPLUNK_DB:
    print('ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.'
          '\nExecute the file via Splunk\'s python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>', file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))

# local imports
import logger_manager as log
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.tools_collector import ToolsCollector
from rapid_diag.collector.resource import Resource
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.collector.tool_manager import ToolAvailabilityManager
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals
from rapid_diag.process_abstraction import Process, ProcessLister

# splunk imports
import splunk
import splunklib.client as client
from splunklib.client import AuthenticationError, HTTPError

_LOGGER = log.setup_logging("stack_trace")
IS_LINUX = sys.platform.startswith('linux')

REX_STDERR_NOT_LOGGABLE_LINE = re.compile('no matching address range')
REX_STDOUT_MAIN = re.compile('(?i)thread.*main')
REX_SYS_PROC_NOT_SUPPORTED = re.compile('System process is not supported')
REX_CALL_STACK_ADDRESS_SIGNATURE = re.compile(r'\[(?P<address>.*)\]  \"(?P<signature>.*)\"')


class StackTrace(ToolsCollector):
    """ RapidDiag collector allows collecting stack traces for a given process """

    def __init__(self, process : Process, state : Collector.State = Collector.State.WAITING):
        # procdump returns -2 but python3 converts it to 4294967294(unsigned -2)
        # workaround, adding 4294967294 to valid_return_code
        # procdump should returns 0 for successful completion.
        # TODO: debug the issue and remove -2 and 4294967294 from the list.
        ToolsCollector.__init__(self, valid_return_code=[
                                0, 1] if IS_LINUX else [0, -2, 4294967294])
        self.process = process
        self.pid = 0
        self.state = state
        self.tool_name = self.get_tool_name()
        self.tool_manager_output = ToolAvailabilityManager.find(self.tool_name)

    @staticmethod
    def get_tool_name():
        return "eu-stack" if IS_LINUX else "procdump.exe"

    @staticmethod
    def get_tool_arguments():
        return {'pid'}

    @staticmethod
    def get_tool_command(**args):
        assert frozenset(args.keys()) <= StackTrace.get_tool_arguments()
        if IS_LINUX:
            return [ToolAvailabilityManager.find(StackTrace.get_tool_name()).toolpath
                , '-i', '-l', '-p', str(args['pid'])]
        return [ToolAvailabilityManager.find(StackTrace.get_tool_name()).toolpath,
                    str(args['pid']), '-accepteula']

    @staticmethod
    def tool_missing():
        utility_name = StackTrace.get_tool_name()
        tool_manager = SessionGlobals.get_tool_availability_manager()
        is_avail = tool_manager.is_available(utility_name)
        if is_avail:
            return None

        temp_dir = tempfile.mkdtemp()
        try:
            process = ProcessLister.build_process_from_pid(os.getpid())
            dummy_obj = StackTrace(process)
            _ = dummy_obj.collect(Collector.RunContext('localhost', temp_dir, '', None))
            message = tool_manager.get_tool_message(utility_name)
            message = None if message == True else message # pylint: disable=singleton-comparison
        finally:
            shutil.rmtree(temp_dir, True)
        return message

    def get_custom_display_name(self):
        return self.process.get_custom_display_name()

    def get_process_name(self):
        return self.process.get_process_name()

    def get_type(self):
        return Collector.Type.SNAPSHOT

    def get_required_resources(self):
        if not IS_LINUX:
            return [Resource('procdump')]
        return [Resource('ptrace', self.process)]

    def __repr__(self):
        return "Stack Trace(Process: %r)" % (self.process)

    def _get_json(self):
        return {
            'process': self.process
        }

    @staticmethod
    def validate_json(obj):
        data_types = {"process": (object,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj):
        ret = StackTrace(obj['process'], Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])
        ret.set_result(obj.get("result", None))
        return ret

    def _collect_impl(self, run_context):
        tool_manager = SessionGlobals.get_tool_availability_manager()
        if not self.preflight_checks():
            tool_manager.set_available(self.tool_name, self.tool_manager_output.error_message)
            return CollectorResult.Failure()
        using_watchdog = False
        if self.tool_manager_output.error_message is not None:
            if self.process.process_type == 'splunkd server':
                self.promote_state(Collector.State.COLLECTING, run_context.state_change_observers)
                status = self._collect_watchdog(run_context)
                using_watchdog = True
            else:
                status = CollectorResult.Failure(self.tool_manager_output.error_message,
                        _LOGGER, self.tool_manager_output.log_level)
        else:
            self.promote_state(Collector.State.COLLECTING, run_context.state_change_observers)
            collect_fun = self._collect_linux if IS_LINUX else self._collect_windows
            status = collect_fun(run_context.output_dir, run_context.suffix)
        tool_worked = (status.isSuccess() or self.get_state() == Collector.State.ABORTING) and not using_watchdog
        tool_manager.set_available(self.tool_name, True if tool_worked else self.tool_manager_output.error_message)
        return status

    def needs_auth(self) -> bool:
        if self.tool_manager_output.error_message is not None and self.process.process_type == 'splunkd server':
            return True
        return False

    @staticmethod
    def format_watchdog_data(data, output_file) -> CollectorResult:
        """
        Format watchdog JSON content element into a file in a format compatible with flamegraph tools.

        Example of input json format:
        "AppLicenseThread [57538]":
        [
            "[0x00000000048C6CBB]  "_ZN16AppLicenseThread4mainEv + 465 (splunkd + 0x44C6CBB)"",
            "[0x0000000004DAC395]  "_ZN6Thread37_callMainAndDiscardTerminateExceptionEv + 69 (splunkd + 0x49AC395)""
        ]

        Example of output format:
        TID 57538:
        #0 0x00000000048C6CBB _ZN16AppLicenseThread4mainEv + 465 (splunkd + 0x44C6CBB)
        #1 0x0000000004DAC395 _ZN6Thread37_callMainAndDiscardTerminateExceptionEv + 69 (splunkd + 0x49AC395)
        """
        try:
            content = json.loads(data)['entry'][0]['content']
            for tid, calls in content.items():
                if not tid or not calls:
                    continue
                matched_tid = re.match(r'.* \[(?P<tid>.*)\]', tid)
                if not matched_tid:
                    continue
                output_file.write('TID ' + matched_tid.group('tid') + ':\n')
                for counter, call in enumerate(calls):
                    matched_call = REX_CALL_STACK_ADDRESS_SIGNATURE.match(call)
                    if matched_call:
                        output_file.write('#' + str(counter) + ' ' + matched_call.group('address') + ' ' +
                                            matched_call.group('signature')+'\n')
        except AttributeError as e:
            return CollectorResult.Exception(e, 'Format watchdog data failed', _LOGGER)
        return CollectorResult.Success()

    def _collect_watchdog(self, run_context: Collector.RunContext) -> CollectorResult:
        """Collects stack traces for a given process using watchdog utility."""
        _LOGGER.info('Starting stack trace collector using watchdog: collect with process=%s output_dir=%s suffix=%s',
                        str(self.process), run_context.output_dir, run_context.suffix)
        _LOGGER.debug('Task assigned to thread: %s', str(threading.current_thread().name))
        _LOGGER.debug('ID of process running task: %s', str(os.getpid()))

        if IS_LINUX:
            try:
                self.collect_proc(run_context.output_dir, run_context.suffix)
            except EnvironmentError as e:
                _LOGGER.exception('Error collecting data from procfs, process=%s output_dir=%s suffix=%s : %s',
                                str(self.process), run_context.output_dir, run_context.suffix, str(e))

        try:
            service = client.connect(host=splunk.getDefault('host'),
                                     port=splunk.getDefault('port'),
                                     scheme=splunk.getDefault('protocol'),
                                     token=run_context.session_token,
                                     autologin=True,
                                     )
        except AuthenticationError as e:
            return CollectorResult.Exception(e, 'Authentication failed', _LOGGER)

        try:
            _LOGGER.debug('Collecting watchdog into %s with suffix %s', run_context.output_dir, run_context.suffix)
            response = service.get('/services/server/pstacks', output_mode='json')
        except HTTPError as e:
            if e.status == 503 and e.reason == 'Service Unavailable':
                return CollectorResult.Failure('Splunk Watchdog Service Unavailable.', _LOGGER)
            return CollectorResult.Exception(e, 'Request failed', _LOGGER)

        fname = os.path.join(run_context.output_dir, 'watchdog_' + str(self.pid) + run_context.suffix)

        with open(fname + ".out", "a+") as output:
            try:
                watchdog_data = response['body'].read().decode('utf-8')
                return self.format_watchdog_data(watchdog_data, output)
            except UnicodeError as e:
                return CollectorResult.Exception(e, 'Decode watchdog data failed', _LOGGER)

    def _collect_windows(self, output_dir, suffix):
        """For Windows, collects stack traces for a given process using procdump utility."""
        _LOGGER.info('Starting stack trace collector using procdump: collect with process=%s output_dir=%s suffix=%s',
                    str(self.process), output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))
        args = {'pid': str(self.pid)}
        fname = os.path.join(output_dir, 'procdump_'+ str(self.pid) + suffix)
        command = [self.get_tool_command(**args), output_dir]
        _LOGGER.debug('Collecting %s into %s suffix %s', ' '.join(command), output_dir, suffix)

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

        with open(fname + ".out", "r") as out:
            if REX_SYS_PROC_NOT_SUPPORTED.search(out.read()):
                return CollectorResult.Failure("Writing a dump file for the System process is not supported.",
                                            _LOGGER)

        return result


    def _collect_linux(self, output_dir, suffix):
        """For Linux, collects stack traces for a given process using eu-stack utility."""
        _LOGGER.info('Starting stack trace collector using eustack: collect with process=%s output_dir=%s suffix=%s',
                        str(self.process), output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        # non-fatal, though it would be great if we could show in tool availability somehow...
        try:
            self.collect_proc(output_dir, suffix)
        except EnvironmentError as e:
            _LOGGER.exception('Error collecting data from procfs, process=%s output_dir=%s suffix=%s : %s',
                              str(self.process), output_dir, suffix, str(e))

        fname = os.path.join(output_dir, 'eustack_' + str(self.pid) + suffix)

        args = {'pid': str(self.pid)}
        proc_call = self.get_tool_command(**args)
        _LOGGER.debug('Collecting %s into %s with suffix %s', ' '.join(proc_call), output_dir, suffix)
        with open(fname + ".out", "a+") as output, open(fname + ".err", "a+") as error:
            try:
                result = self.run(proc_call, output, error)
            except EnvironmentError as e:
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name) +
                                                ', please confirm you have the ' + str(self.tool_name) + ' package ' +
                                                'installed in your system and that the ' + str(self.tool_name) +
                                                ' command is available -- path=' + os.getenv('PATH'), _LOGGER)
            except Exception as e: # pylint: disable=broad-except
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name), _LOGGER)

        logged_error = False
        with open(fname + ".err", "r") as err:
            for line in err.read().splitlines():
                if not REX_STDERR_NOT_LOGGABLE_LINE.search(line):
                    if not logged_error:
                        _LOGGER.warning('Stack trace collection finished with errors (see "%s.err")', fname)
                        logged_error = True

        with open(fname + ".out", "r") as out:
            if (self.get_process_name().startswith("splunkd")) and (not REX_STDOUT_MAIN.search(out.read())):
                return CollectorResult.Failure("Latest stack dump (" + fname + ".out) doesn't " +
                                            "contain 'Thread's or 'main()' call! Please try " +
                                            "running manually and check output: " + ' '.join(proc_call),
                                            _LOGGER)

        return result

    def collect_proc(self, output_dir, suffix):
        base = '/proc/' + str(self.pid) + '/task'
        _LOGGER.debug('Collecting contents from path=%s', base)
        with open(os.path.join(output_dir, 'kernelstack_' + str(self.pid) + suffix) + '.out', 'w') as kern_f, \
                open(os.path.join(output_dir, 'status_' + str(self.pid) + suffix) + '.out', 'w') as status_f:
            for task in os.listdir(base):
                cur_base = base + '/' + task
                _LOGGER.debug('Processing path=%s', cur_base)
                try:
                    kern_f.write("Thread LWP " + task + "\n")
                    with open(cur_base + '/stack', "r") as f:
                        kern_f.write(f.read())
                except EnvironmentError as e:
                    _LOGGER.warning('Error collecting kernel stack data from procfs, process=%s output_dir=%s suffix=%s : %s',
                            str(self.process), output_dir, suffix, str(e))
                    return "Error collecting kernel stack data from procfs"
                try:
                    status_f.write("Thread LWP " + task + "\n")
                    with open(cur_base + '/status', "r") as f:
                        status_f.write(f.read())
                except EnvironmentError as e:
                    _LOGGER.warning('Error collecting status from procfs, process=%s  output_dir=%s suffix=%s : %s',
                                    str(self.process), output_dir, suffix, str(e))
                    return "Error collecting status from procfs"
        return True

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
                _LOGGER.error("Can't read data for process=%s from path '/proc/%s' : insufficient permissions",
                            str(self.process), str(self.pid))
                return False
        return True


Serializable.register(StackTrace)
