# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import print_function, absolute_import
import os
import sys
import time
import re
import threading
from typing import List

# if collector is ran from CLI
SPLUNK_HOME = os.environ.get('SPLUNK_HOME')
SPLUNK_DB = os.environ.get('SPLUNK_DB')
INFINITY = 30 * 24 * 60 * 60
if not SPLUNK_HOME or not SPLUNK_DB:
    print('ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.\n'
          'Execute the file via Splunk\'s python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>', file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))))))

# local imports
from splunklib import six
import logger_manager as log
from rapid_diag.collector.trigger.trigger import Trigger
from rapid_diag.collector.trigger.monitored_file import MonitoredFile
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.collector_result import CollectorResult, AggregatedCollectorResult
from rapid_diag.util import get_splunkhome_path, build_rapid_diag_timestamp
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals
from rapid_diag.collector.trigger.trigger import TriggerStateChangeObserver

_LOGGER = log.setup_logging("log_monitor")
MAX_RETRIES = 10
IS_LINUX = sys.platform.startswith('linux')


class LogMonitor(Trigger):
    def __init__(self, selected_file : str, regex : str, timeout : float = 0.0,
            collectors : List[Collector] = None, state : Collector.State = Collector.State.WAITING):
        Trigger.__init__(self, collectors)
        self.selected_file = selected_file
        self.regex = regex
        self.timeout  : float = timeout
        self.state = state

    def _collect_impl(self, run_context): # pylint: disable=too-many-branches

        _LOGGER.info('Starting log monitor collection with log file=%s regex=%s timeout=%.2f',
                str(self.selected_file), str(self.regex), self.timeout)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        # If the file contains no directory component, we assume that it's in
        # var/log/splunk.
        if os.path.split(self.selected_file)[0] == "":
            log_file_path = get_splunkhome_path(["var", "log", "splunk", self.selected_file])
        else:
            log_file_path = get_splunkhome_path(["var", "log", self.selected_file])

        cur_context = run_context.clone()
        cur_context.suffix = '_' + build_rapid_diag_timestamp()
        if self.timeout <= 0:
            self.timeout = INFINITY
        deadline = time.monotonic() + self.timeout

        # This while loop takes care of IOError when the log file is just renamed and new file is not created
        retries = MAX_RETRIES
        while retries > 0:
            try:
                with MonitoredFile(log_file_path) as file:
                    while self.get_state() != Collector.State.ABORTING:
                        if time.monotonic() >= deadline:
                            self.reset_state(Collector.State.TIMEOUT, cur_context.state_change_observers)
                            return CollectorResult.Timedout('Collector timed out while monitoring file=' +
                                    log_file_path, _LOGGER)
                        line = file.readline()
                        retries = MAX_RETRIES
                        if not line:
                            time.sleep(0.1)
                        # Ignore the logged line by rapid_diag rest call
                        # Note: log monitor should not get triggered on log of
                        # our app's rest call.
                        elif "/rapid_diag/" in line:
                            pass
                        elif re.search(self.regex, line):
                            _LOGGER.info('Regex matched with log file=%s regex=%s', str(self.selected_file), str(self.regex))
                            self.promote_state(Collector.State.COLLECTING, cur_context.state_change_observers)
                            return self._collect(cur_context)
            except IOError:
                retries -= 1
                if retries == 0:
                    return CollectorResult.Failure('IO error while accessing monitored file="{}"'.format(log_file_path),
                                                    _LOGGER)
                time.sleep(0.2)
            except Exception as e: # pylint: disable=broad-except
                return CollectorResult.Exception(e, 'Error running log monitor trigger', _LOGGER)
            finally:
                # returning if aborted between retries
                if self.get_state() == Collector.State.ABORTING:
                    return CollectorResult.Aborted('Log Monitor trigger aborted by user', _LOGGER) # pylint: disable=lost-exception


    def _collect(self, run_context):

        # filtering out the collectors whose resources are not available
        self.filter_collectors(run_context)

        result = AggregatedCollectorResult()
        tokens = []
        observer = TriggerStateChangeObserver(self, run_context.state_change_observers)
        run_context.state_change_observers.append(observer)

        for collector in self.collectors:
            tokens.append(SessionGlobals.get_threadpool().add_task(collector.collect, run_context))

        for token in tokens:
            token.wait()
            result.add_result(token.get_result())

        run_context.state_change_observers.remove(observer)
        if observer.get_timeout_status():
            raise TimeoutError("Collector Timed out")

        return CollectorResult.Failure("Tools are already in use by another task, could not start any of the collectors. "
                                       "Check the Task Manager.")\
                                       if (not self.collectors) and self.conflicts else result

    def get_type(self):
        return Collector.Type.CONTINUOUS

    def __repr__(self):
        return "Log Monitor(Selected file: %s, Regex: %s, Timeout: %s)" % (self.selected_file, self.regex, self.timeout)

    def _get_json(self):
        return {
            'selectedFile': self.selected_file,
            'regex': self.regex,
            'timeout': self.timeout,
            'collectors': self.collectors,
       }

    @staticmethod
    def validate_json(obj):
        data_types = {"selectedFile": (six.text_type,), "regex": (six.text_type,), "collectors": (list,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

        # We purposefully only support '/' as a directory separator to make
        # interoperability easier.
        pattern = '^([A-Za-z0-9_]+/)?[A-Za-z0-9_]+\\.log$'
        if not re.match(pattern, obj['selectedFile']):
            raise ValueError('selectedFile is invalid.')

        value_range = {"timeout_time": [0, INFINITY]}
        if 'timeout' in obj.keys():
            Serializable.check_value_in_range(
                obj['timeout'], value_range['timeout_time'], 'timeout')

    @staticmethod
    def from_json_obj(obj):
        return LogMonitor(obj['selectedFile'], obj['regex'], float(obj.get('timeout', 0)), obj['collectors'],
                          Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])


Serializable.register(LogMonitor)
