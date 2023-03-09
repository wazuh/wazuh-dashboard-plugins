# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import print_function, absolute_import
import os
import sys
import time
import json
import glob
import signal
import subprocess
import errno
import math
from datetime import datetime
from typing import Optional, List, Dict, Set

# local imports
import logger_manager as log
from rapid_diag.task import Task, DEFAULT_OUTPUT_ROOT
from rapid_diag.serializable import Serializable
from rapid_diag.serializable import JsonObject
from rapid_diag.util import build_rapid_diag_timestamp, remove_empty_directories, get_splunkhome_path, bytes_to_str
from rapid_diag.process_abstraction import ProcessLister, ProcessNotFound, InfoCsvError
from rapid_diag.detach_process import DetachProcess
from rapid_diag.collector.trigger.trigger import Trigger
from rapid_diag.collector.collector import CollectorList
from rapid_diag.collector.resource import Resource


# constants
_LOGGER = log.setup_logging("task_handler")
IS_LINUX = sys.platform.startswith('linux')
APP_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
TEMPLATE_TASK_PATH = os.path.join(APP_ROOT, "SampleTasks")
HISTORIC_TASK_PATH = os.path.join(APP_ROOT, "tasks")
# temporarily using python path instead of symlink so it works in servers missing the symlink
RAPIDDIAG_CLI_PATH = os.path.join(APP_ROOT, "bin", "cli", "__main__.py")
SPLUNK_BIN_PATH = get_splunkhome_path(["bin","splunk"])

