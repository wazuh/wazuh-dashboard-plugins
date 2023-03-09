# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import absolute_import
import sys
import copy
from time import time
from threading import Lock, Condition
from enum import Enum
from abc import ABCMeta, abstractmethod
from typing import Any, List, Callable, Optional, Set

# local imports
from splunklib import six
import logger_manager as log
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.collector.resource import Resource
from rapid_diag.serializable import Serializable, JsonObject
# below is needed to register signal handler
import rapid_diag.trace # pylint: disable=unused-import

_LOGGER = log.setup_logging("collector")

Base = six.with_metaclass(ABCMeta, object) # type: Any

class CollectorStateObserver(Base):

    @abstractmethod
    def save(self, run_info_path : Optional[str] = None) -> None:
        pass

class StateChangeObserver(Base):

    @abstractmethod
    def __call__(self, _collector : 'Collector', _prev_state : 'Collector.State', _new_state : 'Collector.State') -> None:
        pass

class Collector(Serializable):
    """Base class for all data collection types.

    When adding new collector - inherit from this class and implement below
    abstract methods:

    _collect_impl       - this is the heart of the collector (what it does i.e. collect)
    get_type            - type can be CONTINUOUS or SNAPSHOT
    get_required_resources - what resources this collector needs.
    _get_json           - collector specific serialization.

    """
    MAX_TIME = float(30 * 24 * 60 * 60)
    MAX_CNT = int(1e9)

    class Type(Enum):
        SNAPSHOT = 0
        CONTINUOUS = 1
        SCOPED = 2

    class State(Enum):
        WAITING = 0
        STARTED = 1
        COLLECTING = 2
        ABORTING = 3
        FINISHED = 4
        SUCCESS = 5
        FAILURE = 6
        ABORTED = 7
        TIMEOUT = 8

    class RunContext:
        def __init__(self, server_name : str, output_dir : str, suffix : str, session_token : Optional[str],
                        state_change_observers : Optional[List[CollectorStateObserver]] = None,
                        task_handler : Optional[object] = None):
            self.server_name : str = server_name
            self.output_dir : str = output_dir
            self.suffix : str = suffix
            self.session_token : Optional[str] = session_token
            self.state_change_observers : List[CollectorStateObserver] = state_change_observers\
                                                            if state_change_observers is not None else []
            self.task_handler : Optional[Any] = task_handler

        def clone(self) -> 'Collector.RunContext':
            return Collector.RunContext(copy.deepcopy(self.server_name), copy.deepcopy(self.output_dir),
                                        copy.deepcopy(self.suffix), copy.deepcopy(self.session_token),
                                        self.state_change_observers[:], copy.deepcopy(self.task_handler))

    def __init__(self) -> None:
        Serializable.__init__(self)
        self.state : Collector.State = Collector.State.WAITING
        self.state_lock : Lock = Lock()
        self.state_condvar : Condition = Condition(self.state_lock)
        self.observers : Set[CollectorStateObserver] = set()
        self.result : Optional[CollectorResult] = None

    def set_result(self, result : CollectorResult) -> None:
        self.result = result

    def promote_state(self, state : 'Collector.State',
                      state_change_observers : Optional[List[CollectorStateObserver]] = None) -> None:
        assert Collector.State(state)
        with self.state_lock:
            prev_state = self.state
            if state.value > self.state.value:
                self.state = state
                self.state_condvar.notifyAll()
                self.notify_observers()
        if prev_state.value < state.value and state_change_observers is not None:
            for observer in state_change_observers:
                observer(self, prev_state, state)

    def reset_state(self, state : 'Collector.State',
                    state_change_observers : Optional[List[CollectorStateObserver]] = None) -> None:
        assert Collector.State(state)
        with self.state_lock:
            if state == self.state:
                return
            prev_state = self.state
            self.state = state
            self.state_condvar.notifyAll()
            self.notify_observers()
        if state_change_observers is not None:
            for observer in state_change_observers:
                observer(self, prev_state, state)


    def wait_for_state(self, state : 'Collector.State', timeout : Optional[float] = None) -> 'Collector.State':
        """
        Wait until object's state is at least `state`, return
        current state (which may be prior to the requested if
        `timeout is not None`)
        """
        assert Collector.State(state)
        # None will get stuck in a C call forever, blocking signal handling -- just use a silly timeout instead
        if timeout is None:
            timeout = sys.maxsize
        end = time() + timeout
        with self.state_lock:
            while self.state.value < state.value:
                timeout = end - time()
                if timeout <= 0:
                    return self.state
                self.state_condvar.wait(timeout)
            return self.state

    def init_state(self) -> None:
        """
        resets the state to `WAITING(0)`
        NOTE: used for task re-run. Otherwise collectors will read final state values.
        """
        with self.state_lock:
            self.state = Collector.State.WAITING

    def get_state(self) -> 'Collector.State':
        """provides the current state of collector

        Returns
        -------
        int
            state value
        """
        with self.state_lock:
            return self.state

    def collect(self, run_context : 'Collector.RunContext') -> CollectorResult:
        """
        Execute collection tasks outputting files to `runContext.output_dir/<somename>runContext.suffix<.extension>`.
        """
        self.promote_state(Collector.State.STARTED, run_context.state_change_observers)
        while True:
            try:
                result = self._collect_impl(run_context)
                return result
            except TimeoutError as e:
                _LOGGER.debug('Time out triggered for collector="%s"', self.__class__.__name__)
                continue
            except Exception as e: # pylint: disable=broad-except
                result = CollectorResult.Exception(e, "Error while collecting data from " +
                                                   self.__class__.__name__, _LOGGER)
                return result
            finally:
                state = Collector.State.FINISHED
                if result.isSuccess():
                    state = Collector.State.SUCCESS
                elif self.get_state() == Collector.State.ABORTING:
                    state = Collector.State.ABORTED
                else:
                    state = Collector.State.FAILURE

                self.promote_state(state, run_context.state_change_observers)
                self.result = result
                _LOGGER.info('Collector execution result: name="%s" status="%s" internal=%s',
                              self.__class__.__name__, state.name, (run_context.suffix == ""))

    @abstractmethod
    def _collect_impl(self, run_context : 'Collector.RunContext') -> CollectorResult:
        """
        `collect()` implementation method. This is protected and only meant for subclasses to extend -- hands off, users!
        """
        pass

    @abstractmethod
    def get_type(self) -> 'Collector.Type':
        """
        Return collector type
        """
        pass

    @abstractmethod
    def get_required_resources(self) -> List[Resource]:
        """
        Return required resource list (see `rapid_diag.collector.resource`).
        """
        pass

    def register_observer(self, observer : CollectorStateObserver) -> None:
        self.observers.add(observer)

    def remove_observer(self, observer : CollectorStateObserver) -> None:
        self.observers.remove(observer)

    def notify_observers(self) -> None:
        for observer in self.observers:
            observer.save()

    def apply_to_self(self, functor : Callable, depth : int = 0) -> None:
        functor(self, depth)

    def needs_auth(self) -> bool:
        return False

    def cleanup(self, **kwargs : Any) -> None:
        """
        Do cleanup after e.g. Abort.
        NOTE: Currently used in Windows specific scenario only
        """
        pass

    @abstractmethod
    def _get_json(self) -> JsonObject:
        """This is json representation of the Collector specific for child classes.
        """
        pass

    def to_json_obj(self) -> JsonObject:
        """By default we serialize state and result
        """
        ret = {
            'state': self.state.name
        }
        if self.result:
            ret['result'] = self.result

        additional = self._get_json()
        if additional:
            ret.update(additional)

        return ret


class CollectorList(list):
    """Dedicated list to manage collectors.

    This was created to keep operations on list of collectors in one context.
    Hopefully will contain more methods later ...
    """
    def flatten(self) -> List[Collector]:
        """Returns a new flat list of all collectors (i.e. flattens Triggers and other
        objects that could contain embedded collectors lists).
        """
        collectors_found = []
        for collector in self:
            collector.apply_to_self(lambda collector, depth: collectors_found.append(collector))
        return collectors_found
