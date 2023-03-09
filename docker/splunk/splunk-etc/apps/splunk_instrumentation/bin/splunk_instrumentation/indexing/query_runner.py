from splunk_instrumentation.splunkd import Splunkd
from splunk_instrumentation.constants import SPLUNKRC, INST_APP_NAME, INSTRUMENTATION_INDEX_NAME
import splunk_instrumentation.splunklib.results as splunklib

import time
import logging


class QueryRunnerResult(splunklib.ResultsReader):
    def __init__(self, stream, job=None):
        super(QueryRunnerResult, self).__init__(stream)
        self.job = job


class QueryRunner(object):
    """ Query Runner.
    a class to handle query to splunkd.
    It grabs a splunkd object according to the splunkrc params provided:
        - If splunkrc is a dictionary, it will create a new splunkd object.
        - If given other object type, it will do do Dependency Injection on _splunkd
    """
    def __init__(self,
                 splunkrc,
                 index_name=INSTRUMENTATION_INDEX_NAME,
                 owner='-',
                 app=INST_APP_NAME, result_reader=QueryRunnerResult):
        self.splunkrc = splunkrc or SPLUNKRC
        self.result_reader = result_reader

        if type(self.splunkrc) is dict:
            self._splunkd = Splunkd(**self.splunkrc)
        else:
            self._splunkd = splunkrc

        self._splunkd.namespace['owner'] = owner
        self._splunkd.namespace['app'] = app

        if self._splunkd.has_index(index_name):
            self._index = self._splunkd.get_index(index_name)
        else:
            logging.error('ERROR: INDEX IS NOT AVAILABLE')
            raise(Exception("ERROR INDEX UNAVAILABLE"))

    def search(self, search_cmd, **kwargs):
        """Submit a new search.
        It is a wrapper to the private method _query.
        """
        return self._query(search_cmd, **kwargs)

    def _query(self, search_cmd, **kwargs):
        """Query.

        Note that earliest is inclusive & latest is exclusive:
                                                        [earliest, latest)
        (Prevents getting last-second events again during the next query)
        """
        job = self._splunkd.search(search_cmd, **kwargs)

        while not job.is_done():
            time.sleep(0.2)
        result = self.result_reader(job.results(count=0))
        if hasattr(result, 'job'):
            result.job = job
        return result
