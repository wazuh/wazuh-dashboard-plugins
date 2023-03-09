from __future__ import absolute_import
import os
import threading
from time import sleep

# local imports
import logger_manager as log
from rapid_diag.collector.collector import Collector
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.serializable import Serializable

# splunk imports
import splunk
from splunklib import six
import splunklib.client as client
from splunklib.client import AuthenticationError

_LOGGER = log.setup_logging("search_result")
MAX_RETRIES = 3


class SearchResult(Collector):
    """
    RapidDiag collector allows to collect search results.
    """

    def __init__(self, search_query : str = "", state : Collector.State = Collector.State.WAITING):
        Collector.__init__(self)
        self.search_query : str = search_query
        self.state : Collector.State = state

    def get_type(self):
        return Collector.Type.CONTINUOUS

    def get_required_resources(self):
        return []

    def __repr__(self):
        return "Search Result(Search query: %s)\n" % (self.search_query)

    def needs_auth(self):
        return True

    def _get_json(self):
        return {
            'search_query': self.search_query,
        }

    @staticmethod
    def validate_json(obj):
        data_types = {"search_query": (six.text_type,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj):
        ret = SearchResult(obj['search_query'], Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])
        ret.set_result(obj.get("result", None))
        return ret

    def _collect_impl(self, run_context): # pylint: disable=too-many-branches
        """collects search results based on provided query using Splunk Python SDK."""
        _LOGGER.info('Starting search result collector, output_dir="%s" suffix="%s" search_query="%s"',
                      run_context.output_dir, run_context.suffix, self.search_query)
        _LOGGER.debug("Task assigned to thread: %s", str(threading.current_thread().name))
        fname = os.path.join(run_context.output_dir, 'search' + run_context.suffix + '.csv')
        job = None
        aborted_before_done = False
        retries = MAX_RETRIES

        # splunklib is having issue with auto-login flag: https://github.com/splunk/splunk-sdk-python/issues/219.
        # Due to this currently retrying doesn't help for re-connecting to logged in session.
        # As and when the issue will get fixed in splunklib, functionality will work properly.
        while retries > 0:
            try:
                service = client.connect(host=splunk.getDefault('host'),
                                        port=splunk.getDefault('port'),
                                        scheme=splunk.getDefault('protocol'),
                                        token=run_context.session_token,
                                        autologin=True)

                kwargs_export = {"output_mode": "csv", "exec_mode": "normal"}
                search_query = self.search_query
                if not self.search_query.lstrip().startswith('|'):
                    search_query = '| search ' + search_query
                job = service.jobs.create(search_query, **kwargs_export)

                # waiting till the job is ready
                while not job.is_ready():
                    pass

                while not job.is_done():
                    # finalizing the job, if collection is aborted before the job.is_done() returns True
                    # this way intermediate results can be stored
                    if self.get_state() == Collector.State.ABORTING:
                        aborted_before_done = True
                        job.finalize()
                        break
                    sleep(.2)

                result_count = int(job["resultCount"])
                _LOGGER.debug("Result Count is %s", str(result_count))

                if result_count == 0:
                    with open(fname, "w") as output_file:
                        output_file.write("No results found")
                    break

                # writing the data fetched in batches, so as to not overload the system
                for offset in range(0, result_count, 1000):
                    with open(fname, "a") as output_file:
                        results = job.results(offset=offset, count=1000, output_mode='csv')
                        # generally job.is_done() returns True quickly
                        # most of the time is taken in retrieving and writing the results
                        # so if abort is called in between writing the results, we return
                        # checking aborted_before_done, so as to not return before writing
                        if not aborted_before_done and self.get_state() == Collector.State.ABORTING:
                            return CollectorResult.Aborted('Search Result collector aborted by user', _LOGGER)
                        header = results.readline().decode('utf-8')
                        if offset == 0:
                            output_file.write(header)
                        output_file.write(results.read().decode('utf-8'))
                break

            except AuthenticationError:
                retries -= 1
                if retries == 0:
                    return CollectorResult.Failure('Request failed: Search session token timed out.', _LOGGER)
                sleep(.2)
                _LOGGER.info("Session expired. Retrying to login")
            except ConnectionError:
                _LOGGER.info("Connection reset by peer")
            except Exception as e: # pylint: disable=broad-except
                if job is not None:
                    job.cancel()
                return CollectorResult.Exception(e, "Error while collecting data from " + self.__class__.__name__, _LOGGER)
            finally:
                # returning if aborted between retries
                if self.get_state() == Collector.State.ABORTING:
                    return CollectorResult.Aborted('Search Result collector aborted by user', _LOGGER) # pylint: disable=lost-exception

        return CollectorResult.Success('search result execution completed', _LOGGER)


Serializable.register(SearchResult)
