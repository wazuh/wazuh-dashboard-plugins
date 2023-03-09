# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import absolute_import
import os
import json
import time
import datetime
import tarfile
import math
import sys
import signal
import shutil
import hashlib
import errno
import threading
from enum import Enum
from types import FrameType, TracebackType
from typing import Dict, Any, Optional, Type, List, Tuple

# local imports
import filelock
from splunklib import six
import logger_manager as log
from rapid_diag.task_repr_generator import TaskReprGenerator
from rapid_diag.serializable import Serializable, JsonObject
from rapid_diag.process_abstraction import Process
from rapid_diag.util import build_rapid_diag_timestamp, str_to_bytes
from rapid_diag.conf_util import RapidDiagConf
from rapid_diag.collector.collector import Collector, CollectorStateObserver,StateChangeObserver, CollectorList
# wildcards needed for serialization of anything new added to collectors
from rapid_diag.collector import * # pylint: disable=wildcard-import
from rapid_diag.collector.trigger import * # pylint: disable=wildcard-import
from rapid_diag.collector import diag
from rapid_diag.collector.threadpool import ThreadPool
from rapid_diag.collector.trigger.trigger import Trigger
from rapid_diag.collector.tools_collector import ToolsCollector
from rapid_diag.session_globals import SessionGlobals
from rapid_diag.collector.collector_result import AggregatedCollectorResult, CollectorResult
from rapid_diag.process_abstraction import ProcessLister, ProcessMatch

_LOGGER = log.setup_logging("task")

DEFAULT_OUTPUT_ROOT = RapidDiagConf.get_general_outputpath()


class CollectorAborter:
    SIGNALS_HANDLED = [signal.SIGINT, signal.SIGTERM]
    SIGNALS_IGNORED = []
    if sys.platform.startswith("linux"):
        SIGNALS_HANDLED.append(signal.SIGALRM)
        SIGNALS_IGNORED.append(signal.SIGHUP)

    def __init__(self, collectors : CollectorList) -> None:
        self.handlers  : Dict[int, Any] = {}
        self.collectors = collectors

    @staticmethod
    def __recursively_promote_collector_status(collectors : CollectorList) -> None:
        for collector in collectors:
            if collector.__module__.startswith('rapid_diag.collector'):
                collector.promote_state(Collector.State.ABORTING)
                if 'collectors' in collector.__dict__.keys():
                    CollectorAborter.__recursively_promote_collector_status(collector.collectors)

    def handler(self, signum : int, _ : FrameType) -> None:
        _LOGGER.debug("Handling signal: %s", str(signum))
        CollectorAborter.__recursively_promote_collector_status(self.collectors)

    def __enter__(self) -> None:
        for sig in self.__class__.SIGNALS_HANDLED + self.__class__.SIGNALS_IGNORED:
            self.handlers[sig] = signal.getsignal(sig)
        for sig in self.__class__.SIGNALS_HANDLED:
            signal.signal(sig, self.handler)
        for sig in self.__class__.SIGNALS_IGNORED:
            signal.signal(sig, signal.SIG_IGN)

    def __exit__(self, _exc_type : Optional[Type[BaseException]],
                 _exc_value : Optional[BaseException],
                 _traceback : Optional[TracebackType]) -> None:
        for sig, handler in self.handlers.items():
            signal.signal(sig, handler)


class RunInfoStateChangeObserver(StateChangeObserver):
    def __init__(self, run_info : 'Task.RunInfo') -> None:
        StateChangeObserver.__init__(self)
        self.run_info = run_info

    def __call__(self, collector : Collector, prev_state : Collector.State, new_state : Collector.State) -> None:
        if new_state == Collector.State.STARTED:
            if isinstance(collector, Trigger):
                self.run_info.promote_state_to(Task.RunInfo.State.MONITORING)
            else:
                self.run_info.promote_state_to(Task.RunInfo.State.COLLECTING)


def _create_dirs_log_unless_exists(path : str) -> None:
    if not os.path.exists(path):
        try:
            os.makedirs(path)
        except FileExistsError:
            pass
        except EnvironmentError as e:
            if e.errno == errno.EACCES:
                _LOGGER.exception('Permission denied creating directory="%s": Please check the splunk user '
                                  'permissions.', path, exc_info=e)
            else:
                _LOGGER.exception('Error creating directory="%s" : %s', path, str(e), exc_info=e)


