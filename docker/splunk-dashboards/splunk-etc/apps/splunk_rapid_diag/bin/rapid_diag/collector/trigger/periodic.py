# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import print_function, absolute_import
import os
import sys
import math
import threading
from typing import List, Dict, Optional

# if collector is ran from CLI
SPLUNK_HOME = os.environ.get('SPLUNK_HOME')
SPLUNK_DB = os.environ.get('SPLUNK_DB')
if not SPLUNK_HOME or not SPLUNK_DB:
    print('ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.\n'
          'Execute the file via Splunk\'s python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>', file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))))

# local imports
import logger_manager as log
from rapid_diag.collector.trigger.trigger import Trigger
from rapid_diag.collector.collector import Collector, CollectorList
from rapid_diag.collector.collector_result import CollectorResult, AggregatedCollectorResult
from rapid_diag.util import build_rapid_diag_timestamp
from rapid_diag.serializable import Serializable
from rapid_diag.serializable import JsonObject
from rapid_diag.session_globals import SessionGlobals

# global variables
_LOGGER = log.setup_logging("periodic")
IS_LINUX = sys.platform.startswith('linux')


class Periodic(Trigger):
    def __init__(self, sample_count : int, interval : float, collectors : Optional[List[Collector]] = None,
                    state : Collector.State = Collector.State.WAITING) -> None:
        Trigger.__init__(self, collectors)
        self.sample_count : int = sample_count
        self.interval : float = interval
        self.state = state

    def _collect_impl(self, run_context : Collector.RunContext) -> CollectorResult:

        _LOGGER.info('Starting periodic collection with sample count=%d interval=%.2f',
                    self.sample_count, self.interval)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        _LOGGER.debug("ID of process running task: %s", str(os.getpid()))

        cur_context = run_context.clone()
        self.promote_state(Collector.State.COLLECTING, cur_context.state_change_observers)

        # coping(deepcopy) the collectors to another list
        # `self.filter_collector` removes the collectors with conflicting resources
        # coping into list to provide same collectors to every sample of periodic collection
        # not using deepcopy to avoid 'TypeError: can't pickle _thread.RLock objects'
        selected_collectors = [collector for collector in self.collectors] # pylint: disable=unnecessary-comprehension

        result = AggregatedCollectorResult()
        self.promote_state(Collector.State.COLLECTING, run_context.state_change_observers)
        for i in range(self.sample_count):
            # creating deepcopy of selected_collectors
            self.collectors = CollectorList([collector for collector in selected_collectors]) # pylint: disable=unnecessary-comprehension
            num_digits_idx = int(math.ceil(math.log10(self.sample_count)))

            cur_context.suffix = "_" + str(i).zfill(num_digits_idx) + '_' + build_rapid_diag_timestamp()
            self.filter_collectors(run_context)

            tokens = []
            for collector in self.collectors:
                tokens.append(SessionGlobals.get_threadpool().add_task(collector.collect, cur_context))

            for token in tokens:
                token.wait()
                result.add_result(token.get_result())

            if i != self.sample_count - 1:
                if self.wait_for_state(Collector.State.ABORTING, self.interval) == Collector.State.ABORTING:
                    return CollectorResult.Aborted('Periodic collector aborted by user', _LOGGER)
        return result

    def get_type(self) -> Collector.Type:
        return Collector.Type.CONTINUOUS

    def __repr__(self) -> str:
        return "Periodic(Number of Samples: %r, Intervals: %r)" % (self.sample_count, self.interval)

    def _get_json(self) -> JsonObject:
        return {
            'sampleCount': self.sample_count,
            'interval': self.interval,
            'collectors': self.collectors,
        }

    @staticmethod
    def validate_json(obj : JsonObject) -> None:
        data_types = {"sampleCount": (int,), "interval": (float, int), "collectors" : (list ,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

        value_range : Dict[str, List[float]] = {"sampleCount": [1, Collector.MAX_CNT], "interval": [0.01, Collector.MAX_TIME]}
        for field in list(filter(lambda x: x in obj.keys(), value_range.keys())):
            Serializable.check_value_in_range(obj[field], value_range[field], field)

    @staticmethod
    def from_json_obj(obj : JsonObject) -> 'Periodic':
        return Periodic(int(obj['sampleCount']), float(obj['interval']), obj['collectors'],
                    Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])

Serializable.register(Periodic)
