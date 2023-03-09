#
# Copyright 2021 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""A simple thread safe timer queue implementation which has O(logn) time
complexity."""
import logging
import queue as Queue
import threading
import traceback
from time import time
from typing import Callable, List, Tuple

import sortedcontainers as sc

__all__ = ["Timer", "TimerQueueStruct", "TimerQueue"]


class Timer:
    """Timer wraps the callback and timestamp related attributes."""

    _ident = 0
    _lock = threading.Lock()

    def __init__(self, callback: Callable, when: int, interval: int, ident: int = None):
        """Initializes Timer.

        Arguments:
            callback: Arbitrary callable object.
            when: The first expiration time, seconds since epoch.
            interval: Timer interval, if equals 0, one time timer, otherwise
                the timer will be periodically executed.
            ident: (optional) Timer identity.
        """
        self._callback = callback
        self.when = when
        self.interval = interval

        if ident is not None:
            self.ident = ident
        else:
            with Timer._lock:
                self.ident = Timer._ident + 1
                Timer._ident = Timer._ident + 1

    def update_expiration(self):
        self.when += self.interval

    def __hash__(self):
        return hash(self.ident)

    def __eq__(self, other):
        return isinstance(other, Timer) and (self.ident == other.ident)

    def __lt__(self, other):
        return (self.when, self.ident) < (other.when, other.ident)

    def __le__(self, other):
        return (self.when, self.ident) <= (other.when, other.ident)

    def __gt__(self, other):
        return (self.when, self.ident) > (other.when, other.ident)

    def __ge__(self, other):
        return (self.when, self.ident) >= (other.when, other.ident)

    def __call__(self):
        self._callback()


TEARDOWN_SENTINEL = None


class TimerQueueStruct:
    """The underlying data structure for TimerQueue."""

    def __init__(self):
        self._timers = sc.SortedSet()
        self._cancelling_timers = {}

    def add_timer(
        self, callback: Callable, when: int, interval: int, ident: int
    ) -> Timer:
        """Add timer to the data structure.

        Arguments:
            callback: Arbitrary callable object.
            when: The first expiration time, seconds since epoch.
            interval: Timer interval, if equals 0, one time timer, otherwise
                the timer will be periodically executed
            ident: (optional) Timer identity.

        Returns:
            A timer object which should not be manipulated directly by
                clients. Used to delete/update the timer.
        """

        timer = Timer(callback, when, interval, ident)
        self._timers.add(timer)
        return timer

    def remove_timer(self, timer: Timer):
        """Remove timer from data structure.

        Arguments:
            timer: Timer object which is returned by ``TimerQueueStruct.add_timer``.
        """

        try:
            self._timers.remove(timer)
        except ValueError:
            logging.info(
                "Timer=%s is not in queue, move it to cancelling " "list", timer.ident
            )
        else:
            self._cancelling_timers[timer.ident] = timer

    def get_expired_timers(self) -> Tuple:
        """Get a list of expired timers.

        Returns:
            A tuple of ``Timer``, empty list if there is no expired timers.
        """

        next_expired_time = 0
        now = time()
        expired_timers = []
        for timer in self._timers:
            if timer.when <= now:
                expired_timers.append(timer)

        if expired_timers:
            del self._timers[: len(expired_timers)]

        if self._timers:
            next_expired_time = self._timers[0].when
        return next_expired_time, expired_timers

    def reset_timers(self, expired_timers: List[Timer]) -> bool:
        """Re-add the expired periodical timers to data structure for next
        round scheduling.

        Arguments:
            expired_timers: List of expired timers.

        Returns:
            True if there are timers added, False otherwise.
        """

        has_new_timer = False
        cancelling_timers = self._cancelling_timers
        for timer in expired_timers:
            if timer.ident in cancelling_timers:
                continue
            elif timer.interval:
                # Repeated timer
                timer.update_expiration()
                self._timers.add(timer)
                has_new_timer = True
        cancelling_timers.clear()
        return has_new_timer

    def check_and_execute(self) -> float:
        """Get expired timers and execute callbacks for the timers.

        Returns:
            Duration of next expired timer.
        """

        (next_expired_time, expired_timers) = self.get_expired_timers()
        for timer in expired_timers:
            try:
                timer()
            except Exception:
                logging.error(traceback.format_exc())

        self.reset_timers(expired_timers)
        return _calc_sleep_time(next_expired_time)


class TimerQueue:
    r"""A simple timer queue implementation.

    It runs a separate thread to handle timers Note: to effectively use this
    timer queue, the timer callback should be short, otherwise it will cause
    other timers's delay execution. A typical use scenario in production is
    that the timers are just a simple functions which inject themselvies to
    a task queue and then they are picked up by a threading/process pool to
    execute, as shows below:

        Timers --enqueue---> TimerQueue --------expiration-----------
                                                                    |
                                                                    |
                                                                   \|/
        Threading/Process Pool <---- TaskQueue <--enqueue-- Timers' callback (nonblocking)

    Examples:
           >>> from solnlib import timer_queue
           >>> tq = timer_queue.TimerQueue()
           >>> tq.start()
           >>> t = tq.add_timer(my_func, time.time(), 10)
           >>> # do other stuff
           >>> tq.stop()
    """

    def __init__(self):
        self._timers = TimerQueueStruct()
        self._lock = threading.Lock()
        self._wakeup_queue = Queue.Queue()
        self._thr = threading.Thread(target=self._check_and_execute)
        self._thr.daemon = True
        self._started = False

    def start(self):
        """Start the timer queue."""

        if self._started:
            return
        self._started = True

        self._thr.start()
        logging.info("TimerQueue started.")

    def stop(self):
        """Stop the timer queue."""

        if not self._started:
            return
        self._started = True

        self._wakeup(TEARDOWN_SENTINEL)
        self._thr.join()

    def add_timer(
        self, callback: Callable, when: int, interval: int, ident: int = None
    ) -> Timer:
        """Add timer to the queue.

        Arguments:
            callback: Arbitrary callable object.
            when: The first expiration time, seconds since epoch.
            interval: Timer interval, if equals 0, one time timer, otherwise
                the timer will be periodically executed
            ident: (optional) Timer identity.

        Returns:
            A timer object which should not be manipulated directly by
                clients. Used to delete/update the timer.
        """

        with self._lock:
            timer = self._timers.add_timer(callback, when, interval, ident)
        self._wakeup()
        return timer

    def remove_timer(self, timer: Timer):
        """Remove timer from the queue.

        Arguments:
            timer: Timer object to remove.
        """

        with self._lock:
            self._timers.remove_timer(timer)

    def _check_and_execute(self):
        wakeup_queue = self._wakeup_queue
        while 1:
            (next_expired_time, expired_timers) = self._get_expired_timers()
            for timer in expired_timers:
                try:
                    # Note, please make timer callback effective/short
                    timer()
                except Exception:
                    logging.error(traceback.format_exc())

            self._reset_timers(expired_timers)

            sleep_time = _calc_sleep_time(next_expired_time)
            try:
                wakeup = wakeup_queue.get(timeout=sleep_time)
                if wakeup is TEARDOWN_SENTINEL:
                    break
            except Queue.Empty:
                pass
        logging.info("TimerQueue stopped.")

    def _get_expired_timers(self):
        with self._lock:
            return self._timers.get_expired_timers()

    def _reset_timers(self, expired_timers):
        with self._lock:
            has_new_timer = self._timers.reset_timers(expired_timers)

        if has_new_timer:
            self._wakeup()

    def _wakeup(self, something="not_None"):
        self._wakeup_queue.put(something)


def _calc_sleep_time(next_expired_time):
    if next_expired_time:
        now = time()
        if now < next_expired_time:
            sleep_time = next_expired_time - now
        else:
            sleep_time = 0.1
    else:
        sleep_time = 1
    return sleep_time
