import splunk_instrumentation.splunklib as splunklib
import splunk_instrumentation.constants as constants


class ServerInfoService(object):
    def __init__(self, service):
        self.data = None  # populated by `fetch` method
        self.service = service

    def fetch(self):
        """
        Returns the response from the server/info endpoint
        parsed into a dictionary. Saves the response as self.data.
        """
        resp = self.service.request(
            constants.ENDPOINTS['SERVER_INFO'],
            method="GET")

        self.data = (splunklib.data.load(resp.get('body').read()))
        return self.data

    @property
    def data(self):
        if self._data is None:
            raise Exception("You must call `fetch` on the service before attempting to access data")
        return self._data

    @data.setter
    def data(self, value):
        self._data = value

    @property
    def content(self):
        return self.data['feed']['entry']['content']

    def is_cloud(self):
        return 'cloud' in (self.content.get('instance_type') or '').lower()

    def is_lite(self):
        return 'lite' in (self.content.get('product_type') or '').lower()
