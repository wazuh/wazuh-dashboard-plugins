import json
from splunk_instrumentation.constants import INSTRUMENTATION_INDEX_NAME, INSTRUMENTATION_SOURCETYPE, INST_LICENSE_TYPES
from splunk_instrumentation.datetime_util import local, date_to_timestamp_str
from splunk_instrumentation.indexing.event_writer import EventWriter
from splunk_instrumentation.indexing.query_runner import QueryRunner
from datetime import timedelta, datetime, time

RANGE_TYPE_TIMESTAMP = 1
RANGE_TYPE_DATE = 2


class InstrumentationIndex(object):
    def __init__(self, splunkrc=None, index_name=INSTRUMENTATION_INDEX_NAME,
                 query_runner=None, event_writer=None):
        self.index_name = index_name
        if query_runner:
            self.query_runner = query_runner
        else:
            self.query_runner = QueryRunner(splunkrc, self.index_name)
        if event_writer:
            self.event_writer = event_writer
        else:
            self.event_writer = EventWriter(splunkrc, self.index_name)

    # Public API
    # ----------

    def process_new_events(self, start, end, callback, visibility=[], time_range=None):
        '''
        Calls `callback` with an iterable of new events.
        If callback does not throw an exception, the events will no
        longer be "new."
        '''

        events = self._query_by_date(start, end, visibility, time_range)

        results = []
        for event in events:
            results.append(json.loads(event.get('_raw')))
        callback(results)

    def close_connection(self):
        '''
        calling close socket
        '''
        self.event_writer.close_socket()

    def pipe_json(self, event):
        self.event_writer.submit_via_socket(event)

    # "Private" methods
    # -----------------

    def _query_by_date(self, t_start, t_end, visibility, time_limit=None):
        '''
        earliest and latest makes the assumtion that _telemery events are indexed the day after they happen
        :param t_start:
        :param t_end:
        :param visibility:
        :return:
        '''
        search_cmd = 'search index=' + self.index_name
        search_cmd += " sourcetype=" + INSTRUMENTATION_SOURCETYPE + " | spath date | search "
        if time_limit:
            kwargs = {
                "earliest_time": date_to_timestamp_str(time_limit['start']),
                "latest_time": date_to_timestamp_str(time_limit['stop'])
            }
        else:
            kwargs = {
                "earliest_time": date_to_timestamp_str(datetime.combine(t_start, time.min).replace(tzinfo=local)),
                "latest_time": date_to_timestamp_str(datetime.combine(t_end + timedelta(days=1),
                                                                      time.max).replace(tzinfo=local))
            }
        if t_start:
            search_cmd += (' date>=%s' % t_start.strftime("%Y-%m-%d"))
        if t_end:
            search_cmd += (' date<=%s' % t_end.strftime("%Y-%m-%d"))

        visibility_cmd = self._get_visibility_cmd(visibility)
        search_cmd += " (%s)" % visibility_cmd
        return self.query_runner.search(search_cmd, **kwargs)

    def _get_visibility_cmd(self, visibility):
        if not visibility:
            visibility = INST_LICENSE_TYPES

        return " OR ".join(["visibility= *" + str(x) + "*" for x in visibility])
