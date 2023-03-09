import time
import sys
if sys.version_info >= (3, 0):
    from queue import Queue
else:
    from Queue import Queue

from threading import Thread
from splunk_instrumentation.diag import make_uuid


class Task(object):
    """
        is the base class for all task that need running
    """

    def run(self):
        """
        to be overridden by new class
        :return: {}
        """
        return {}

    def get_id(self):
        """
        all running task require an ID
        :return: str
        """
        if not hasattr(self, 'task_id'):
            self.task_id = make_uuid()
        return self.task_id

    def to_dict(self):
        """
        used for logging meta data
        :return:
        """
        return {}


class BatchRunner(object):
    """

    BatchRunner will run Task in parallel threads

    example

         class MyTask(Task):
             def run():
                print "running"

         batch = BatchRunner()

         batch.add_task(new MyTask())
         batch.add_task(new MyTask())

         batch.run()


    """

    def __init__(self, config={}, limit=3):
        """

        :param config: object to be passed to the task object
        :param limit: max concurrent threads
        """
        self.limit = limit
        self.task_queue = Queue()
        self.config = config
        self.batch_id = make_uuid()

    def get_batch_id(self):
        """
        the unique ID for the patch process
        :return: str
        """
        return self.batch_id

    def to_dict(self):
        """
        used for logging meta data
        :return:
        """
        return self.config

    def work_thread(self):
        """
        grabs the next task to run and runs the task
        then marks it as done.

        Will loop until queue is empty

        This method is ran in it's own thread

        """
        while not self.task_queue.empty():
            task = self.task_queue.get()

            try:
                task.run()
            except Exception:
                # Don't kill the worker thread
                # just because a single task barfed
                pass

            self.task_queue.task_done()

    def add_task(self, task):
        """
        adds a Task instance to the queue

        :param task:
        :return:
        """
        self.task_queue.put(task)

    def run(self):
        """
        this is the main entry point to start a batch

        logs all items in the queue as "queued"

        calls spawn thread to start batch

        returns after all tasks are ran

        """
        self.spawn_threads()

        self.task_queue.join()

    def spawn_threads(self):
        """
        creates threads. Will create threads up to self.limit

        each thread will start by running work_thread
        """
        for x in range(self.limit):
            worker = Thread(target=self.work_thread, args=())
            worker.daemon = True
            time.sleep(1)  # this is arbitrary wait just so that there is not three request at the same time
            worker.start()
