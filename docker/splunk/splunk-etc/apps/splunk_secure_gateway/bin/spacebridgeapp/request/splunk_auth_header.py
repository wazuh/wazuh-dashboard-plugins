"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from http import HTTPStatus


class SplunkAuthHeader(object):
    def __init__(self, session_token):
        self.session_token = session_token

    def __repr__(self):
        return 'Splunk %s' % self.session_token

    def __eq__(self, other):
        return self.session_token == getattr(other, 'session_token', None)

    def __hash__(self):
        return hash(self.session_token)

    async def validate(self, async_splunk_client):
        """
        Validate this auth_header
        """
        response = await async_splunk_client.async_get_current_context(auth_header=self)
        if response.code == HTTPStatus.OK:
            return True
        return False
