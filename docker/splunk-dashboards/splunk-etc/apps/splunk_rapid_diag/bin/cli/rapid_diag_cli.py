# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import absolute_import
import sys
import json
from json import JSONDecodeError
import glob
import os
import shutil
import time
import threading
import socket
import argparse
import ssl
from datetime import datetime
from urllib import error as urllib_error
from typing import Optional, Any, List, Tuple, IO

sys.path.append(os.path.realpath(os.path.dirname(os.path.dirname(__file__))))
sys.path.append(os.path.realpath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
sys.path.append(os.path.join(os.path.realpath(os.path.dirname(os.path.dirname(__file__))), "splunklib"))

from six.moves.configparser import NoSectionError, NoOptionError
from splunk.clilib import info_gather

# local imports
import logger_manager as log
from cli.cli_error_code import ErrorCodes
from rapid_diag.serializable import Serializable, JsonObject
from rapid_diag.util import get_templates_path, get_conf_stanza, splunk_login
from rapid_diag.task import Task
from rapid_diag.task_handler import TaskHandler
from rapid_diag.process_abstraction import ProcessLister, ProcessNotFound
from rapid_diag.collector.collector import CollectorList
from rapid_diag.collector.trigger.log_monitor import LogMonitor
from rapid_diag.collector.trigger.search_debug import SearchDebug
from rapid_diag.collector.trigger.periodic import Periodic
from rapid_diag.collector.trigger.resource_monitor import ResourceMonitor
from rapid_diag.collector.trigger.resource_monitor_trackers import MovingAverageResourceMonitorTracker
from rapid_diag.collector.diag import Diag
from rapid_diag.collector.ps import PS
from rapid_diag.collector.iops import IOPS
from rapid_diag.collector.lsof import LSOF
from rapid_diag.collector.stack_trace import StackTrace
from rapid_diag.collector.netstat import NetStat
from rapid_diag.collector.system_call_trace import SystemCallTrace
from rapid_diag.collector.network_packet import NetworkPacket
from rapid_diag.collector.search_result import SearchResult

_LOGGER = log.setup_logging("cli", True)
_INTERNAL_LOGGER = log.setup_logging("cli_internal")

def animate_collection(func : Any) -> Any:
    """ Decorator function that 'animates' dots on the console
        while an action is being executed
    """
    # nonlocal is not available in python2
    animate_collection.done = False # type: ignore

    def animate() -> None:
        while not animate_collection.done: # type: ignore
            # use stdout directly as it's not really a message
            sys.stdout.write('.')
            sys.stdout.flush()
            time.sleep(1)

    def collection_runner(*args : Any, **_kwargs : Any) -> Any:
        thr = threading.Timer(1, animate)
        thr.start()
        try:
            result = func(*args)
        finally:
            animate_collection.done = True # type: ignore
            sys.stdout.write('\n')
            sys.stdout.flush()
        return result

    return collection_runner

@animate_collection
def run_animated(task : Task,
                 auth_token : str,
                 start_time : float,
                 task_handler : TaskHandler) -> Optional[Task.RunInfo]:
    return task.run(session_token=auth_token, start_time=start_time, task_handler=task_handler)

def get_tracker_obj(metric : str, threshold : str, invert : bool) -> MovingAverageResourceMonitorTracker:
    """ Helper function that creates MovingAverageResourceMonitorTracker based on
        given arguments.
    """
    target = 'system'
    collector = MovingAverageResourceMonitorTracker.resource_factory.build(target, metric)
    num_samples = 10
    return MovingAverageResourceMonitorTracker(collector, threshold, num_samples, invert)

class RapidDiagCLI:
    """ Main class that handles CLI actions like
        - listing templates
        - running templates
        - running one shot collections
        - etc.
    """
    SPLUNKCOM_DESTINATION = "splunkcom"
    CLI_TASK_PREFIX = "cli_generated_task"

    def __init__(self) -> None:
        pass

    @staticmethod
    def log_cli_action(args : argparse.Namespace, result : int) -> None:
        """ Simply print out CLI arguments - use internal logger - and the result of the action.
            This is used by our telemetry.
        """
        _INTERNAL_LOGGER.info('CLI mode="%s" action="%s" result=%d token_auth=%s',
                getattr(args, 'mode', None),
                getattr(args, 'action', None),
                result,
                getattr(args, 'token_auth', None))

    @staticmethod
    def run_upload_to_splunkcom(args : argparse.Namespace) -> ErrorCodes:
        upload_status = False
        try:
            # enble logging
            info_gather.logging_horrorshow()
            setattr(args, 'proxyFactory', FileWrappingProgressRD)
            upload_status = info_gather.upload_file(args.file, RapidDiagCLI.SPLUNKCOM_DESTINATION, args)
        except (urllib_error.URLError, urllib_error.HTTPError) as e:
            _LOGGER.error("Check splunk URL and login details: %s", str(e))
            upload_status = False
        except ssl.SSLError as e:
            _LOGGER.error("SSL error check logs for more info: %s", str(e))
            upload_status = False
        if not upload_status:
            return ErrorCodes.UPLOAD_FAILED
        return ErrorCodes.SUCCESS

    @staticmethod
    def task_template_list() -> ErrorCodes:
        task_list = RapidDiagCLI.get_static_tasks(get_templates_path())
        # error_list to display json validation errors at end of the task list.
        error_list = []

        for task in task_list:
            if "task" in task:
                task = task["task"]
            try:
                RapidDiagCLI.show_task(task)
            except Exception as e: # pylint: disable=broad-except
                error_list.append(str(e) + '\n' + str(task) + '\n')

        if error_list:
            _LOGGER.error("%s", "\n".join(error_list))
            return ErrorCodes.JSON_VALIDATION

        return ErrorCodes.SUCCESS

    @staticmethod
    def show_task(task_dict : JsonObject) -> ErrorCodes:
        task_inst = RapidDiagCLI.load_task_json(json.dumps(task_dict))
        if not task_inst:
            return ErrorCodes.JSON_VALIDATION
        _LOGGER.info("%s", repr(task_inst))
        return ErrorCodes.JSON_VALIDATION

    @staticmethod
    def get_server_name() -> str:
        """Read the system's server.conf file and returns server name

        Returns
        -------
        [string]
            server name
        """
        conf_info = get_conf_stanza('server', 'general')
        try:
            if conf_info:
                return str(os.path.expandvars(conf_info.get("serverName")))
        except NoSectionError:
            _LOGGER.error("Host not found, Section not found in server.conf")
        except NoOptionError:
            _LOGGER.error("Host not found, Option not found in server.conf")
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.error("Host not found, %s", str(e))

        try:
            return socket.gethostname() # pylint: disable=maybe-no-member
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.error("Warning: Error getting host from os: %s", str(e))
        return ""

    @staticmethod
    def get_auth_token_if_needed(collectors : CollectorList, read_token : bool) -> Optional[str]:
        collector_needs_auth = set()
        for collector in collectors.flatten():
            if collector.needs_auth():
                collector_needs_auth.add(collector.__class__.__name__)
        if collector_needs_auth:
            _LOGGER.info('Collector(s) %s requires Splunk authentication.', ', '.join(collector_needs_auth))
            return splunk_login(read_token)
        return None

    @staticmethod
    def run_task_dict(task_dict : JsonObject,
                    read_token : bool,
                    start_time : Optional[float] = None) -> ErrorCodes:
        if not RapidDiagCLI.load_task_json(json.dumps(task_dict)):
            return ErrorCodes.JSON_VALIDATION

        local_host = RapidDiagCLI.get_server_name()
        if local_host:
            task_dict.update({'host': local_host})
        task = None
        try:
            task = TaskHandler().create(json.dumps(task_dict))
        except (JSONDecodeError, ProcessNotFound) as e:
            _LOGGER.exception("Error creating Task object: %s.", str(e), exc_info=e)
            return ErrorCodes.JSON_VALIDATION

        if task is None:
            _LOGGER.error("Error creating Task object.")
            return ErrorCodes.JSON_VALIDATION

        return RapidDiagCLI.run_task(task, read_token, start_time)


    @staticmethod
    def run_task(task : Task,
                read_token : bool,
                start_time : Optional[float] = None) -> ErrorCodes:
        _INTERNAL_LOGGER.info('Starting execution of task_id="%s" name="%s" read_token=%s', task.task_id,
                                    task.name, str(read_token))
        _LOGGER.info("%s", repr(task))
        try:
            if start_time is None:
                start_time = time.time()

            run_info = run_animated(task, RapidDiagCLI.get_auth_token_if_needed(task.collectors, read_token),
                                    start_time, TaskHandler())
            _LOGGER.info("Collection finished: %s", Task.RunInfo.get_status_strings(run_info.status))
            _LOGGER.info("Collection completed after %s", str(run_info.finish_time - run_info.start_time))
            _LOGGER.info("Output File: %s", run_info.get_output_dir() + Task.RD_PACKAGE_FILE_EXTENSION)
            if run_info.status == Task.RunInfo.State.SUCCESS:
                return ErrorCodes.SUCCESS
            if run_info.status == Task.RunInfo.State.ABORTED:
                return ErrorCodes.ACTION_ABORTED
            return ErrorCodes.COLLECTION_FAILED
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.exception(" Unhandled exception: %s", str(e), exc_info=e)
            return ErrorCodes.UNKNOWN_ERROR

    @staticmethod
    def run_task_template(args : argparse.Namespace) -> ErrorCodes:
        _LOGGER.info("Running template with task_id=%s", args.task_id)
        template_tasks = RapidDiagCLI.get_static_tasks(get_templates_path())
        for task in template_tasks:
            if task['task_id'] == args.task_id:
                return RapidDiagCLI.run_task_dict(task_dict = task,
                                             read_token = args.token_auth,
                                             start_time=None)
        _LOGGER.error("Template with task_id=%s not found in SampleTasks.", args.task_id)
        return ErrorCodes.FILE_DOESNT_EXIST

    @staticmethod
    def run_task_oneshot(args : argparse.Namespace) -> ErrorCodes:
        load_result, task_dict = RapidDiagCLI.json_load(args.file)
        if load_result != ErrorCodes.SUCCESS:
            return load_result
        if task_dict is None:
            return ErrorCodes.JSON_VALIDATION
        _LOGGER.info("Running oneshot task with task_id=%s", task_dict['task_id'])
        return RapidDiagCLI.run_task_dict(task_dict, args.token_auth, start_time=args.unixtime)

    @staticmethod
    def get_static_tasks(path : str, match_file : str = "*.json") -> List[Task]:
        tasks = []

        for filename in glob.glob(os.path.join(path, match_file)):
            try:
                with open(filename, 'r') as json_file:
                    task_str = json_file.read()
                    task_dict = json.loads(task_str)
                    if task_dict.get("task"):
                        task_dict = task_dict.get("task")
                    tasks.append(task_dict)
            except Exception as e: # pylint: disable=broad-except
                _LOGGER.error("Error loading json file: %s. File name: %s", str(e), str(filename))
        return tasks

    @staticmethod
    def json_load(filepath : str) -> Tuple[ErrorCodes, Optional[JsonObject]]: # pylint: disable=too-many-return-statements
        if os.path.isfile(filepath):
            if not os.access(filepath, os.R_OK):
                return (ErrorCodes.FILE_ACCESS_ERROR, None)

            if not os.access(get_templates_path(), os.W_OK):
                return (ErrorCodes.FILE_ACCESS_ERROR, None)

            try:
                with open(filepath, "r") as task:
                    task_dict = json.loads(task.read())
                    if 'task' in task_dict:
                        task_dict = task_dict['task']
                    if not RapidDiagCLI.load_task_json(json.dumps(task_dict)):
                        return (ErrorCodes.JSON_VALIDATION, None)
                return (ErrorCodes.SUCCESS, task_dict)

            except (ValueError, TypeError) as e_val:
                _LOGGER.error('Failed to load json_file="%s": %s', filepath, str(e_val))
                return (ErrorCodes.JSON_VALIDATION, None)
            except Exception as e: # pylint: disable=broad-except
                _LOGGER.error('Failed to load json_file="%s": %s', filepath, str(e))
                return (ErrorCodes.UNKNOWN_ERROR, None)
        else:
            _LOGGER.error("No file name: %s", filepath)
            return (ErrorCodes.FILE_DOESNT_EXIST, None)

    @staticmethod
    def json_upload(args : argparse.Namespace) -> ErrorCodes:
        load_result, task_dict = RapidDiagCLI.json_load(args.file)
        if load_result != ErrorCodes.SUCCESS:
            return load_result
        if task_dict is None:
            return ErrorCodes.JSON_VALIDATION

        task_id = task_dict['task_id']
        try:
            template_tasks = RapidDiagCLI.get_static_tasks(get_templates_path())
            for task in template_tasks:
                if task['task_id'] == task_id:
                    return ErrorCodes.DUPLICATE_TASK_ID

            return RapidDiagCLI.file_copy(args.file, name=args.name, forced=args.force)

        except ValueError as e_val:
            _LOGGER.error("Upload failed: %s", str(e_val))
            return ErrorCodes.JSON_VALIDATION
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.error("Uploading json failed: %s", str(e))
            return ErrorCodes.UNKNOWN_ERROR

    @staticmethod
    def file_copy(filepath : str, name : str, forced : bool) -> ErrorCodes:
        filename = filepath.rpartition(os.sep)[-1]
        if name:
            filename = name
        filename_dst = os.path.join(get_templates_path(), filename)
        if not forced and os.path.isfile(filename_dst):
            return ErrorCodes.FILE_EXIST

        shutil.copy(filepath, filename_dst)
        RapidDiagCLI.print_specific_dict(filename)
        _LOGGER.info("Successfully imported")
        return ErrorCodes.SUCCESS

    @staticmethod
    def print_specific_dict(filename : str) -> None:
        task_dict = RapidDiagCLI.get_static_tasks(get_templates_path(), filename)
        RapidDiagCLI.show_task(task_dict[0])

    @staticmethod
    def load_task_json(task_str : str) -> Optional[Task]:
        task = None
        try:
            task = json.loads(task_str, object_hook=Serializable.json_decode)
        except KeyError as e:
            _LOGGER.error("Key %s not found.", str(e))
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.error("%s", str(e))
        return task

    @staticmethod
    def invoke_collector(mode : str, name : str, args : argparse.Namespace) -> ErrorCodes: # pylint: disable=too-many-branches,too-many-statements
        _LOGGER.info("Collecting '%s' mode=%s", name, mode)

        if name == "ps":
            collector = PS()
        elif name == "diag":
            collector = Diag()
        elif name == "netstat":
            collector = NetStat()
        elif name == "search":
            collector = SearchResult(search_query=args.search_query)
        elif name == "iostat":
            collector = IOPS(collection_time=args.collection_time)
        elif name == "pstack":
            collector = StackTrace(process=ProcessLister.build_process_from_args(args))
        elif name == "lsof":
            collector = LSOF(process=ProcessLister.build_process_from_args(args))
        elif name == "strace":
            collector = SystemCallTrace(collection_time=args.collection_time,
                                        process=ProcessLister.build_process_from_args(args))
        elif name == "tcpdump":
            collector = NetworkPacket(collection_time=args.collection_time,
                                      ip_address=args.ip_address, port=args.port)
        else:
            _LOGGER.error("Invalid or unsupported collector request: %s", name)
            return ErrorCodes.INVALID_COMMAND

        if mode == "periodic-collect":
            periodic_obj = Periodic(sample_count=int(args.sample_count), interval=float(args.interval))
            periodic_obj.add(collector)
            collector = periodic_obj
        elif mode == "resource-monitor":
            metrics = {"cpu": args.cpu, "physical_memory": args.physical_memory, "virtual_memory": args.virtual_memory}
            trackers = []
            for metric, value in metrics.items():
                if value:
                    trackers.append(get_tracker_obj(metric, value, args.invert))

            resource_monitor_obj = ResourceMonitor(trackers)
            resource_monitor_obj.add(collector)
            collector = resource_monitor_obj
        elif mode == "log-monitor":
            log_monitor_obj = LogMonitor(args.log_file, args.regex)
            log_monitor_obj.add(collector)
            collector = log_monitor_obj
        elif mode == "search-debug":
            search_debug_obj = SearchDebug(args.regex, [collector])
            collector = search_debug_obj
        elif mode != "collect":
            _LOGGER.error("Invalid or unsupported mode request: %s", mode)
            return ErrorCodes.INVALID_COMMAND

        cli_task = Task(name = "CLI execution - {}".format(name),
                    description = "CLI Auto generated Task",
                    collectors = [collector],
                    host = RapidDiagCLI.get_server_name(),
                    task_id = "{}.{}.{}".format(RapidDiagCLI.CLI_TASK_PREFIX, mode, name))

        return RapidDiagCLI.run_task(cli_task, args.token_auth, None)

class FileWrappingProgressRD():
    """Writes progress to json file as the wrapped file-like readable
    object is read() from.
    This requires the size of the item (in bytes) be fixed and determinable."""
    def __init__(self, readable_obj: IO, read_max: int = None) -> None:
        """If read_max can be autoset if readable_obj is a real file
        ( ie, if os.fstat(obj.fileno()) returns the size."""
        self.wrapped_f = readable_obj
        if not read_max:
            # intentionally throws exception
            read_max = os.fstat(readable_obj.fileno()).st_size
            self.name = readable_obj.name + ".upload.json"
        else:
            self.name = readable_obj.f.name + ".upload.json" # type: ignore
        self.read_max = read_max
        self.bytes_read = 0

    def __len__(self) -> int:
        return self.read_max

    def read(self, size: int = -1) -> Any:
        """ Read function to update the progress
            to the json file on each read."""
        data = self.wrapped_f.read(size)
        self.bytes_read += len(data)
        self._update()
        return data

    def _update(self) -> None:
        """ calculate the current progress from bytes read and max bytes
            and write the results to the json file """
        cur_percent = int(self.bytes_read * 1.0 / self.read_max * 100)
        pct_text = "%2i" % cur_percent + "%"
        str_now = datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
        if not os.path.exists(self.name):
            with open(self.name, "w") as f:
                data = {'percent':pct_text, 'start_time':str_now, 'updated': str_now}
                json.dump( data, f, indent=4 )
        else:
            with open(self.name, "r+") as f:
                data = json.load(f)
                data['percent'] = pct_text
                data['updated'] = str_now
                f.seek(0)
                json.dump( data, f, indent=4 )
                f.truncate()

    def close(self) -> None:
        """ Close the file """
        self.wrapped_f.close()
