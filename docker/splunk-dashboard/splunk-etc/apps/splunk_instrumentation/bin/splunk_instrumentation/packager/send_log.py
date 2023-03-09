"""SendLog class."""

from datetime import datetime, timedelta
from datetime import time as dtime
import time
import logging
import json
from splunk_instrumentation.constants import AUDIT_INDEX_NAME, INST_EXECUTION_ID, AUDIT_SOURCETYPE, INST_VERSION
from splunk_instrumentation.indexing.query_runner import QueryRunner
from splunk_instrumentation.indexing.event_writer import EventWriter

from splunk_instrumentation.datetime_util import date_to_timestamp_str, json_serial, local_date_to_utc

METHOD = {
    "AUTO": "auto",
    "MANUAL": "manual"
}


class SendLog(object):
    """SendLog class."""

    def __init__(
            self, splunkrc=None, index_name=AUDIT_INDEX_NAME, inst_key=None,
            inst_host=None, inst_port=None, query_runner=None,
            event_writer=None):
        """
        Constructor.
        This class handles sending and reading log from the index.
        """
        self.query_runner = query_runner or QueryRunner(splunkrc, index_name)
        self.event_writer = event_writer or EventWriter(splunkrc, index_name)
        self.source = "telemetry"
        self.index_name = index_name
        self._status = {
            "ATTEMPTED": 'attempted',
            "SUCCESS": 'success',
            "FAILED": 'failed'
        }

    def send_attempted(self, start, end, visibility, method=METHOD['AUTO'], time_range=None, count=None):
        """send_attempted.

        Send status attempted into index_name
        start = a datetime Object
        end = a datetime Object
        visibility = ['license', 'anonymous', 'support']
        method = ['auto', 'manual']
        """
        logging.info(
            "attempt send " + date_to_timestamp_str(start) + ' to ' + date_to_timestamp_str(end))
        self._submit_status(
            self._status["ATTEMPTED"], start, end, visibility,
            source=self.source, method=method, time_range=time_range, count=count)

    def send_completed(self, start, end, visibility, method=METHOD['AUTO'], time_range=None, count=None):
        """send_completed.

        Send status completed into index_name
        start = a datetime Object
        end = a datetime Object
        visibility = ['license', 'anonymous', 'support']
        method = ['auto', 'manual']
        """
        logging.info(
            "completed send " + date_to_timestamp_str(start) + ' to ' + date_to_timestamp_str(end))
        self._submit_status(
            self._status["SUCCESS"], start, end, visibility,
            source=self.source, method=method, time_range=time_range, count=count)

    def send_failed(self, start, end, visibility, method=METHOD['AUTO'], time_range=None, count=None):
        """send_failed.

        Send status failed into index_name
        start = a datetime Object
        end = a datetime Object
        visibility = ['license', 'anonymous', 'support']
        method = ['auto', 'manual']
        """
        logging.info(
            "failed send " + date_to_timestamp_str(start) + ' to ' + date_to_timestamp_str(end))
        self._submit_status(
            self._status["FAILED"], start, end, visibility,
            source=self.source, method=method, time_range=time_range, count=None)

    def get_last_auto_send_log(self):
        """Get the last event recorded to index_name with method = auto """
        search_cmd = 'search index = ' + self.index_name + ' sourcetype=' + AUDIT_SOURCETYPE + ' method = auto| head 1'
        query_results = [value for value in self.query_runner._query(search_cmd)]

        if not query_results or len(query_results) == 0:
            return None

        result = json.loads(query_results[0]['_raw'])
        result['start'] = datetime.fromtimestamp(float(result['start']))
        result['end'] = datetime.fromtimestamp(float(result['end']))
        logging.info(
            "get_last_auto_send_log " + date_to_timestamp_str(result['start']) +
            ' to ' + date_to_timestamp_str(result['end']))
        return result

    def _submit_status(
            self, status, start, end, visibility, source=None, method=METHOD['AUTO'], time_range=None, count=None):
        """ submit_status.

        Formatting the data and then call submit_json on the data
        """

        visibility = self.normalize_visibility(visibility)

        data = self.bundle_data(status, start, end, visibility, source, method, time_range, count)

        self.submit_json(
            data, source=self.source)

    def submit_json(self, event, host=None, source=None):
        """
        Submit a new json event directly to the index.

        If the event is not a string already, it will be converted with
        `json.dumps`.
        """
        if not isinstance(event, str):
            event = json.dumps(event)
        self.event_writer.submit(event, host=host, source=source, sourcetype=AUDIT_SOURCETYPE)

    def normalize_visibility(self, visibility):
        if type(visibility) == list:
            visibility = ','.join([str(value) for value in visibility])
        return visibility

    def bundle_data(
            self, status, start, end, visibility, source=None, method=METHOD['AUTO'], time_range=None, count=None):
        date_range = {}

        if time_range is None:
            time_range = {
                    "start": local_date_to_utc(start, dtime.min),
                    "stop": local_date_to_utc(end + timedelta(days=1), dtime.max)
                }
        date_range['start'] = date_to_timestamp_str(time_range.get('start'))
        date_range['stop'] = date_to_timestamp_str(time_range.get('stop'))

        data = {
            "time": int(time.time()),
            "status": status,
            "start": date_range['start'],
            "end": date_range['stop'],
            "executionID": INST_EXECUTION_ID,
            "visibility": visibility,
            "method": method,
            "start_date": start,
            "end_date": end,
            "count": count,
            "version": INST_VERSION}

        data = json.dumps(data, default=json_serial)

        return data
