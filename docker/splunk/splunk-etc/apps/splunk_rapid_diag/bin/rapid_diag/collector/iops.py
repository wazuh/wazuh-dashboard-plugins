# python imports
from __future__ import print_function, absolute_import
import os
import sys
import threading
import tempfile
import shutil
import time
from subprocess import CalledProcessError

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
from rapid_diag.collector.resource import Resource
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.tools_collector import ToolsCollector
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.collector.tool_manager import ToolAvailabilityManager
from rapid_diag.collector.performance_counter import PerformanceCounterStarted
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals

_LOGGER = log.setup_logging("iops")
IS_LINUX = sys.platform.startswith('linux')

class IOPS(ToolsCollector):
    """ RapidDiag collector to gather I/O performance statistics.
    note: In Linux, `iostat` tool collects snapshot of the data,
    so it ignores the collection time.

    Parameters
    -------
    collection_time : float
        For windows, it collects the perfmon logs for this specific time, for Linux, it is getting ignored.

    Raises
    ------
    ValueError
        JSON of the collector doesn't have `collection_time` field.
    """
    def __init__(self, collection_time : float, state : Collector.State = Collector.State.WAITING):
        ToolsCollector.__init__(self, collection_time=collection_time, valid_return_code=[0, None])
        self.tool_name = self.get_tool_name()
        self.tool_manager_output = ToolAvailabilityManager.find(self.tool_name)
        self.state = state

    @staticmethod
    def get_tool_name():
        return "iostat" if IS_LINUX else "logman.exe"

    @staticmethod
    def get_tool_arguments():
        return {'collection_time'}

    @staticmethod
    def get_tool_command(**args):
        assert frozenset(args.keys()) <= IOPS.get_tool_arguments()
        if IS_LINUX:
            return [ToolAvailabilityManager.find(IOPS.get_tool_name()).toolpath, '-x', '1', str(args['collection_time'])]
        return ["Perfmon"]

    @staticmethod
    def tool_missing():
        utility_name = IOPS.get_tool_name()
        tool_manager = SessionGlobals.get_tool_availability_manager()
        is_avail = tool_manager.is_available(utility_name)
        if is_avail:
            return None

        temp_dir = tempfile.mkdtemp()
        try:
            dummy_obj = IOPS(2)
            dummy_obj.collect(Collector.RunContext('localhost', temp_dir, '', None))
            message = tool_manager.get_tool_message(utility_name)
            message = None if message == True else message # pylint: disable=singleton-comparison
        finally:
            shutil.rmtree(temp_dir, True)
        return message

    def get_type(self):
        return Collector.Type.CONTINUOUS

    def get_required_resources(self):
        if not IS_LINUX:
            return [Resource('logman')]
        return [Resource('iostat')]

    def __repr__(self):
        return "IOPS(Collection Time : %r )" % (self.collection_time)

    def _get_json(self):
        return {
            'collection_time': self.collection_time,
            'state': self.state.name
        }

    @staticmethod
    def validate_json(obj):
        data_types = {"collection_time": (float, int)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

        value_range = {"collection_time": [10, Collector.MAX_TIME]}
        for field in list(filter(lambda x: x in obj.keys(), value_range.keys())):
            Serializable.check_value_in_range(obj[field], value_range[field], field)

    @staticmethod
    def from_json_obj(obj):
        ret = IOPS(obj['collection_time'], Collector.State[obj.get("state", Collector.State.WAITING.name)])
        ret.set_result(obj.get("result", None))
        return ret

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
        """Collects I/O statistics in Windows for selected time.
        `perfmon.exe` and `logman.exe` are required to run this collection.
        logman generates the `.csv` files in the output directory of the task.

        Parameters
        ----------
        output_dir : string
            defaults to $SPLUNK_HOME/var/run/splunk/splunk_rapid_diag.
            Could be updated by $SPLUNK_RAPID_DIAG/default/rapid_diag.conf.
        suffix : string
            defaults to timestamp in UTC format for identifying tasks
            e.g. 2019-05-31T11h53m15s571000ms

        Returns
        -------
        CollectorResult
            CollectorResult.Success() if successful
            OR CollectorResult.Failure() if failure
            OR CollectorResult.Exception() otherwise
        """
        try:
            _LOGGER.info('Starting IOPS collector output_dir=%s suffix=%s', output_dir, suffix)
            _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
            _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

            with PerformanceCounterStarted(output_dir, suffix):
                time.sleep(self.collection_time)

            return CollectorResult.Success('perfmon execution completed', _LOGGER)
        except EnvironmentError as e:
            return CollectorResult.Exception(e, 'Error collecting IO statistics, please ' +
                                             'confirm you have the "logman" tool '+
                                             'available in your system output_dir=' +
                                             output_dir + ' suffix=' + suffix, _LOGGER)
        except CalledProcessError as cpe:
            return CollectorResult.Failure("Exception while running " + str(cpe.cmd) +
                    ". Process exits with return code: " + str(cpe.returncode) + " output:" + str(cpe.output), _LOGGER)
        except Exception as e: # pylint: disable=broad-except
            return CollectorResult.Exception(e, "Exception in _collect_windows " + str(e), _LOGGER)

    def _collect_linux(self, output_dir, suffix):
        """Collects I/O statistics in Linux.
        `iostat` tool from `sysstat` package is required to run this collection.
        iostat generates `.out` files to output snapshots of I/O statistics.

        Parameters
        ----------
        output_dir : string
            defaults to $SPLUNK_HOME/var/run/splunk/splunk_rapid_diag.
            Could be updated by $SPLUNK_RAPID_DIAG/default/rapid_diag.conf.
        suffix : string
            defaults to timestamp in UTC format for identifying tasks
            e.g. 2019-05-31T11h53m15s571000ms

        Returns
        -------
        CollectorResult
            CollectorResult.Success() if successful
            OR CollectorResult.Failure() if failure
            OR CollectorResult.Exception() otherwise
        """
        _LOGGER.info('Starting IOPS collector output_dir=%s suffix=%s', output_dir, suffix)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        fname = os.path.join(output_dir, 'iops' + suffix)
        args = {'collection_time': str(self.collection_time)}
        proc_call = self.get_tool_command(**args)
        _LOGGER.debug('Collecting %s into %s with suffix %s', ' '.join(proc_call), output_dir, suffix)

        with open(fname + ".out", "a+") as output, open(fname + ".err", "a+") as error:
            try:
                result = self.run(proc_call, output, error, poll_period=1)
            except EnvironmentError as e:
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name) +
                                                ', please confirm you have the ' + str(self.tool_name) + ' package ' +
                                                'installed on your system and in the PATH environment of ' +
                                                'the splunk service account.', _LOGGER)
            except Exception as e: # pylint: disable=broad-except
                return CollectorResult.Exception(e, 'Error collecting ' + str(self.tool_name), _LOGGER)

        return result


    def cleanup(self, **kwargs):
        PerformanceCounterStarted(kwargs["output_directory"], kwargs["suffix"]).remove_counter()

Serializable.register(IOPS)
