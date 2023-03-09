# pylint: disable=missing-function-docstring,missing-class-docstring,abstract-method
# python imports
from __future__ import absolute_import
from typing import List, Callable, Optional

# local imports
import logger_manager as log
from rapid_diag.collector.collector import Collector, CollectorList
from rapid_diag.collector.collector import CollectorStateObserver
from rapid_diag.collector.resource import Resource


_LOGGER = log.setup_logging("trigger")

class TriggerStateChangeObserver(CollectorStateObserver):
    def __init__(self, collector : Collector, obs : CollectorStateObserver):
        CollectorStateObserver.__init__(self)
        self.collector : Collector = collector
        self.obs : List[CollectorStateObserver] = obs
        self.is_timedout : bool = False

    def __call__(self, collector : Collector, prev_state : Collector.State, new_state : Collector.State) -> None:
        if new_state == Collector.State.TIMEOUT:
            if isinstance(collector, Trigger):
                _LOGGER.debug("timeout called %s", str(id(self.collector)))
                self.is_timedout = True

    def get_timeout_status(self) -> bool:
        return self.is_timedout

    def save(self, run_info_path : Optional[str] = None) -> None:
        pass


class Trigger(Collector):
    def __init__(self, collectors : Optional[List[Collector]]):
        Collector.__init__(self)
        self.conflicts : bool  = False
        self.collectors : CollectorList = CollectorList([] if collectors is None else collectors)

    def add(self, collector : Collector) -> None:
        self.collectors.append(collector)

    def remove(self, collector : Collector) -> bool:
        try:
            index = self.collectors.index(collector)
            self.collectors = CollectorList(self.collectors[:index] + self.collectors[index+1:])
        except ValueError:
            return False
        return True

    def apply_to_self(self, functor : Callable, depth : int = 0) -> None:
        Collector.apply_to_self(self, functor, depth)
        for collector in self.collectors:
            collector.apply_to_self(functor, depth + 1)

    def get_required_resources(self) -> List[Resource]:
        resources = []
        for collector in self.collectors:
            resources.extend(collector.get_required_resources())
        return resources

    def _filter_collectors_helper(self, conflicting_resources : List[Resource]) -> None:
        for i in reversed(range(len(self.collectors))):
            collector = self.collectors[i]
            if isinstance(collector, Trigger):
                collector._filter_collectors_helper(conflicting_resources) # pylint: disable=protected-access
            elif set(collector.get_required_resources()).intersection(conflicting_resources):
                self.conflicts = True
                del self.collectors[i]

    def filter_collectors(self, run_context : Collector.RunContext) -> None:
        conflicting_resources : List[Resource] = \
                run_context.task_handler.get_conflicting_resources(run_context.server_name, self.collectors) # type: ignore
        if len(conflicting_resources) > 0:
            _LOGGER.debug("Resources conflicting with the trigger are %s",
                            " ".join(([str(cr) for cr in conflicting_resources])))
            self._filter_collectors_helper(conflicting_resources)
