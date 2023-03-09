from __future__ import print_function
from __future__ import absolute_import
import json
import os
from splunk_instrumentation.constants import INST_MODE
import time
from splunk_instrumentation.datetime_util import date_to_timestamp, json_serial, utcNow


class Report(object):
    """
    Implements logging and profiling utilites for instrumentation.py.

    Ordinarily, you will not instantiate this class, but instead use the
    instance provided in the `report` field of this module.
    """

    def __init__(self):
        self.log = {}

    def report(self, name, value, start=None):
        """
        Append data to self.log.

        If in DEV mode (indicated by supplying --mode=DEV on the CLI),
        the reported values are printed immediately to stdout, in addtion
        to being sent as in production mode.

        In production (INPUT mode), the data is accumulated until
        `send` is called, which dumps the whole report as json to
        be indexed.

        :param name: The name of the field to store this value in on self.log
        Should be a dot-separated list of symbols. If it ends in '[]', the value
        will be inserted into an array which may be appended to later.

        :param value: The value to store on self.log

        :param start: If provided, should be a time object obtained
        from the `start_profiling` method. Providing this value causes a
        'time' field to be added to `value` (which must be a dict), before
        it is added to self.log, which indicates the total time since
        start_profiling was called.
        """
        arrayTest = name.split("[")
        name = arrayTest[0]
        arrayTest = len(arrayTest) == 2

        def nested_set(dic, path, value):
            keys = path.split(".")
            for key in keys[:-1]:
                dic = dic.setdefault(key, {})

            if arrayTest:
                dic.setdefault(keys[-1], [])
                dic[keys[-1]].append(value)
            else:
                dic[keys[-1]] = value

        if start and isinstance(value, dict):
            value['time'] = self.start_profiling() - start
        nested_set(self.log, name, value)
        if not INST_MODE == "INPUT":
            print("report::" + name + '=' + json.dumps(value, default=json_serial))
        return value

    def start_profiling(self):
        """
        Returns a start time that may be passed to report.report
        when logging the completion of an action to have a time field
        added, indicating the duraction of the action.
        """
        return time.time()

    def send(self):
        """
        Prints the whole of self.log to stdout as json.
        This is used to log reporting information in production
        runs of the instrumentation.py script.
        """
        self.log.setdefault('timestamp', date_to_timestamp(utcNow()))
        print(json.dumps(self.log, default=json_serial))

    def get(self, path):
        """
        Get a field from self.log by path.

        :param path: A dot-separated list of symbols.
        """
        keys = path.split(".")
        dic = self.log
        for key in keys:
            dic = dic.setdefault(key, {})
        return dic

    def write(self):
        """
        Writes the data accumulated in self.log to report.json,
        next to the report python module (this module) on disk.
        """
        self.log.setdefault('timestamp', date_to_timestamp(utcNow()))
        with open(os.path.dirname(
                os.path.realpath(__file__)) + '/report.json', 'w') as target:
            target.write(json.dumps(self.log, default=json_serial))


report = Report()
