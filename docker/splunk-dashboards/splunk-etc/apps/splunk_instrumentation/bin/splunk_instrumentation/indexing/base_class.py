"""
BaseClass.

This base class manages connection to splunkd.
"""

import time

import splunk_instrumentation.splunklib as splunklib
from splunk_instrumentation.constants import SPLUNKRC, INST_APP_NAME
from splunk_instrumentation.splunkd import Splunkd


class BaseClass(object):
    """BaseClass."""

    def __init__(self, splunkrc=None, index_name=None, inst_key=None, inst_host=None, inst_port=None):
        """
        Constructor.

        Grab SPLUNKRC from parameter or from constants.py
        """
        self.splunkrc = splunkrc or SPLUNKRC
        self._splunkd_search = self.__connect_to_splunkd(search=True)
        self._splunkd = self.__connect_to_splunkd()

    # Public API
    # ----------
    def submit(self, event, host=None, source=None, sourcetype=None):
        """Submit a new event directly to the index."""
        self._index.submit(
            event, host=host, source=source, sourcetype=sourcetype)

    def search(self, search_cmd, **kwargs):
        """Submit a new search."""
        return self._query(search_cmd, **kwargs)

    # "Private" methods
    # -----------------

    def _set_index(self, name):
        if name:
            self.__ensure_index_exists(name)
            self._index = self._splunkd.indexes[name]
            self.index_name = name

    def __ensure_index_exists(self, name):
        if not self._splunkd.has_index(name):
            self._splunkd.indexes.create(name)

    def _query(self, search_cmd, **kwargs):
        """Query.

        Note that earliest is inclusive & latest is exclusive:
                                                        [earliest, latest)
        (Prevents getting last-second events again during the next query)
        """
        job = self._splunkd_search.search(search_cmd, **kwargs)

        while not job.is_done():
            time.sleep(0.2)

        return splunklib.results.ResultsReader(job.results(count=0))

    def __connect_to_splunkd(self, search=False):
        if search:
            # WITH NAMESPACE
            splunkrc_copy = {key: self.splunkrc[key] for key in self.splunkrc}
            if 'owner' not in splunkrc_copy:
                splunkrc_copy['owner'] = '-'
            if 'app' not in splunkrc_copy:
                splunkrc_copy['app'] = INST_APP_NAME

            return Splunkd(**splunkrc_copy)
        else:
            splunkrc_copy = {key: self.splunkrc[key] for key in self.splunkrc}

            if 'owner' in splunkrc_copy:
                splunkrc_copy.pop('owner')
            if 'app' in splunkrc_copy:
                splunkrc_copy.pop('app')
            return Splunkd(**self.splunkrc)