class TaskHandler:
    RUNNING_DIR = 'running'
    """
    Task Handler for CRUD and list operations.
    """
    def __init__(self) -> None:
        self.task_script_dir = os.path.join(os.path.dirname(os.path.dirname(\
                               os.path.dirname(os.path.realpath(__file__)))), "tasks")

    @staticmethod
    def build_task_id(task_name : str, host_name : str, start_datetime : Optional[datetime] = None) -> str:
        task_id = task_name + '_' + host_name + '_' + build_rapid_diag_timestamp(start_datetime)
        return task_id[-250:]

    def create(self, task_conf : str) -> Optional[Task]:
        """
        This method creates task based on request from splunk rapid_diag UI.
        """
        task : Task = json.loads(task_conf, object_hook=Serializable.json_decode)
        for collector in task.collectors.flatten():
            collector.init_state()
        # TODO remove this, it does not belong here! Maybe it can live somewhere called Task.can_run().
        # check to based on task listing to block parallel runs of same collector(s)
        # not blocking in case of diag and search result collector
        if self.get_conflicting_resources(task.host, task.collectors):
            _LOGGER.info("A task with identical collector(s) is already running.")
            run_info = Task.RunInfo(task, ProcessLister.build_process_from_pid(os.getpid()))
            run_info.start(time.time())
            run_info.finish('Aborted, another task with conflicting collectors is already running', Task.RunInfo.State.ABORTED)
            return None

        try:
            if task.save(self.task_script_dir):
                return task
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.exception('Unable to create the task %s - %s', str(task_conf), str(e), exc_info=e)
        return None

    def run_detached(self, task : Task,
                        splunk_auth_token : str,
                        wait_time : int = 30,
                        poll_period : float = 0.2) -> Optional[Task.RunInfo] :
        task_json_path = os.path.abspath(task.get_json_path(self.task_script_dir))
        start_time = time.time()
        pid = DetachProcess.spawnv_detached_with_stdin(
            SPLUNK_BIN_PATH, [SPLUNK_BIN_PATH, 'cmd', RAPIDDIAG_CLI_PATH, '--token_auth', 'oneshot', 'run',
                              '--unixtime=' + format(start_time, '.7f'), task_json_path], splunk_auth_token + '\n')
        run_info = Task.RunInfo(task, ProcessLister.build_process_from_pid(pid), start_time=start_time)
        run_info_path = run_info.get_run_info_path()
        for i in range(int(math.ceil(wait_time/poll_period))):
            if i != 0:
                time.sleep(poll_period)
            # first check if child still alive, then check status. if we find it dead and then no status, it's hopeless.
            child_alive = True
            try:
                ProcessLister.build_process_from_pid(pid)
            except ProcessNotFound:
                child_alive = False
            except InfoCsvError as e:
                _LOGGER.exception("Error loading info: %s.", str(e), exc_info=e)
                break
            found = Task.RunInfo.load(run_info_path)
            if found is not None:
                return found
            if not child_alive:
                _LOGGER.error('Process child_pid=%u disappeared after time_seconds=%d', pid, i*poll_period)
                break
        # update run info so the start failure is reflected.
        run_info.finish('Failed to start up process', Task.RunInfo.State.FAILURE)
        _LOGGER.error(
            'Task execution has not started at path="%s" (exists=%s) in %us, aborting child_pid=%u',
            run_info_path, str(os.path.exists(run_info_path)), wait_time, pid)
        try:
            os.kill(pid, signal.SIGTERM)
        except OSError as e:
            _LOGGER.debug('Error attempting to terminate process in run_detached(): %s', str(e), exc_info=e)
        return None

    def delete(self, task_str : str) -> bool:
        run_info = json.loads(task_str, object_hook=Serializable.json_decode)
        # reload from disk -- we always want to do this, trusting the json we got could lead to injected failures
        fresh_run_info = TaskHandler._load_from_disk_or_cleanup(run_info,
                                                                'Unable to load task json while attempting to delete',
                                                                Task.RunInfo.State.FAILURE)
        _LOGGER.debug('Attempting to delete run_info="%s" fresh_object=%s', run_info.get_run_info_path(), str(fresh_run_info))
        # if something funny happened to the json and we couldn't reload it from disk, or it's dead, or finished...
        if fresh_run_info is None or TaskHandler._cleanup_if_dead(fresh_run_info, 'Cleaning up for deletion') or \
                fresh_run_info.is_finished():
            return bool(run_info.remove())
        return False

    @staticmethod
    def _load_from_disk_or_cleanup(run_info : Task.RunInfo, reason : str, state : Task.RunInfo.State) -> Optional[Task.RunInfo]:
        """ Reload a run_info from disk returning a fresh copy, or cleanup and return None if it's broken.
        """
        fresh_run_info = None
        try:
            fresh_run_info = run_info.reload()
        except ValueError:
            pass
        if fresh_run_info is None:
            TaskHandler._cleanup_if_dead(run_info, reason, state)
            return None
        return fresh_run_info

    @staticmethod
    def _cleanup_if_dead(run_info : Task.RunInfo,
                        reason : str,
                        state : Task.RunInfo.State = Task.RunInfo.State.FAILURE) -> bool:
        """ Look for run_info's process, clean it up and return True if it's dead, return False otherwise.
        """
        sysproc = None
        try:
            sysproc = ProcessLister.build_process_from_pid(run_info.process.get_pid())
        except (ProcessNotFound, InfoCsvError):
            pass

        if sysproc is not None and run_info.process.get_process_name() == sysproc.get_process_name() and \
           run_info.process.get_process_arguments() == sysproc.get_process_arguments():
            return False

        run_info_path = run_info.get_run_info_running_path()
        _LOGGER.debug('Cleaning up run_info="%s" pid=%u proc=%s sysproc=%s',run_info_path, run_info.process.get_pid(),
                      str(run_info.process), str(sysproc))
        if Task.RunInfo.cleanup(run_info_path, state, reason):
            for collector in run_info.task.collectors.flatten():
                collector.cleanup(output_directory=run_info.get_running_output_dir(),
                                  suffix='_' + build_rapid_diag_timestamp())
        return True


    @staticmethod
    def _kill_task(run_info : Task.RunInfo) -> bool: # pylint: disable=too-many-return-statements
        pid = run_info.process.get_pid()
        _LOGGER.info("Aborting the task with pid=%u", pid)
        try:
            if IS_LINUX:
                try:
                    os.kill(pid, signal.SIGINT)
                except OSError as e:
                    if e.errno == errno.ESRCH:
                        return True
                    _LOGGER.exception('Unable to abort the task with pid=%u: %s', pid, str(e), exc_info=e)
                    return False
                except Exception as e: # pylint: disable=broad-except
                    _LOGGER.exception('Unable to abort the task with pid=%u: %s', pid, str(e), exc_info=e)
                    return False
                return True

            # in case of windows we are force killing the task
            # force killing in windows kills the whole process tree
            # after force killing doing the necessary cleanup for system call trace and network packet collectors
            # zipping the generated pml files in case of procmon
            # running the `netsh trace stop` command in case of netsh, otherwise it won't startup next time

            # if diag is aborted, data generated for it will be zero kb(in case of windows only)
            with subprocess.Popen(['taskkill', '/F', '/T', '/PID', str(pid)], stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE) as process:
                _, err = process.communicate()  # returns bytes strings
                # if process does not exist, then 128 is the return code for it
                if process.poll() == 128:
                    _LOGGER.error('Unable to abort the task with pid=%u. No such process.', pid)
                    Task.RunInfo.cleanup(run_info.get_run_info_running_path(), Task.RunInfo.State.FAILURE,
                                         'Task process missing when attempting to abort')
                    return True

                # in case access is denied to kill the process or any other errors
                if err:
                    _LOGGER.error('Unable to abort the task with pid=%u.\nstderr=%s', pid, bytes_to_str(err))
                    return False

                Task.RunInfo.cleanup(run_info.get_run_info_running_path(), Task.RunInfo.State.ABORTED, 'Aborted by user')
                for collector in run_info.task.collectors.flatten():
                    collector.cleanup(output_directory=run_info.get_running_output_dir(),
                                      suffix='_' + build_rapid_diag_timestamp())
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.exception('Unable to abort the task with pid=%u', pid, exc_info=e)
            return False
        return True

    def abort(self, task_str : str) -> bool:
        """ Abort task described in task_str. Return True if the process is now aborting or finished, False otherwise.
        """
        run_info = json.loads(task_str, object_hook=Serializable.json_decode)
        if not run_info.is_running():
            return False
        fresh_run_info = TaskHandler._load_from_disk_or_cleanup(run_info,
                                                                'Unable to load task json while attempting to abort',
                                                                Task.RunInfo.State.FAILURE)
        if fresh_run_info is not None:
            run_info = fresh_run_info
        if not TaskHandler._cleanup_if_dead(run_info, 'Task process missing when attempting to abort'):
            TaskHandler._kill_task(run_info)
            return True
        return False

    def _cleanup(self, unfinished_tasks : List[Task.RunInfo]) -> List[Task.RunInfo]:
        valid_tasks = []
        for run_info in unfinished_tasks:
            fresh_run_info = TaskHandler._load_from_disk_or_cleanup(run_info, 'Unable to load task json during listing',
                                                                    Task.RunInfo.State.FAILURE)
            if fresh_run_info is None:
                continue
            run_info = fresh_run_info
            if TaskHandler._cleanup_if_dead(run_info, 'Task process missing when attempting to list'):
                continue
            valid_tasks.append(run_info)
        return valid_tasks

    def _get_tasks(self, host : Optional[str] = None, running_dir : bool = False) -> List[Task.RunInfo]:
        tasks = []
        if running_dir:
            tasks_to_clean = []
        for filename in glob.glob(os.path.join(DEFAULT_OUTPUT_ROOT,
                                        TaskHandler.RUNNING_DIR if running_dir else '', '*', '*.json')):
            run_info = Task.RunInfo.load(filename)
            if run_info is None:
                # ignore read failures
                continue
            if running_dir and run_info.task.host == host:
                tasks_to_clean.append(run_info)
            else:
                tasks.append(run_info)
        if running_dir:
            return tasks + self._cleanup(tasks_to_clean)

        _LOGGER.debug("Looking for RD 1.2 tasks")
        # Support for RD 1.2.0 tasks - match anything that does not start with 'r'
        # NOTE: we ignore running dir - if anything was left in a running state
        # that is bad on its own.
        for filename in glob.glob(os.path.join(DEFAULT_OUTPUT_ROOT, '*', '[!r]*', '*.json')):
            _LOGGER.debug("Loading old task %s", filename)
            run_info = Task.RunInfo.load(filename)
            if run_info is None:
                _LOGGER.warning("Loading old task %s failed.", filename)
                continue
            tasks.append(run_info)
        return tasks

    def list(self, host : str) -> List[Task]:
        """
        Method to list all collection tasks.
        """
        remove_empty_directories(os.path.join(DEFAULT_OUTPUT_ROOT, TaskHandler.RUNNING_DIR))

        unfinished_tasks = self._get_tasks(host, running_dir=True)
        finished_tasks = self._get_tasks()
        tasks = unfinished_tasks + finished_tasks
        for idx, task in enumerate(tasks):
            task_dict = json.loads(json.dumps(task, indent=4, default=Serializable.json_encode))
            tasks[idx] = task_dict
        return tasks

    @staticmethod
    def _get_static_tasks(path : str) -> List[JsonObject]:
        tasks = []
        for filename in glob.glob(os.path.join(path, "*.json")):
            # we're OK with users dumping run_info json files as well as regular tasks in these paths
            try:
                with open(filename, 'r') as task_file:
                    task_str = task_file.read()
                _ = json.loads(task_str, object_hook=Serializable.json_decode)
                task_dict = json.loads(task_str)

                if task_dict.get("task"):
                    task_dict = task_dict.get("task")
                    task_str = json.dumps(task_dict)
                tasks.append(task_dict)

            except (OSError, TypeError, ValueError, KeyError, NotImplementedError) as e:
                corrupted_name = filename + '.corrupted'
                _LOGGER.exception('Error loading task from path="%s", renaming to new_name="%s" to avoid future problems: %s',
                                filename, corrupted_name, str(e), exc_info=e)
                try:
                    os.rename(filename, corrupted_name)
                except (OSError, IOError) as e:
                    _LOGGER.exception('Error renaming task from path="%s" to new_name="%s": %s', filename,
                            corrupted_name, str(e), exc_info=e)

            except Exception as e: # pylint: disable=broad-except
                _LOGGER.exception("Error loading task from file name %s: %s", filename, str(e))


        return tasks

    def static_tasks_list(self) -> Dict[str, List[JsonObject]]:
        """
        Method to list add pre configured tasks
        """
        template_tasks = TaskHandler._get_static_tasks(TEMPLATE_TASK_PATH)
        historical_tasks = TaskHandler._get_static_tasks(HISTORIC_TASK_PATH)

        return {"template_tasks": template_tasks, "historical_tasks" : historical_tasks}

    def get_allocated_resources(self, host : str) -> Set[Resource]:
        """Find and return the allocated collector resources on the given host.

        Args:
            host: host name used to calculate allocated resources for.
        """
        allocated_resources = set()

        running_tasks = self._get_tasks(host, running_dir=True)
        for task in running_tasks:
            if task.status == task.State.COLLECTING:
                for collector in task.task.collectors.flatten():
                    if (not isinstance(collector, Trigger)) and collector.state == collector.State.COLLECTING:
                        allocated_resources.update(collector.get_required_resources())

        _LOGGER.debug("Allocated resources are %s.",
                      "none" if not allocated_resources else " ".join(list(map(str, allocated_resources))))
        return allocated_resources

    def get_required_resources(self, collectors : CollectorList) -> Set[Resource]:
        """Calculate and return the resources required by the given collectors.

        Args:
            collectors: List of collectors to calculate the required resources for.

        Returns:
            A set of required resources.

        """
        required_resources = set()

        for collector in collectors.flatten():
            required_resources.update(collector.get_required_resources())

        _LOGGER.debug("Required_resources are %s." ,
                      "none" if not required_resources else " ".join(list(map(str, required_resources))))
        return required_resources

    def get_conflicting_resources(self, server_name : str, collectors : CollectorList) -> Set[Resource]:
        """ Returns a list of conflicting resources for a given set of collectors
            targeted at specific host (server_name).

        Args:
            server_name: host name used to calculate allocated resources.
            collectors: List of collectors to calculate the conflicting resources for.

        Returns:
            A list of conflicting resources. If empty - no conflicts were found.

        """
        allocated_resources = self.get_allocated_resources(server_name)
        required_resources = self.get_required_resources(collectors)

        conflicting_resources = allocated_resources.intersection(required_resources)
        if conflicting_resources:
            running_tasks = self._get_tasks(server_name, running_dir=True)
            resources = list(map(str, conflicting_resources))
            running_names = [run_info.task.task_id for run_info in running_tasks]
            log_func = _LOGGER.info if resources else _LOGGER.debug
            log_func('conflicting_resources=[%s] running_tasks=[%s]',
                    ', '.join(resources), ', '.join(running_names))
        return conflicting_resources
