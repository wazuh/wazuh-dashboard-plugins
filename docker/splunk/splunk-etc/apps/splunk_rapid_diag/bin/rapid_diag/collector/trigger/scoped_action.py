# python imports
from __future__ import print_function, absolute_import
import sys
from typing import List

import enum
import logger_manager as log
from rapid_diag.collector.trigger.trigger import Trigger
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.collector_result import CollectorResult, AggregatedCollectorResult
from rapid_diag.serializable import Serializable
from rapid_diag.session_globals import SessionGlobals
from rapid_diag.serializable import JsonObject

# global variables
_LOGGER = log.setup_logging("scoped_action")
IS_LINUX = sys.platform.startswith('linux')


class ScopeActionExecutionMode(enum.Enum):
    """Enum used for execution mode"""
    HALT_ON_FAILURE = 1
    CONTINUE_ON_FAILURE = 2
    RUN_POST_ON_PRE_SUCCESS = 3


class ScopedOperationError(Exception):
    """Eum used for execution mode"""

    def __init__(self, message: str, errors: str) -> None:
        super().__init__(message)
        _LOGGER.debug('Error from Scoped action trigger: %s', errors)


class ScopedAction(Trigger):
    """Scoped trigger to allow pre/collect/post collection"""

    def __init__(self, pre_collectors: List[Collector], collectors: List[Collector],
                 post_collectors: List[Collector], mode: ScopeActionExecutionMode,
                 state: Collector.State = Collector.State.WAITING) -> None:
        Trigger.__init__(self, collectors)
        self.state = state
        self.pre_collectors = pre_collectors
        self.post_collectors = post_collectors
        self.exec_mode = mode

    def get_required_resources(self) -> List:
        return []

    def _collect_impl(self, run_context: Collector.RunContext) -> CollectorResult:
        result = AggregatedCollectorResult()
        try:
            self.run_collectors_with_mode(result, run_context)
        except ScopedOperationError as exc:
            return CollectorResult.Failure("scoped action trigger failed {}".format(exc))
        except ValueError as val_error:
            return CollectorResult.Failure("Unknown error {}".format(val_error))
        finally:
            if not result.isSuccess():
                self.run_collectors(self.post_collectors, result, run_context)
        if result.isSuccess():
            return CollectorResult.Success("Scoped actions completed.")
        return CollectorResult.Failure("Scoped action failed")

    def run_collectors(self, collectors: List[Collector],
                       result: AggregatedCollectorResult, run_context: Collector.RunContext) -> None:
        """ run the collectors specified"""
        tokens = []
        for collector in collectors:
            tokens.append(SessionGlobals.get_threadpool().add_task(collector.collect, run_context))

        for token in tokens:
            token.wait()
            result.add_result(token.get_result())

    def run_collectors_with_mode(self, result: CollectorResult,
                                 run_context: Collector.RunContext) -> None:
        """run collectors with execution mode - Continuous, halt on failure, or not run post collection"""
        _LOGGER.info("running with mode %s presize %s post %s",
                     self.exec_mode, len(self.pre_collectors), len(self.post_collectors))
        if self.exec_mode == ScopeActionExecutionMode.RUN_POST_ON_PRE_SUCCESS:
            self.run_collectors(self.pre_collectors, result, run_context)
            pre_success = result.isSuccess()
            if pre_success:
                self.run_collectors(self.post_collectors, result, run_context)
        if self.exec_mode == ScopeActionExecutionMode.CONTINUE_ON_FAILURE:
            self.run_collectors(self.pre_collectors, result, run_context)
            self.run_collectors(self.collectors, result, run_context)
            self.run_collectors(self.post_collectors, result, run_context)
        else:
            self.run_collectors(self.pre_collectors, result, run_context)
            if not result.isSuccess():
                raise ScopedOperationError("Failed on scoped trigger pre-collectors", "pre-collector failure")
            self.run_collectors(self.collectors, result, run_context)
            if not result.isSuccess():
                raise ScopedOperationError("Failed on scoped trigger collectors", " collector failure")
            self.run_collectors(self.post_collectors, result, run_context)
            if not result.isSuccess():
                raise ScopedOperationError("Failed on scoped trigger post-collectors", "post collector failure")

    def get_type(self) -> Collector.Type:
        return Collector.Type.SCOPED

    def __repr__(self) -> str:
        return "Scoped_action"

    def _get_json(self) -> JsonObject:
        return {
            'pre_collectors': self.pre_collectors,
            'collectors': self.collectors,
            'post_collectors': self.post_collectors,
            'exec_mode': self.exec_mode
        }

    @staticmethod
    def validate_json(obj: JsonObject) -> None:
        data_types = {"collectors": (list,), "pre_collectors": (list,), "post_collectors": (list,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj: JsonObject) -> 'ScopedAction':
        return ScopedAction(obj["pre_collectors"], obj['collectors'], obj["post_collectors"], obj["exec_mode"],
                            Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])


Serializable.register(ScopedAction)
