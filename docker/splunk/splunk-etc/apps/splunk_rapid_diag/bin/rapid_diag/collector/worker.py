# pylint: disable=missing-function-docstring,missing-class-docstring
from threading import Thread
from queue import Queue, Empty
# local imports
import logger_manager as log

# global variables
_LOGGER = log.setup_logging("worker")


class Worker(Thread):
    DATA_WAIT_TIMEOUT = 0.5

    """ Thread executing tasks from a given tasks queue """

    def __init__(self, tasks : Queue) -> None:
        Thread.__init__(self)
        self.tasks = tasks
        self.daemon = True
        self.shutdown = False
        self.start()
        _LOGGER.debug('%s created in pool', self.getName())

    def start_shutdown(self) -> None:
        self.shutdown = True

    def run(self) -> None:
        while not self.shutdown:
            try:
                task = self.tasks.get(True, self.__class__.DATA_WAIT_TIMEOUT)
            except Empty:
                continue

            token = task[0]
            args = []
            if len(task) > 1:
                args = task[1:]
            _LOGGER.debug('Passed values for func=%s args=%s', str(token.func), str(args))
            try:
                # token is callable and it's calling func internally
                token(*args)
            except Exception as e: # pylint: disable=broad-except
                # An exception happened in this thread
                _LOGGER.exception('Failure while executing func=%s args=%s error=%s',
                                str(token.func), str(args), str(e), exc_info=e)
            finally:
                _LOGGER.debug("Task Done: %s", str(token.func))
                # Mark this task as done, whether an exception happened or not
                self.tasks.task_done()
