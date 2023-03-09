# pylint: disable=missing-function-docstring,missing-class-docstring
# Class SystemCallTraceCollector allows to collect system call level tracing information.
# It will invoke the relevant implementation based on operating system used by the user.
# For example,
# In case of windows it will invoke procmon (i.e process monitor) tool which will collect
# all the information and will create zip file into provided output directory.
#
# set up and parse arguments; main program and args are for QA and standalone scripting
# vs. plugged into the SplunkRapidDiag framework.
#
# nota bene: the procmon tool needs to be downloaded separately from this collector. If
# downloaded as part of the app install, it should be placed relative to SplunkRapidDiag,
# probably in the bin subdirectory.
#

# python imports
from __future__ import print_function, absolute_import
import os
import sys
import glob
import threading
import tempfile
import shutil
from zipfile import ZipFile
from zipfile import ZIP_DEFLATED

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
from rapid_diag.process_abstraction import Process, ProcessLister
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals
from rapid_diag.util import retry

_LOGGER = log.setup_logging("system_call_trace")
IS_LINUX = sys.platform.startswith('linux')


class SystemCallTrace(ToolsCollector):
    def __init__(self, collection_time : float, process : Process, state : Collector.State = Collector.State.WAITING):
        ToolsCollector.__init__(self, collection_time=collection_time, valid_return_code=[0, None])
        self.process = process
        self.pid = 0
        self.state = state
        self.tool_name = self.get_tool_name()
        self.tool_manager_output = ToolAvailabilityManager.find(self.tool_name)

    @staticmethod
    def get_tool_name():
        return "strace" if IS_LINUX else "procmon.exe"

    @staticmethod
    def get_tool_arguments():
        return {'pid','collection_time'}

    @staticmethod
    def get_tool_command(**args):
        assert frozenset(args.keys()) <= SystemCallTrace.get_tool_arguments()
        if IS_LINUX:
            return [ToolAvailabilityManager.find(SystemCallTrace.get_tool_name()).toolpath, '-ttt',
                    '-T', '-f', '-x', '-s0', '-p', str(args['pid'])]
        return [ToolAvailabilityManager.find(SystemCallTrace.get_tool_name()).toolpath]

    @staticmethod
    def tool_missing():
        utility_name = SystemCallTrace.get_tool_name()
        tool_manager = SessionGlobals.get_tool_availability_manager()
        is_avail = tool_manager.is_available(utility_name)
        if is_avail:
            return None
        temp_dir = tempfile.mkdtemp()
        try:
            process = ProcessLister.build_process_from_pid(os.getpid())
            dummy_obj = SystemCallTrace(2, process)
            _ = dummy_obj.collect(Collector.RunContext('localhost', temp_dir, '', None))
            message = tool_manager.get_tool_message(utility_name)
            message = None if message == True else message # pylint: disable=singleton-comparison
        finally:
            shutil.rmtree(temp_dir, True)
        return message

    def get_custom_display_name(self):
        return self.process.get_custom_display_name()

    def get_type(self):
        return Collector.Type.CONTINUOUS

    def get_required_resources(self):
        if not IS_LINUX:
            return [Resource('procmon')]
        return [Resource('ptrace', self.process)]

    @staticmethod
    def validate_json(obj):
        data_types = {"collection_time": (float, int), "process": (object,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

        value_range = {"collection_time": [10, Collector.MAX_TIME]}
        for field in list(filter(lambda x: x in obj.keys(), value_range.keys())):
            Serializable.check_value_in_range(
                obj[field], value_range[field], field)

    @staticmethod
    def from_json_obj(obj):
        ret = SystemCallTrace(obj['collection_time'], obj['process'],
                                Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])
        ret.set_result(obj.get("result", None))
        return ret

    def __repr__(self):
        return "System Call Trace(Collection Time: %r, Process: %r)" % (self.collection_time, self.process)

    def _get_json(self):
        return {
            'collection_time': self.collection_time,
            'process': self.process
        }

    def _collect_impl(self, run_context):
        tool_manager = SessionGlobals.get_tool_availability_manager()
        if not self.preflight_checks():
            tool_manager.set_available(self.tool_name, self.tool_manager_output.error_message)
            return CollectorResult.Failure()

        if self.tool_manager_output.error_message is not None:
            status = CollectorResult.Failure(
                self.tool_manager_output.error_message, _LOGGER, self.tool_manager_output.log_level)
        else:
            self.promote_state(Collector.State.COLLECTING, run_context.state_change_observers)
            collect_fun = self._collect_linux if IS_LINUX else self._collect_windows
            status = collect_fun(run_context.output_dir, run_context.suffix)
        tool_worked = status.isSuccess() or self.get_state() == Collector.State.ABORTING
        tool_manager.set_available(
            self.tool_name, True if tool_worked else self.tool_manager_output.error_message)
        return status

    # invokes procmon tool to trace all the processes running on particular user's machine/ instance.
    def _collect_windows(self, output_dir, suffix):
        _LOGGER.info('Started procmon execution: with output_dir=%s suffix=%s', output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        # launch procmon subprocess, detached.
        fname = os.path.join(output_dir, 'splunk_' + str(self.pid) + suffix)
        command = [self.tool_manager_output.toolpath]
        if output_dir:
            command += ['/BackingFile', fname +'.pml']
        command += ['/NoFilter', '/Profiling', '/minimized', '/quiet',
                    '/AcceptEula', '/Runtime', str(self.collection_time)]
        _LOGGER.debug("Running command=`%s`", ' '.join(command))

        with open(os.devnull, 'w') as output, open(fname + ".err", 'a+') as error:
            try:
                result = self.run(command, output, error, poll_period=0.1)
            except EnvironmentError as e:
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name) +
                                                ', please confirm you have the ' + str(self.tool_name) + ' package ' +
                                                'installed in your system and that the ' + str(self.tool_name) +
                                                ' command is available and is in your PATH.', _LOGGER)
            except Exception as e: # pylint: disable=broad-except
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name), _LOGGER)

            self._zip_pml(output_dir, suffix)

            return result

    def _zip_pml(self, output_dir, suffix):
        try:
            # note: procmon breaks up large files into multiple files -- just like log rolling
            # so for final collection, we need to zip up all files in the subdir
            listing = glob.glob(os.path.join(output_dir, '*.pml'))

            # Nota Bene: on a fairly loaded system, empirical evidence shows about
            # 500K per second of compressed .pml files.
            zfile = os.path.join(output_dir, "system_call_trace_" + str(self.pid) +  suffix + '.zip')
            _LOGGER.info('Zipping generated data file=%s', zfile)
            with ZipFile(zfile, 'w', ZIP_DEFLATED, allowZip64=True) as f:
                for pml in listing:
                    f.write(pml, os.path.basename(pml))
                    SystemCallTrace.remove_file(pml)

        except Exception as e: # pylint: disable=broad-except
            _LOGGER.exception('Exception while archiving Process Monitor log files', exc_info=e)

    @staticmethod
    @retry(OSError, tries=6, delay=0.5, logger=_LOGGER)
    def remove_file(filepath):
        os.remove(filepath)

    def cleanup(self, **kwargs):
        self._zip_pml(kwargs['output_directory'], kwargs['suffix'])

    # invokes strace utility to collect system call trace information for particular process.
    def _collect_linux(self, output_dir, suffix):
        _LOGGER.info('Started strace execution: with process=%s output_dir=%s suffix=%s',
                     str(self.process), output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        # TODO: -y only works in newer versions of strace (version greater or equal to 4.7)
        command = [self.tool_manager_output.toolpath, '-ttt',
                    '-T', '-f', '-x', '-s0', '-p', str(self.pid)]

        fname = os.path.join(output_dir, 'strace_' + str(self.pid) + suffix)
        if output_dir:
            command += ['-o', fname]

        with open(os.devnull, 'w') as output, open(fname + ".err", 'a+') as error:
            try:
                result = self.run(command, output, error, poll_period=0.1)
            except EnvironmentError as e:
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name) +
                                                ', please confirm you have the ' + str(self.tool_name) + ' package ' +
                                                'installed in your system and that the ' + str(self.tool_name) +
                                                ' command is available --  path=' + os.getenv('PATH'), _LOGGER)
            except Exception as e: # pylint: disable=broad-except
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name), _LOGGER)

        return result

    def preflight_checks(self):
        return self._check_process() and self._check_access()

    def _check_process(self):
        best_match = SessionGlobals.get_process_lister().get_best_running_match(self.process)
        if best_match:
            self.process=best_match
            self.pid=best_match.get_pid()
            return True
        _LOGGER.error("Can't read data for process=%s : process not running", str(self.process))
        return False

    def _check_access(self):
        if IS_LINUX:
            if not os.access('/proc/' + str(self.pid), os.R_OK | os.X_OK):
                _LOGGER.error("Can't read data for process=%s from path '/proc/%s': insufficient permissions",
                                str(self.process), str(self.pid))
                return False
        return True


Serializable.register(SystemCallTrace)
