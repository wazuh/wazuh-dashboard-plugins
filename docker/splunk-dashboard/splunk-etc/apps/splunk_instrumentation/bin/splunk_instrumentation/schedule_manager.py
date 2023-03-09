from splunk_instrumentation.constants import INTROSPECTION_INDEX_NAME
from splunk_instrumentation.indexing.instrumentation_index import InstrumentationIndex
from splunk_instrumentation.metrics.metrics_collection_manager import MetricsCollectionManager
from splunk_instrumentation.packager import Packager
import time
from splunk_instrumentation.report import report


class EventIndexer(object):
    '''
    a mock list to send events to be indexed through a socket
    '''
    def __init__(self, index_name=INTROSPECTION_INDEX_NAME):
        self.indexer = InstrumentationIndex(index_name=index_name)
        self._count = 0

    def append(self, item):
        '''
        on append send the event to the index through open socket
        :param item:
        :return:
        '''
        self._count = self._count + 1
        self.indexer.pipe_json(item)

    def close_connection(self):
        self.indexer.close_connection()

    def count(self):
        return self._count


class ScheduleManager(object):
    '''
    manager for application.

    '''
    def __init__(self, schema, factory):
        self.schema = schema
        self.factory = factory
        self.event_indexer = None

    def phase_1(self, dateRange, index_name=INTROSPECTION_INDEX_NAME):
        '''
        phase 1 does not check visibility
        phase 1 runs data collection for data points marked for phase 1 in schema and indexes through EventIndexer

        :param: dateRange
        :param:index_name: collected data is indexed in the index_name that is provided (default _introspection)

        :return:
        '''
        self.event_indexer = EventIndexer(index_name)
        self._run_collection(dateRange, self.append_via_socket, 1)
        report.report("events_indexed", self.event_indexer.count())
        time.sleep(2)

    def phase_2(self, dateRange=None, index_name=INTROSPECTION_INDEX_NAME):
        '''
        phase 2 should check visibility
        phase 2 does two things:
        - runs data collection for data points marked for phase 2 in schema and indexes through EventIndexer
        - package telemetry data for this run and send to splunkx

        :param: dateRange
        :param:index_name: collected data is indexed in the index_name that is provided (default _introspection)
        :return:
        '''
        self.event_indexer = EventIndexer(index_name)
        self._run_collection(dateRange, self.append_via_socket, 2)

        # sleep for 5 seconds before runing package_send()
        time.sleep(5)

        p = Packager(schema=self.schema, factory=self.factory)
        p.package_send(dateRange, index_name)

    def _run_collection(self, dateRange, callback=None, phase=1):
        mcm = MetricsCollectionManager(self.schema, self.factory, phase=phase)
        mcm.collect_data(dateRange, callback)

    def append_via_socket(self, results):
        '''
        callback to process the event:
            - sending the data to event_indexer (via socket)
        '''
        for event in results:
            self.event_indexer.append(event)
        self.event_indexer.close_connection()
