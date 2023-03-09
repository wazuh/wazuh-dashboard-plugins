# pylint: disable=missing-function-docstring,missing-class-docstring
from __future__ import absolute_import
import subprocess
import os


class PerformanceCounterStarted:
    def __init__(self, output_dir, suffix):
        self.output_dir = output_dir
        self.suffix = suffix
        self.counter_name = os.path.basename(os.path.normpath(self.output_dir))

    def add_counter(self, output_dir, suffix):
        command = ['logman', 'create', 'counter', self.counter_name, '-f', 'csv',
                    '-c',r'\LogicalDisk(*)\*', '-o', # pylint: disable=anomalous-backslash-in-string
                    os.path.join(output_dir, 'iops' + suffix)]
        # check_call here to assert that counter is created successfully, if not it will throw CalledProcessException
        with open(os.devnull, 'w') as tempf:
            subprocess.check_call(command, stdout=tempf, stderr=subprocess.STDOUT)

    def remove_counter(self):
        self.stop_counter() # extra check for stopping counter if it is running as if it is running, it can't be deleted
        command = ['logman', 'delete', self.counter_name]
        with open(os.devnull, 'w') as tempf:
            subprocess.call(command, stdout=tempf, stderr=subprocess.STDOUT)

    def start_counter(self):
        command = ['logman', 'start', self.counter_name]
        with open(os.devnull, 'w') as tempf:
            subprocess.check_call(command, stdout=tempf, stderr=subprocess.STDOUT)

    def stop_counter(self):
        command = ['logman', 'stop', self.counter_name]
        with open(os.devnull, 'w') as tempf:
            subprocess.call(command, stdout=tempf, stderr=subprocess.STDOUT)

    def __enter__(self):
        # In cases like splunk restart while collection is running(or Taskkill /F)
        # it is possible that the collector stops abruptly without removing the counter.
        # If counter is not removed we won't be able to generate new counter with same name.
        # So, first removing counter if exists and then creating it.
        self.remove_counter()
        self.add_counter(self.output_dir, self.suffix)
        self.start_counter()
        return self

    def __exit__(self, _type, _value, _traceback):
        self.remove_counter()
