
from splunk import rest as rest

import json
import requests
import sys
from cloudgateway.private.twisted.clients.async_client import AsyncClient
from cloudgateway.auth import SimpleUserCredentials, UserAuthCredentials
from cloudgateway.splunk.auth import SplunkJWTCredentials, SplunkAuthHeader
from cloudgateway.private.util import constants

from twisted.internet import defer
from twisted.web import http


class TxSplunkAuthHeader(SplunkAuthHeader):
    """
    Wrapper for a splunk session token. Returns a splunk auth header when stringified
    to be used on HTTP requests to Splunk's REST apis
    """
    def __init__(self, session_token):
        self.session_token = session_token

    def __repr__(self):
        return 'Splunk {0}'.format(self.session_token)

    @defer.inlineCallbacks
    def validate(self, async_splunk_client):
        """
        Check if this auth header is valid or not against Splunk
        """
        response = yield async_splunk_client.async_get_current_context(auth_header=self)
        if response.code == http.OK:
            defer.returnValue(True)
        defer.returnValue(False)

class TxSplunkJWTMDMCredentials(SplunkJWTCredentials):

    def __init__(self, username, password=None):
        self.username = username
        self.password = password
        self.token = None
        self.async_client = AsyncClient()

    @defer.inlineCallbacks
    def load_jwt_token(self, system_auth, audience=constants.CLOUDGATEWAY):
        if self.password:
            self.token = yield self.fetch_jwt_token_from_basic_creds(self.username, self.password, audience)
        else:
            self.token = yield self.fetch_jwt_token_from_session_key(self.username, system_auth, audience)

    @defer.inlineCallbacks
    def fetch_jwt_token_from_basic_creds(self, username, password, audience):
        """
        Creates a new JWT token for the given user

        :param username: User-supplied username
        :param password: User-supplied password
        :param audience: User-supplied purpose of this token
        :return: JWT token for given user
        """

        url = self.jwt_token_url()
        data = self.jwt_token_data(username, audience)

        headers = {constants.HEADER_CONTENT_TYPE: constants.APPLICATION_JSON}

        r = yield self.async_client.async_post_request(url, None, auth=(username, password), data=data, headers=headers)

        if r.code != http.CREATED:
            text = yield r.text()
            raise Exception('Exception creating JWT token with code={}, message={}'.format(r.code, text))

        response = yield r.json()
        defer.returnValue(response['entry'][0]['content']['token'])

    @defer.inlineCallbacks
    def fetch_jwt_token_from_session_key(self, username, system_auth_header, audience):
        """
        Creates a new JWT token for the given user

        :param username: User-supplied username
        :param session_key: Session key supplied to user from Splunk
        :param audience: User-supplied purpose of this token
        :return: JWT token for given user
        """
        url = self.jwt_token_url()
        data = self.jwt_token_data(username, audience)

        headers = {
            constants.HEADER_CONTENT_TYPE: constants.APPLICATION_JSON,
            constants.HEADER_AUTHORIZATION: '{}'.format(system_auth_header),
            constants.HEADER_CONTENT_TYPE: constants.CONTENT_TYPE_FORM_ENCODED
        }

        r = yield self.async_client.async_post_request(url, None, data=data, headers=headers)

        if r.code != http.CREATED:
            text = yield r.text()
            raise Exception('Exception creating JWT token with code={}, message={}'.format(r.code, text))

        response = yield r.json()
        defer.returnValue(response['entry'][0]['content']['token'])


