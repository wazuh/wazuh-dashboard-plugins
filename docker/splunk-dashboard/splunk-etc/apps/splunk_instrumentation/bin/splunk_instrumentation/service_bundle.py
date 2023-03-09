from splunk_instrumentation.splunkd import Splunkd
from splunk_instrumentation.telemetry_conf_service import TelemetryConfService
from splunk_instrumentation.server_info_service import ServerInfoService


class ServiceBundle(object):
    '''
    Bundles common service objects used in instrumentation.

    We often want to share service objects to reduce round trips
    back to the server. This bundle shall ensure that new services
    are created with existing instances of their dependencies, if
    available. Else, they are created anew as needed.
    '''

    def __init__(self,
                 splunkd,
                 telemetry_conf_service=None,
                 server_info_service=None):
        self.splunkd = Splunkd.decorate(splunkd)
        self._telemetry_conf_service = telemetry_conf_service
        self._server_info_service = server_info_service

    @property
    def telemetry_conf_service(self):
        if self._telemetry_conf_service is None:
            self._telemetry_conf_service = TelemetryConfService(self.splunkd)
            self._telemetry_conf_service.fetch()

        return self._telemetry_conf_service

    @property
    def server_info_service(self):
        if self._server_info_service is None:
            self._server_info_service = ServerInfoService(self.splunkd)
            self._server_info_service.fetch()

        return self._server_info_service
