"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for testing JWT creation
"""
import sys

import splunk
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from cloudgateway.splunk.auth import SplunkJWTCredentials
from cloudgateway.private.sodium_client import SodiumClient
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.splunk_service import delete_token_by_id

from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SYSTEM_AUTHTOKEN, SESSION, STATUS, JWT, \
    USER, PAYLOAD, MESSAGE
from spacebridgeapp.util.config import secure_gateway_config as config

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_test_jwt")
DEFAULT_SPACEBRIDGE_SERVER = config.get_spacebridge_server()


class TestJwt(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the test_Jwt endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
        This will return True/False depending if the user has properly setup JWT tokens

        :param request
        :return:
        """

        # Setup
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        user = request[SESSION][USER]
        is_jwt_token = False

        # Attempt to create JWT Token, if any error occurs we want to log it, but still return False
        try:
            jwt_credentials = SplunkJWTCredentials(user)
            jwt_credentials.load_jwt_token(SplunkAuthHeader(system_authtoken))
            is_jwt_token = True if jwt_credentials.token_id else False

        except Exception as e:
            error_msg = "Failed to create JWT token for user = {}, error = {}".format(user,e)
            LOGGER.debug(error_msg)
            return {
                STATUS: HTTPStatus.PRECONDITION_REQUIRED,
                PAYLOAD: {MESSAGE: error_msg}
            }

        # If JWT token was successfully created, clean it up
        if is_jwt_token:
            delete_token_by_id(system_authtoken, user, jwt_credentials.token_id)

        return {
            STATUS: HTTPStatus.OK,
            PAYLOAD: {JWT: is_jwt_token}
        }
