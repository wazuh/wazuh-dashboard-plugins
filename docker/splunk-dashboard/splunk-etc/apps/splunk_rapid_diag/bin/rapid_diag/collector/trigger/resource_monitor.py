# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import print_function, absolute_import
import os
import sys
import time
import threading
from typing import List

# if collector is ran from CLI
SPLUNK_HOME = os.environ.get('SPLUNK_HOME')
SPLUNK_DB = os.environ.get('SPLUNK_DB')
if not SPLUNK_HOME or not SPLUNK_DB:
    print('ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.\n'
          'Execute the file via Splunk\'s python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>', file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))))))

# local imports
import logger_manager as log
from rapid_diag.collector.trigger.trigger import Trigger
from rapid_diag.collector.trigger.resource_monitor_trackers import MovingAverageResourceMonitorTracker
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.collector_result import CollectorResult, AggregatedCollectorResult
from rapid_diag.util import build_rapid_diag_timestamp
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals

_LOGGER = log.setup_logging("resource_monitor")
IS_LINUX = sys.platform.startswith('linux')


class ResourceMonitor(Trigger):
    def __init__(self, resource_monitor_trackers : List[MovingAverageResourceMonitorTracker],
            collectors : List[Collector] = None, state : Collector.State = Collector.State.WAITING, sleep_time : float = 5):
        Trigger.__init__(self, collectors)
        self.resource_monitor_trackers = resource_monitor_trackers
        self.state = state
        self.sleep_time = sleep_time

    def _collect_impl(self, run_context):
        _LOGGER.info('Starting resource monitor collection with resource monitor trackers=%s',
                     str(self.resource_monitor_trackers))
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))
        cur_context = run_context.clone()
        cur_context.suffix = '_' + build_rapid_diag_timestamp()
        try:
            iteration = 0
            while self.get_state() != Collector.State.ABORTING:
                iteration += 1
                for tracker in self.resource_monitor_trackers:
                    tracker.update(iteration)
                    if tracker.has_crossed_threshold():
                        _LOGGER.info('Crossed the threshold with monitor trackers=%s', str(self.resource_monitor_trackers))
                        self.promote_state(Collector.State.COLLECTING, cur_context.state_change_observers)
                        return self._collect(cur_context)
                time.sleep(self.sleep_time)
        except Exception as e: # pylint: disable=broad-except
            return CollectorResult.Exception(e, 'Error running resource monitor trigger', _LOGGER)
        finally:
            if self.get_state() == Collector.State.ABORTING:
                return CollectorResult.Aborted('Resource Monitor trigger aborted by user', _LOGGER) # pylint: disable=lost-exception

    def _collect(self, run_context):

        # filtering out the collectors whose resources are not available
        self.filter_collectors(run_context)

        result = AggregatedCollectorResult()
        # start collection
        tokens = []
        for collector in self.collectors:
            tokens.append(SessionGlobals.get_threadpool().add_task(collector.collect, run_context))
        for token in tokens:
            token.wait()
            result.add_result(token.get_result())
        return CollectorResult.Failure("Tools are already in use by another task, could not start any of the collectors. "
                                       "Check the Task Manager.")\
                                       if (not self.collectors) and self.conflicts else result

    def get_type(self):
        return Collector.Type.CONTINUOUS

    def __repr__(self):
        tracekrs = ""
        for tracker in self.resource_monitor_trackers:
            tracekrs += str(tracker)
        return "ResourceMonitor(Tracker(s): " + tracekrs + ")"

    def _get_json(self):
        return {
            "resource_monitor_trackers": self.resource_monitor_trackers,
            "collectors": self.collectors,
        }

    @staticmethod
    def validate_json(obj):
        data_types = {"resource_monitor_trackers": (list,), "collectors": (list,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj):
        return ResourceMonitor(obj['resource_monitor_trackers'], obj['collectors'],
                Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])


Serializable.register(ResourceMonitor)
