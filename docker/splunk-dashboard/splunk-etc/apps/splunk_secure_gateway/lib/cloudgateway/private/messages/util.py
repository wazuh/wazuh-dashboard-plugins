import uuid


class RequestContext(object):
    def __init__(self, auth_header,
                 request_id=None,
                 device_id=None,
                 current_user=None,
                 system_auth_header=None,
                 client_version=None):
        self.auth_header = auth_header
        self.request_id = request_id
        self.device_id = device_id
        self.current_user = current_user
        self.system_auth_header = system_auth_header
        self.client_version = client_version

    def __repr__(self):
        return 'request_id={} device_id={} current_user={}'.format(self.request_id, self.device_id, self.current_user)

    def __str__(self):
        return self.__repr__()