class RdLock:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.lock_holder : Optional[int] = None

    def assert_locked(self) -> None:
        assert self.lock_holder == threading.get_ident()

    def acquire(self, blocking : bool = True, timeout : float = -1) -> None:
        my_id = threading.get_ident()
        assert self.lock_holder != my_id
        self.lock.acquire(blocking, timeout) # pylint: disable=consider-using-with
        assert self.lock_holder is None
        self.lock_holder = my_id

    def __enter__(self) -> None:
        return self.acquire()

    def __exit__(self, _exc_type : Optional[Type[BaseException]],
                 _exc_value : Optional[BaseException],
                 _traceback : Optional[TracebackType]) -> None:
        return self.release()

    def release(self) -> None:
        self.assert_locked()
        self.lock_holder = None
        self.lock.release()


class Task(Serializable):
    """
    RapidDiag task class to start particular collector
    """

    RD_LEGACY_PACKAGE_FILE_EXTENSION = '.tar.gz'
    RD_PACKAGE_FILE_EXTENSION = '.tgz'
    RD_TASK_DIR_PREFIX = 'rd_'
    SPLUNK_DIAG_COLLECTOR_NAME = 'splunkdiag'
    def __init__(self, name : str, description : str, collectors : List[Collector], host : str, task_id : str) -> None:
        Serializable.__init__(self)
        self.name = name
        self.description = description
        self.collectors = CollectorList(collectors)
        self.host = host
        self.task_id = task_id

    def run(self, task_handler : Any, session_token : str, start_time : float) -> Optional['RunInfo']: # pylint: disable=too-many-locals
        '''
        Run separate thread/process to start the particular collector
        '''
        _LOGGER.debug("Collectors: %s", str(self.collectors))
        if not self.collectors:
            _LOGGER.info('Task execution result: task_id="%s" name="%s" host="%s" status="%s" message="%s"',
                          self.task_id, self.name, self.host, Task.RunInfo.get_status_strings(Task.RunInfo.State.FAILURE),
                          "Invalid data collection task: no collectors")
            return None

        process = ProcessLister.build_process_from_pid(os.getpid())

        run_info = Task.RunInfo(self, process, start_time=start_time)
        run_info.start(start_time)
        run_info.save()
        output_dir = run_info.get_output_dir()
        run_context = Collector.RunContext(run_info.task.host, output_dir, '', session_token,
                                          [RunInfoStateChangeObserver(run_info)], task_handler)
        pool = SessionGlobals.get_threadpool()
        tokens = []
        diag_job = None

        with CollectorAborter(self.collectors):
            for job in self.collectors:
                if isinstance(job, diag.Diag):
                    diag_job = job
                else:
                    try:
                        tokens.append(self.start_collection(pool, job, run_context))
                    except Exception as e: # pylint: disable=broad-except
                        _LOGGER.exception('Exception while collecting data from %s', job.__class__.__name__)

            for token in tokens:
                token.wait()

            if diag_job:
                tokens.append(self.start_collection(pool, diag_job, run_context))
                tokens[-1].wait()

        run_info.start_archival()

        result = AggregatedCollectorResult()
        for token in tokens:
            result.add_result(token.get_result())

        message = result.get_status_string()
        result_status = result.status

        try:
            run_info.archive()
        except Exception as e: # pylint: disable=broad-except
            result.add_result(CollectorResult.Exception(e,
                              'Exception while archiving files from output_dir=' + output_dir, _LOGGER))
            message = result.get_status_string()

        # set task status on task completion
        run_info.finish(message, Task.RunInfo.COLLECTOR_RESULT_TO_STATUS[result_status])
        _LOGGER.info('Task execution result: task_id="%s" name="%s" host="%s" status="%s" message="%s"',
                      self.task_id, self.name, self.host,
                      Task.RunInfo.get_status_strings(run_info.status), message)
        return run_info

    def start_collection(self, pool : ThreadPool, job : Collector, run_context : Collector.RunContext) -> ThreadPool.Token:
        cur_run_context = run_context.clone()
        cur_run_context.suffix = '_' + build_rapid_diag_timestamp()
        return pool.add_task(job.collect, cur_run_context)

    def __repr__(self) -> str:
        return repr(TaskReprGenerator(self))

    def get_collector_tool_names(self) -> List[str]:
        tool_names = set()
        for collector in self.collectors.flatten():
            if isinstance(collector, ToolsCollector):
                tool_names.add(collector.get_tool_name())
            elif isinstance(collector, diag.Diag):
                tool_names.add(self.SPLUNK_DIAG_COLLECTOR_NAME)
        return sorted(tool_names)

    def to_json_obj(self) -> JsonObject:
        return {'name': self.name,
                'description': self.description,
                'collectors': self.collectors,
                'collector_tool_names': self.get_collector_tool_names(),
                'host': self.host,
                'task_id': self.task_id}

    @staticmethod
    def validate_json(obj : JsonObject) -> None:
        data_types = {"name": (six.text_type,),
                      "description": (six.text_type, type(None)),
                      "collectors": (list,),
                      "task_id": (six.text_type, type(None))}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

        value_range = {"name": [1., 256.], "description": [0., 8192.]}
        for field in list(filter(lambda x: x in obj.keys(), value_range.keys())):
            Serializable.check_value_in_range(
                len(obj[field].strip()), value_range[field], field)

        string_value = ["name"]
        for field in list(filter(lambda x: x in obj.keys(), string_value)):
            Serializable.check_string_value(obj[field], field)

        if not 'task_id' in obj.keys() or not obj["task_id"].strip():
            raise ValueError("task_id : cannot be empty.")

        if 'collectors' not in obj.keys() or not obj['collectors']:
            raise Exception("Collector list can not be empty.")

    @staticmethod
    def from_json_obj(obj : JsonObject) -> Serializable:
        return Task(obj['name'].strip(),
                    obj.get('description', '').strip(),
                    obj['collectors'],
                    obj.get('host', ''),
                    obj.get('task_id', ''))

    def get_json_path(self, output_dir : str) -> str:
        return os.path.join(output_dir, self.name + '.json')

    def save(self, output_dir : str) -> bool:
        '''
        Write the json object of task in particular TASK_NAME.json file
        :return: boolean value if task gets successfully written or not
        '''
        fname = self.get_json_path(output_dir)
        try:
            _create_dirs_log_unless_exists(output_dir) # pylint: disable=protected-access
            with open(fname, 'w+') as f:
                json.dump(self, f, indent=4, default=Serializable.json_encode)
            return True
        except filelock.Timeout as flt:
            _LOGGER.error("Error saving task to %s : %s", str(fname), str(flt))
        except (IOError, OSError) as e:
            if e.errno == errno.EACCES:
                _LOGGER.exception(
                    "Permission denied: Please check the application's owner and/or permissions."
                    " For more information check the Troubleshooting section on the Help page.")
                return True
            _LOGGER.exception('Error writing task to %s : %s', str(fname), str(e))
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.exception('Error writing task to %s : %s', str(fname), str(e))

        return False

    class RunInfo(Serializable, CollectorStateObserver): # pylint: disable=too-many-public-methods
        """ Runtime information about a Task.
        The data about the task is kept in a directory in the "running" area (get_running_output_dir()) while it's prone
        to being changed, and it gets moved into a read-only area (get_finished_output_dir()) once collection is done.
        We use file locks to prevent races while in the "running" area. In a happy scenario that'd be a waste, each
        task is executed by a single process and there is no need to lock anything. However, if the process running the
        task dies, other processes can come and try to clean-up leftovers, and that's where we _really_ need an IPC
        device.
        For that reason, operations which are expected to be only used by the process running the task are protected
        with a simple threading.Lock(), and anything to do with cleaning up requires a filelock.FileLock.
        """

        class State(Enum):
            NONE = 0
            MONITORING = 1
            COLLECTING = 2
            ARCHIVING = 3
            ABORTING = 4
            FINISHED = 5
            SUCCESS = 6
            PARTIAL_SUCCESS = 7
            FAILURE = 8
            ABORTED = 9

        STATUS_STRINGS = {
            'None': State.NONE,
            'Monitoring': State.MONITORING,
            'Collecting': State.COLLECTING,
            'Archiving Results': State.ARCHIVING,
            'Aborting': State.ABORTING,
            'Finished': State.FINISHED,
            'Success': State.SUCCESS,
            'Partial Success': State.PARTIAL_SUCCESS,
            'Failure': State.FAILURE,
            'Aborted': State.ABORTED
        }
        COLLECTOR_RESULT_TO_STATUS = {
            CollectorResult.Status.SUCCESS: State.SUCCESS,
            CollectorResult.Status.PARTIAL_SUCCESS: State.PARTIAL_SUCCESS,
            CollectorResult.Status.FAILURE: State.FAILURE,
            CollectorResult.Status.ABORTED: State.ABORTED
        }
        FILE_NAME = 'task.json'

        def __init__(self, task : 'Task',
                process : Process,
                status : Optional['Task.RunInfo.State'] = None,
                start_time : Optional[float] = None,
                finish_time  : Optional[float] = None,
                output_directory : Optional[str] = None,
                result : Optional[str] = None):
            Serializable.__init__(self)
            CollectorStateObserver.__init__(self)
            self.task = task
            self.process = process
            self.status = Task.RunInfo.State.NONE if status is None else status
            self.start_time = start_time
            self.finish_time = finish_time
            self.result = result
            self.status_lock = RdLock()
            self.output_directory = None
            if self.status.value >= Task.RunInfo.State.FINISHED.value and output_directory:
                self.output_directory = os.path.normpath(output_directory)
            for collector in self.task.collectors.flatten():
                collector.register_observer(self)

        def get_filename_prefix(self) -> str:
            assert self.start_time
            timestamp = build_rapid_diag_timestamp(datetime.datetime.utcfromtimestamp(self.start_time))
            return timestamp

        @staticmethod
        def _get_run_info_pieces_from_run_info_path(json_path : str) -> Tuple[str, str]:
            """Convert output from get_run_info_path() into get_lock_path()
            """
            path_without_json = os.path.dirname(json_path)
            task_root, task_dir = os.path.split(path_without_json)
            task_root_root, task_root_base = os.path.split(task_root)
            if task_root_base == 'running':
                task_root = task_root_root
            return task_root, task_dir

        @staticmethod
        def _get_run_info_path_alternatives(json_path : str) -> List[str]:
            """Return running and finished task.json paths given one of them. This will fail to give the correct
            finished path if it's been overridden (ie, self.output_directory has a non-default value) and the task
            is still running.
            """
            task_root, task_dir = Task.RunInfo._get_run_info_pieces_from_run_info_path(json_path) # pylint: disable=protected-access
            finished_path = json_path
            if task_root.startswith(DEFAULT_OUTPUT_ROOT):
                finished_path = os.path.join(task_root, task_dir, Task.RunInfo.FILE_NAME)
            return [
                os.path.join(DEFAULT_OUTPUT_ROOT, 'running', task_dir, Task.RunInfo.FILE_NAME),
                finished_path
            ]

        def is_running(self) -> bool:
            with self.status_lock:
                return bool(self.status.value > Task.RunInfo.State.NONE.value and \
                            self.status.value < Task.RunInfo.State.ARCHIVING.value)

        def _is_finished_locked(self) -> bool:
            self.status_lock.assert_locked()
            return bool(self.status.value >= Task.RunInfo.State.FINISHED.value)

        def is_finished(self) -> bool:
            with self.status_lock:
                return self._is_finished_locked()

        def promote_state_to(self, state : 'Task.RunInfo.State') -> None:
            with self.status_lock:
                if self.status.value > state.value:
                    return
                assert self.status.value <= Task.RunInfo.State.FINISHED.value or \
                       state.value >= self.status.value
                run_info_path = self._get_run_info_path_locked()
                self.status = state
            try:
                staging_path = self._save_staging(run_info_path)
            except FileNotFoundError as e:
                # swallow file not found errors -- the whole point of staging is to allow concurrent updates, we're
                # OK with the task being completed in parallel with it
                _LOGGER.debug('Unable to _save_staging for run_info_path="%s"', run_info_path, exc_info=e)
                return
            try:
                with self.status_lock:
                    if self.status == state:
                        self._save_commit(run_info_path, staging_path)
            finally:
                try:
                    os.unlink(staging_path)
                except EnvironmentError:
                    pass

        @staticmethod
        def get_hashed_string(name : str) -> str:
            # Use 12 characters from the generated hexstring
            return hashlib.sha256(str_to_bytes(name)).hexdigest()[:12]

        def get_running_output_dir(self) -> str:
            return os.path.join(DEFAULT_OUTPUT_ROOT, 'running',
                                Task.RD_TASK_DIR_PREFIX + Task.RunInfo.get_hashed_string(self.task.name) + "_" +
                                self.get_filename_prefix())

        def get_finished_output_dir(self) -> str:
            if not self.output_directory:
                self.output_directory = os.path.join(DEFAULT_OUTPUT_ROOT,
                                    Task.RD_TASK_DIR_PREFIX + Task.RunInfo.get_hashed_string(self.task.name) + "_" +
                                    self.get_filename_prefix())
            return self.output_directory

        def _get_output_dir_locked(self) -> str:
            if self._is_finished_locked():
                return self.get_finished_output_dir()
            return self.get_running_output_dir()

        def get_output_dir(self) -> str:
            with self.status_lock:
                return self._get_output_dir_locked()

        @staticmethod
        def get_status_strings(state : 'Task.RunInfo.State') -> str:
            state_list = [key for key, value in Task.RunInfo.STATUS_STRINGS.items() if value == state]
            if len(state_list) != 1:
                _LOGGER.warning("Invalid state=%s. Returning initial state.", str(state))
                return Task.RunInfo.get_status_strings(Task.RunInfo.State.NONE)
            return state_list[0]

        def get_run_info_running_path(self) -> str:
            return os.path.join(self.get_running_output_dir(), Task.RunInfo.FILE_NAME)

        def get_run_info_finished_path(self) -> str:
            return os.path.join(self.get_finished_output_dir(), Task.RunInfo.FILE_NAME)

        def _get_run_info_path_locked(self) -> str:
            return os.path.join(self._get_output_dir_locked(), Task.RunInfo.FILE_NAME)

        def get_run_info_path(self) -> str:
            with self.status_lock:
                return self._get_run_info_path_locked()

        @staticmethod
        def _create_dir(path : str) -> None:
            try:
                os.makedirs(path)
            except FileExistsError:
                pass
            except (IOError, OSError) as e:
                if e.errno == errno.EACCES:
                    _LOGGER.exception('Permission denied creating directory="%s", please check the '
                                      "application's owner and/or permissions. For more information check the "
                                      "Troubleshooting section on the Help page.", path,
                                      exc_info=e)
                else:
                    _LOGGER.exception('Error creating directory="%s" : %s', path, str(e), exc_info=e)
                raise e

        def start(self, start_time : float) -> None:
            with self.status_lock:
                assert self.status == Task.RunInfo.State.NONE
                self.start_time= start_time
                self.finish_time = None
                # clear out the output_dir. We are starting the collection NOW
                # so we need new output directory (if we're starting again)
                self.output_directory = None
                running_dir = self.get_running_output_dir()
                finished_dir = self.get_finished_output_dir()
                assert not os.path.exists(running_dir) and not os.path.exists(finished_dir)
                Task.RunInfo._create_dir(running_dir) # pylint: disable=protected-access

        def finish(self, result : str, state : 'Task.RunInfo.State') -> None:
            self.finish_time = time.time()
            if self.start_time is None:
                self.start_time = self.finish_time
            self.result = result
            self.promote_state_to(state)
            _LOGGER.debug('Finishing run_info="%s" result="%s" state="%s"', self.get_output_dir(), str(result), str(state))
            try:
                self._move_to_finished()
            except FileNotFoundError:
                # swallow file not found errors -- we're operating without holding a lock, we're cool with the rug being
                # pulled from under our feet
                pass


        def start_archival(self) -> None:
            # TODO advertise presence of errors somehow in the status
            self.finish_time = time.time()
            self.promote_state_to(Task.RunInfo.State.ARCHIVING)

        def archive(self) -> None: # pylint: disable=too-many-locals
            assert not self.is_finished()
            # TODO rewrite this, it's far too complex for what it does
            tarball_name = self.get_output_dir() + Task.RD_PACKAGE_FILE_EXTENSION
            src_dir = self.get_running_output_dir()
            src_dir_len = len(src_dir)
            src_drive_len = len(os.path.splitdrive(src_dir)[0])
            base = os.path.basename(src_dir)
            runinfo_path = self.get_run_info_path()
            with tarfile.open(tarball_name, 'w:gz') as tar:
                src_dir, dirs, files = next(os.walk(src_dir))
                for file in files:
                    full_path = os.path.join(src_dir, file)
                    if file.startswith('diag_') and file.endswith('.tar.gz'):
                        with tarfile.open(full_path, 'r:gz') as src_tar:
                            try:
                                temp_root = src_dir.replace("\\", "/")
                                for member in src_tar.getmembers():  # drive + root separator
                                    if member.name.startswith(temp_root[:src_drive_len + 1]):
                                        member.name = member.name[src_drive_len + 1:]
                                    if member.name.startswith(temp_root[src_drive_len + 1:]):
                                        member.name = member.name[src_dir_len - src_drive_len:]
                                    else:
                                        continue
                                    member.name = os.path.join(base, member.name)
                                    tar.addfile(member, src_tar.extractfile(member.name))
                            except IOError:
                                tar.add(full_path, arcname=os.path.join(file.split('.tar.gz')[0], file), recursive=False)
                    else:
                        if not file.endswith('.pml'):
                            tar.add(full_path, arcname=os.path.join(base, file))

                    if full_path not in [runinfo_path]:
                        os.remove(full_path)

                for path in dirs:
                    try:
                        tar.add(os.path.join(src_dir, path), arcname=os.path.join(base, path))
                    except (OSError, IOError):
                        pass

        def _move_to_finished(self) -> None:
            # once finished, move the task outside of the running directory
            source_dir = self.get_running_output_dir()
            dest_dir = self.get_finished_output_dir()
            collection_gz = source_dir + Task.RD_PACKAGE_FILE_EXTENSION
            try:
                _LOGGER.debug('Moving task results from="%s" to="%s"', source_dir, dest_dir)
                shutil.move(source_dir, dest_dir)
                # it's very serious not to have the running output directory, but the lack of the collection tgz may
                # happen with collections that failed to finish correctly -- we can log and move on
                if os.path.exists(collection_gz):
                    shutil.move(collection_gz, os.path.join(os.path.dirname(dest_dir), os.path.basename(collection_gz)))
                else:
                    _LOGGER.warning('Moving task results to finished directory, missing collection_gz="%s"',
                                    collection_gz)
            except OSError as e:
                log_func = _LOGGER.exception
                if e.errno == errno.ENOENT:
                    log_func = _LOGGER.debug
                log_func('Error moving task to finished state, source="%s" destination="%s" : %s',
                        source_dir, dest_dir, str(e), exc_info=e)
                raise e

        def remove(self) -> bool:
            path = self.get_running_output_dir()
            if os.path.exists(path):
                _LOGGER.error('Error attempting to remove task, running_output_dir="%s" exists -- aborting operation.',
                               path)
                return False
            path = self.get_finished_output_dir()
            _LOGGER.debug('Removing task path="%s"', path)
            shutil.rmtree(path, ignore_errors=True)
            return True

        def get_duration(self) -> Optional[float]:
            if self.start_time is None:
                return None
            finish_time = self.finish_time
            if finish_time is None:
                finish_time = time.time()
            return math.ceil(finish_time - self.start_time)

        def __repr__(self) -> str:
            with self.status_lock:
                return "RunInfo(Task: \n%r, Process: %r, Status: %r)" % (self.task, self.process, self.status)

        def to_json_obj(self) -> JsonObject:
            with self.status_lock:
                obj = {
                    'task': self.task,
                    'name': self.task.name,
                    'process': self.process,
                    'status': Task.RunInfo.get_status_strings(self.status)
                }
                if self.start_time is not None:
                    obj['created_at'] = self.start_time
                    obj['finished_output_directory'] = self.get_finished_output_dir()
                    out_dir = self._get_output_dir_locked()
                    obj['task_status'] = os.path.join(out_dir, Task.RunInfo.FILE_NAME)
                    # check for legacy 1.2 package
                    if os.path.basename(out_dir).startswith(Task.RD_TASK_DIR_PREFIX):
                        obj['output_file'] = out_dir + Task.RD_PACKAGE_FILE_EXTENSION
                    else:
                        obj['output_file'] = out_dir + Task.RD_LEGACY_PACKAGE_FILE_EXTENSION

                if self.finish_time is not None:
                    obj['completed_at'] = self.finish_time
                if self.result:
                    obj['result'] = self.result
                obj["duration"] = self.get_duration()
            return obj

        @staticmethod
        def validate_json(obj : JsonObject) -> None:
            data_types = {"task": (Task,), "status": (six.text_type,), "process": (ProcessMatch,)}
            for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
                Serializable.check_data_type(obj[field], data_types[field], field)
            value_range = {"created_at": [1000000000., 2000000000.], "completed_at": [1000000000., 2000000000.]}
            for field in list(filter(lambda x: x in obj.keys(), value_range.keys())):
                Serializable.check_value_in_range(obj[field], value_range[field], field)

        @staticmethod
        def from_json_obj(obj : JsonObject) -> Serializable:
            try:
                status_int = Task.RunInfo.STATUS_STRINGS[obj['status']]
            except KeyError as e:
                raise ValueError('Unexpected Task status=' + str(obj['status'])) from e

            output_dir = obj.get('finished_output_directory', None)
            if output_dir is None: # support for older versions
                output_dir = obj.get('output_directory', None)
            return Task.RunInfo(obj['task'], obj['process'], status_int, obj.get('created_at', None),
                                obj.get('completed_at', None), output_dir, obj.get('result', None))

        def _save_staging(self, run_info_path : str) -> str:
            staging_path = run_info_path + '.' + str(os.getpid()) + '.' + str(threading.get_ident())
            try:
                with open(staging_path, 'w+') as f:
                    json.dump(self, f, indent=4, default=Serializable.json_encode)
            except (IOError, OSError) as e:
                if e.errno == errno.EACCES:
                    _LOGGER.exception('Permission denied writing staging_path="%s" : Please check '
                                      'the splunk user permissions.', staging_path, exc_info=e)
                else:
                    log_func = _LOGGER.exception
                    if e.errno == errno.ENOENT:
                        log_func = _LOGGER.debug
                    log_func('Error writing staging_path="%s" : %s', staging_path, str(e), exc_info=e)
                raise e
            except Exception as e:
                _LOGGER.exception('Error writing staging_path="%s" : %s', staging_path, str(e), exc_info=e)
                raise e
            return staging_path

        def _save_commit(self, run_info_path : str, staging_path : str) -> None:
            os.rename(staging_path, run_info_path)

        def save(self, run_info_path : Optional[str] = None) -> None:
            if run_info_path is None:
                run_info_path = self.get_run_info_path()
            staging_path = self._save_staging(run_info_path)
            self._save_commit(run_info_path, staging_path)

        def reload(self) -> Optional[Serializable]:
            paths = [self.get_running_output_dir(), self.get_finished_output_dir()]
            for path in paths:
                json_path = os.path.join(path, Task.RunInfo.FILE_NAME)
                if not os.path.exists(json_path):
                    continue
                try:
                    with open(json_path) as f:
                        json_str = f.read()
                except FileNotFoundError:
                    continue
                try:
                    decoded : Serializable = json.loads(json_str, object_hook=Serializable.json_decode)
                    return decoded
                except (ValueError, TypeError, KeyError, NotImplementedError) as e:
                    _LOGGER.exception('Error attempting to load task run info from json_path="%s" : %s file_contents="%s"',
                                      json_path, str(e), json_str, exc_info=e)
                    raise e
            _LOGGER.error('Files not found while loading task run info from paths=%s', str(paths))
            return None

        @staticmethod
        def load(run_info_path : str) -> Optional['Task.RunInfo']:
            running_path, finished_path = Task.RunInfo._get_run_info_path_alternatives(run_info_path) # pylint: disable=protected-access
            run_info = Task.RunInfo._load_impl(running_path) # pylint: disable=protected-access
            if run_info is not None:
                return run_info
            return Task.RunInfo._load_impl(finished_path) # pylint: disable=protected-access

        @staticmethod
        def _load_impl(run_info_path : str) -> Optional[Serializable]:
            try:
                with open(run_info_path) as f:
                    json_str = f.read()
            except FileNotFoundError:
                return None
            except (IOError, OSError) as e:
                _LOGGER.debug('Error attempting to load task status from path="%s" : %s', run_info_path, str(e), exc_info=e)
                return None
            try:
                decoded : Serializable = json.loads(json_str, object_hook=Serializable.json_decode)
                return decoded
            except (ValueError, TypeError, KeyError, NotImplementedError) as e:
                _LOGGER.warning('Failed to load task status from path="%s" : %s full_json="%s"',
                                 run_info_path, str(e), json_str, exc_info=e)
            return None

        @staticmethod
        def _cleanup_flocked(run_info_path : str, state : 'Task.RunInfo.State', reason : Optional[str]) -> Optional[str]:
            run_info = Task.RunInfo._load_impl(run_info_path) # pylint: disable=protected-access
            # Hurray, we have run_info, somehow! Let's do it the right way.
            if run_info is not None:
                already_done = run_info.is_finished()
                _LOGGER.debug('Got request to clean-up run_info="%s" status=%s already_done=%s',
                               run_info_path, Task.RunInfo.get_status_strings(run_info.status), str(already_done))
                # we finish() even if it's already_done, because the run_info is still in a running directory, meaning
                # the owning process may have died just as it was finishing collection
                if reason is None:
                    reason = 'Failed to complete, finished during external cleanup'
                run_info.finish(reason, state)
                ret_path : str = run_info.get_run_info_path()
                return ret_path
            # Sad path, no legible runinfo. Let's just rename runinfo.json so it won't be read anymore, and move the
            # directory out of the way.
            _LOGGER.warning('Unable to load run_info="%s" will attempt to save corrupted json if '
                            'available and move all remaining data to final location.', run_info_path)
            if os.path.exists(run_info_path):
                corrupted_name = run_info_path + '.corrupted'
                try:
                    os.rename(run_info_path, run_info_path + '.corrupted')
                except OSError as e:
                    _LOGGER.exception('Failed to rename run_info_path="%s" to corrupted_name=%s : %s',
                                      run_info_path, corrupted_name, str(e), exc_info=e)
            try:
                running, finished = Task.RunInfo._get_run_info_path_alternatives(run_info_path) # pylint: disable=protected-access
                shutil.move(os.path.dirname(running), os.path.dirname(finished))
            except OSError as e:
                _LOGGER.exception('Failed to forcefully move run_info_path="%s" src="%s" dst="%s"  -- giving up: %s',
                                  run_info_path, running, finished, str(e), exc_info=e)
                return None
            return os.path.join(finished, Task.RunInfo.FILE_NAME)

        @staticmethod
        def cleanup(run_info_path : str,
                    state : 'Task.RunInfo.State',
                    reason : Optional[str] = None,
                    timeout : float = 0.01) -> bool:
            """Finish a Task.RunInfo that was left unfinished by the owning process, or at least move it out of the
            running tasks directory and mark its json as corrupted if it's unreadable.
            WARNING: Never call this on a task whose owning process is still alive, there is no inter-process race
            prevention for tasks whose owner is still alive.
            """
            assert 'running' in run_info_path
            lock_path = run_info_path + '.lock'
            finished_run_info_path = None
            # try to create lock, if the directory goes away it just means we don't need to clean up any longer
            try:
                flock = filelock.FileLock(lock_path)
                with flock.acquire(timeout):
                    finished_run_info_path = Task.RunInfo._cleanup_flocked(run_info_path, state, reason) # pylint: disable=protected-access
            except FileNotFoundError:
                return False
            except filelock.Timeout:
                return False
            finally:
                paths = [lock_path]
                if finished_run_info_path:
                    paths.append(finished_run_info_path + '.lock')
                # If we succeed, the lock file will now live in finished_lock_path
                # Otherwise, hopefully we'll have moved the dangling json out of the way and the lock file will no
                # longer be required. Whatever happens, we want no lock files after we finish.
                for path in paths:
                    try:
                        os.unlink(path)
                    except FileNotFoundError:
                        pass
            return finished_run_info_path is not None


Serializable.register(Task)
Serializable.register(Task.RunInfo)
