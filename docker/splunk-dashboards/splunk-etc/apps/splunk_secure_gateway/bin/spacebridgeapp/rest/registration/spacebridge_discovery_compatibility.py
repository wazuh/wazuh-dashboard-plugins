"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for getting spacebridge discovery compatibility
"""
import sys
import requests
import json

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from cloudgateway.private.sodium_client import SodiumClient
from spacebridgeapp.rest.util.errors import SpacebridgeRestError
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, STATUS, PAYLOAD, SPACEBRIDGE_SERVER, MESSAGE, QUERY

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_discovery_compatibility")

class DiscoveryCompatibility(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the spacebridge_discovery_compatibility endpoint.

    This method is essentially just a wrapper for the Spacebridge Discovery endpoint so
    that we can modify compatibility dynamically as other Splunk Apps adopt Spacebridge Discovery.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
          This will return the list of spacebridge servers from spacebridge discovery.

          :param request
          :return json response with list of not_supported and supported apps:
          """

        spacebridge_server = request[QUERY].get(SPACEBRIDGE_SERVER)

        if not spacebridge_server:
            return {STATUS: HTTPStatus.BAD_REQUEST,
                    PAYLOAD: {MESSAGE: "Please provide a Spacebridge server."}}

        try:
            response = requests.get(
                url=f'https://{spacebridge_server}/api/compatibility'
            )

            if not response.ok:
                raise SpacebridgeRestError(message=str(response.content), status=response.status_code)

            response_json = json.loads(response.content)
            return {STATUS: HTTPStatus.OK,
                    PAYLOAD: response_json}

        except Exception as e:
            return {STATUS: HTTPStatus.NOT_FOUND,
                    PAYLOAD: {MESSAGE: "Please provide a valid Spacebridge server."}}
