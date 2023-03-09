# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import absolute_import
import threading
import sys
from time import time
from typing import Optional, Callable, Any, List
from splunklib.six.moves.queue import Queue, Empty

# local imports
import logger_manager as log
from rapid_diag.conf_util import RapidDiagConf
from rapid_diag.collector.worker import Worker
from rapid_diag.collector.collector_result import CollectorResult

_LOGGER = log.setup_logging("threadpool")


class SubscribableQueue(Queue):
    def __init__(self, subscribers : 'ThreadPool', maxsize : int = 0) -> None:
        super().__init__(maxsize)
        self.subscribers = subscribers
        self.pending_count = 0
        self.lock = threading.Lock()

    def _alter_pending_count(self, delta : int) -> None:
        count = None
        with self.lock:
            self.pending_count += delta
            count = self.pending_count
        self.subscribers.adjust_threadpool_size(count)

    def put(self, item : Any, block : bool = True, timeout : Optional[int] = None) -> None:
        super().put(item, block, timeout)
        self._alter_pending_count(1)

    def task_done(self) -> None:
        super().task_done()
        self._alter_pending_count(-1)


class ThreadPool:
    THREADPOOL_SIZE_SOFT_LIMIT, THREADPOOL_SIZE_HARD_LIMIT = RapidDiagConf.get_threadpool_size_limits()

    """ Pool of threads consuming tasks from a queue """

    def __init__(self, soft_limit : int = THREADPOOL_SIZE_SOFT_LIMIT, hard_limit : int = THREADPOOL_SIZE_HARD_LIMIT) -> None:
        self.soft_limit = soft_limit
        self.hard_limit = hard_limit
        self.lock = threading.Lock()
        self.workers : List[Worker] = []
        self.tasks = SubscribableQueue(self)
        self._add_workers_locked(self.soft_limit)

    def _add_workers_locked(self, num_threads : int) -> None:
        for _ in range(num_threads):
            try:
                self.workers.append(Worker(self.tasks))
            except Exception as e: # pylint: disable=broad-except
                _LOGGER.exception("Error while creating worker. %s", str(e))

    def adjust_threadpool_size(self, pending_count : int) -> None:
        """ Adjust the ThreadPool size """
        with self.lock:
            _LOGGER.debug("Threadpool: %s", str([w.getName() for w in self.workers]))
            if pending_count > len(self.workers) and len(self.workers) < self.hard_limit:
                thread_to_spawn = min(pending_count - len(self.workers), self.hard_limit - len(self.workers))
                self._add_workers_locked(thread_to_spawn)

    def add_task(self, func : Callable, *args : Any) -> 'Token':
        """ Add a task to the queue (queue has its own lock) """
        token = ThreadPool.Token(func, *args)
        self.tasks.put((token,))
        return token

    def abort(self) -> None:
        with self.lock:
            try:
                while not self.tasks.empty():
                    self.tasks.get_nowait()
            except Empty:
                pass
            for i, worker in enumerate(self.workers):
                worker.start_shutdown()
                worker.join()
                self.workers[i] = Worker(self.tasks)

    def __del__(self) -> None:
        self.abort()

    class Token:
        PENDING = 0
        RUNNING = 1
        FINISHED = 2

        def __init__(self, func : Callable, *args : str) -> None:
            self.func = func
            self.args = args
            self.result : Optional[CollectorResult] = None
            self.status = ThreadPool.Token.PENDING
            self.lock = threading.Lock()
            self.cond_var = threading.Condition(self.lock)

        def __call__(self) -> None:
            with self.lock:
                assert self.status == ThreadPool.Token.PENDING
                self.status = ThreadPool.Token.RUNNING
            result = self.func(*self.args)
            with self.lock:
                assert self.status == ThreadPool.Token.RUNNING
                self.status = ThreadPool.Token.FINISHED
                self.result = result
                self.cond_var.notifyAll()

        def wait(self, timeout : Optional[float] = None, status : Optional[int] = None) -> int:
            """
            Wait until object's status is at least `status`, return
            current status (which may be prior to the requested if
            `timeout is not None`)
            """

            if not status:
                status = ThreadPool.Token.FINISHED

            # None will get stuck in a C call forever, blocking signal handling -- just use a silly timeout instead
            if timeout is None:
                try:
                    timeout = threading.TIMEOUT_MAX
                except: # pylint: disable=bare-except
                    timeout = sys.maxsize
            end = time() + timeout
            with self.lock:
                while self.status < status:
                    timeout = end - time()
                    if timeout <= 0:
                        return self.status
                    self.cond_var.wait(timeout)
                    _LOGGER.debug('Still waiting for %s (%s)', str(self.func), str(self.args))
                return self.status

        def get_result(self) -> CollectorResult:
            assert self.status == ThreadPool.Token.FINISHED
            assert self.result
            return self.result
