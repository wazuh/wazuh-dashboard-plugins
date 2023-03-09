from future import standard_library
standard_library.install_aliases()
from builtins import object
import re
import splunk_instrumentation.splunklib as splunklib
import splunk_instrumentation.constants as constants
from urllib.parse import urlencode


class TelemetryConfService(object):
    '''
    Service object for accessing the telemetry.conf file.
    '''

    def __init__(self, service, is_read_only=False):
        self.data = None  # populated by `fetch` method
        self.service = service

        self.is_read_only = is_read_only
        self.endpoint = constants.ENDPOINTS['APP_INFO']['INFO']
        if self.is_read_only:
            self.endpoint = constants.ENDPOINTS['APP_INFO']['READONLY_INFO']

    def assert_writable(self):
        '''
        Raises if the current instance is read-only
        '''
        if self.is_read_only:
            raise Exception("Attempting to write to read-only service")

    def update(self, settings):
        """
        Posts the values from the `settings` dictionary to
        the telemetry/general endpoint.
        """
        self.assert_writable()
        query = urlencode(settings)
        # Will throw unless request is successful
        resp = self.service.request(self.endpoint,
                                    method="POST",
                                    body=query,
                                    owner='nobody',
                                    app=constants.INST_APP_NAME)
        self.data = (splunklib.data.load(resp.get('body').read()))
        return self.data

    def fetch(self):
        """
        Returns the response from the telemetry/general endpoint
        parsed into a dictionary. Saves the response as self.data.
        """
        resp = self.service.request(
            self.endpoint,
            method='GET',
            owner='nobody',
            app=constants.INST_APP_NAME)
        self.data = (splunklib.data.load(resp.get('body').read()))
        return self.data

    def retry_cluster_master_sync_transaction(self):
        '''
        Called through the instance_profile when the scripted input
        is run on the search head captain (or the solitary search head)
        '''
        self.assert_writable()
        retryTransaction = self.content.get('retryTransaction')
        if retryTransaction:
            queryObj = {}

            for field in constants.CLUSTER_MASTER_REQUIRED_CONF_FIELDS:
                queryObj[field] = self.content.get(field)

            query = urlencode(queryObj)
            retryTransactions = retryTransaction.split(",")

            for retryTransaction in retryTransactions:
                query += '&' + urlencode({"retryTransaction": retryTransaction})

            try:
                self.service.request(constants.ENDPOINTS['APP_INFO']['RETRY'],
                                     method="POST",
                                     body=query,
                                     owner='nobody',
                                     app=constants.INST_APP_NAME)
            except Exception:
                return False
            return True

    @property
    def data(self):
        '''
        Gets the result data member. Warns about the `fetch` call prereq
        if no result data is available.
        '''
        if self._data is None:
            raise Exception("You must call `fetch` on the service before attempting to access data")
        return self._data

    @data.setter
    def data(self, value):
        '''
        Sets the result data member.
        '''
        self._data = value

    @property
    def content(self):
        '''
        Convenience method to get the content node from the result data.
        '''
        return self.data['feed']['entry']['content']

    def opt_in_is_up_to_date(self):
        '''
        Determines whether the current opt-in is up to date with regards
        to user acknowledgment of the current terms.
        '''
        opt_in_version_str = self.content.get('optInVersion') or ''
        opt_in_version_acknowledged_str = self.content.get('optInVersionAcknowledged') or ''

        if not re.match('^[0-9]+$', opt_in_version_str):
            opt_in_version_str = None
        if not re.match('^[0-9]+$', opt_in_version_acknowledged_str):
            opt_in_version_acknowledged_str = None

        opt_in_version = int(opt_in_version_str) if opt_in_version_str else None
        opt_in_version_acknowledged = int(opt_in_version_acknowledged_str) if opt_in_version_acknowledged_str else None

        if not opt_in_version:
            # Should only happen if somebody removes the field manually
            # In that case, fall back to legacy behavior (ignore this check)
            return True

        if not opt_in_version_acknowledged:
            # Passed the check above, so we have a version number but no acknowledgement.
            # So, they're not up-to-date.
            return False

        return opt_in_version_acknowledged >= opt_in_version
