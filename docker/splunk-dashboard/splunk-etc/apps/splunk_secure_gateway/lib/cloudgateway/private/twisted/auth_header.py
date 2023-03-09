import sys

from cloudgateway.private.util.splunk_auth_header import SplunkAuthHeader
from twisted.internet import defer
from twisted.web import http


class SplunkAuthHeader(SplunkAuthHeader):
    @defer.inlineCallbacks
    def validate(self, async_splunk_client):
        """
        Validate this auth_header
        """
        response = yield async_splunk_client.async_get_current_context(auth_header=self)
        if response.code == http.OK:
            defer.returnValue(True)
        defer.returnValue(False)
