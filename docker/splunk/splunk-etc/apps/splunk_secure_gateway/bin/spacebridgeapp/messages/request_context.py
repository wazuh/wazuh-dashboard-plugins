"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Object that store variables about the request context
"""
import uuid

from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.util.constants import AUTHTOKEN, HEADERS, HEADER_USER_AGENT, SESSION, SYSTEM_AUTHTOKEN, USER


class RequestContext(object):
    def __init__(self, auth_header,
                 request_id: str = None,
                 device_id: str = None,
                 raw_device_id: bin = None,
                 current_user: str = None,
                 is_alert: bool = False,
                 system_auth_header=None,
                 client_version=None,
                 user_agent=None,
                 shard_id=None):
        self.auth_header = auth_header
        self.request_id = request_id
        self.device_id = device_id
        self.raw_device_id = raw_device_id
        self.current_user = current_user
        self.is_alert = is_alert
        self.system_auth_header = system_auth_header
        self.client_version = client_version
        self.user_agent = user_agent
        self.shard_id = shard_id

    @staticmethod
    def from_rest_request(request):
        return RequestContext(
            auth_header=SplunkAuthHeader(request[SESSION][AUTHTOKEN]),
            request_id=str(uuid.uuid4()),
            current_user=request[SESSION][USER],
            system_auth_header=SplunkAuthHeader(request[SYSTEM_AUTHTOKEN]) if SYSTEM_AUTHTOKEN in request else None,
            user_agent=request.get(HEADERS, {}).get(HEADER_USER_AGENT)
        )

    def __repr__(self):
        return 'request_id={} device_id={} current_user={} is_alert={} shard_id={}'.format(self.request_id, self.device_id, self.current_user, self.is_alert, self.shard_id)

    def __str__(self):
        return self.__repr__()

    def __hash__(self):
        return hash(self._values_tuple())

    def __eq__(self, other):
        if not isinstance(other, RequestContext):
            return False
        return self._values_tuple() == other._values_tuple()

    def _values_tuple(self):
        values = vars(self)
        return tuple(sorted(values.items()))
