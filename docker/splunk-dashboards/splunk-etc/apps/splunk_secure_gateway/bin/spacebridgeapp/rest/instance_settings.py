"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for returning instance settings
"""
import sys
import splunk
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from cloudgateway.private.sodium_client import SodiumClient
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, STATUS, PAYLOAD, SYSTEM_AUTHTOKEN, AUTH_TYPE, MESSAGE
from spacebridgeapp.rest.services.splunk_service import get_splunk_auth_type

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_instance_settings")


class InstanceSettings(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the instance_settings endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
          Returns instance settings. Currently just returns authentication_type, can be expanded in the future.

          :param request
          :return:
          """
        try:
            auth_token = request[SYSTEM_AUTHTOKEN]
            auth_type = get_splunk_auth_type(auth_token).decode('utf-8')

            return {
                STATUS: HTTPStatus.OK,
                PAYLOAD: {
                    AUTH_TYPE: auth_type
                }
            }
        except splunk.RESTException as e:
            err_msg = 'An error occurred fetching instance settings, error={}'.format(e)
            LOGGER.exception(err_msg)

            return {
                STATUS: e.statusCode,
                PAYLOAD: {MESSAGE: err_msg}
            }
