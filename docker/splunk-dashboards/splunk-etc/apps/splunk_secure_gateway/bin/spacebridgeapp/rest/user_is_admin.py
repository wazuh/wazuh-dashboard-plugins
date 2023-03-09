"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for checking if a user is admin
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
from spacebridgeapp.rest.base_endpoint import BaseRestHandler, build_error_payload
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, STATUS, PAYLOAD, SESSION, USER, AUTHTOKEN
from spacebridgeapp.rest.services.splunk_service import user_is_administrator

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_user_is_admin")


class UserIsAdmin(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the spacebridge_servers endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
          This will return a string indicating whether or not the current user is an admin.

          :param request
          :return:
          """
        try:
            session_token = request[SESSION][AUTHTOKEN]
            user_is_admin = user_is_administrator(session_token)

            return {STATUS: HTTPStatus.OK,
                    PAYLOAD: {'result': 'ok', 'payload': user_is_admin}}
        except splunk.RESTException as e:
            return build_error_payload(e)
