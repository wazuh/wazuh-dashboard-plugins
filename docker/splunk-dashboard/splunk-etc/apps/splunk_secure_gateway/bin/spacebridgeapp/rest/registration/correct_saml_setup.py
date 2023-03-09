"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for checking correct SAML setup
"""
import json
import sys
from typing import Tuple, List
from operator import itemgetter

import splunk
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from cloudgateway.private.sodium_client import SodiumClient
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.splunk_service import authenticate_saml

from spacebridgeapp.util.constants import ENTRY, CONTENT, SYSTEM_AUTHTOKEN, SPACEBRIDGE_APP_NAME, \
    SESSION, STATUS, PAYLOAD, USER, PROTOCOL_ENDPOINTS, SAML, MESSAGE
from spacebridgeapp.util.config import secure_gateway_config as config

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_correct_saml_setup")
DEFAULT_SPACEBRIDGE_SERVER = config.get_spacebridge_server()


class CorrectSamlSetup(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the correct_saml_setup endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
        This will return the True/False depending if SAML was setup correctly by checking
        if either the AQR or Scripted Authentication fulfill the appropriate requirements

        :param request
        :return:
        """

        # Setup
        system_authtoken = request[SYSTEM_AUTHTOKEN]

        # Required Fields
        AQR_FIELDS = ["attributeQueryRequestSigned",
                      "attributeQueryResponseSigned",
                      "attributeQuerySoapUsername"]
        PROTOCOL_FIELDS = ["idpAttributeQueryUrl"]
        SCRIPTED_AUTH_FIELDS = ["scriptPath",
                                "scriptTimeout",
                                "getUserInfoTtl",
                                "useAuthExtForTokenAuthOnly",
                                "scriptFunctions",
                                "scriptSecureArguments"]

        # Initialize response
        requirements = dict.fromkeys(AQR_FIELDS + PROTOCOL_FIELDS + SCRIPTED_AUTH_FIELDS, False)

        try:
            saml_auth_response = authenticate_saml(system_authtoken)
            saml_auth_entry = saml_auth_response.get(ENTRY, None)

            if not saml_auth_entry:
                requirements[SAML] = False
                return {STATUS: 200, PAYLOAD: requirements}

            saml_auth_content = saml_auth_entry[0].get(CONTENT, {})
            saml_auth_protocol = saml_auth_content.get(PROTOCOL_ENDPOINTS, {})

            # Parse Splunk content for desired fields and update requirement response object accordingly
            requirements = update_requirements(content_lists=[saml_auth_content, saml_auth_protocol, saml_auth_content],
                                               field_lists=[AQR_FIELDS, PROTOCOL_FIELDS, SCRIPTED_AUTH_FIELDS],
                                               requirements=requirements)

            aqr_requirements = [requirements[aqr_field] for aqr_field in AQR_FIELDS]
            protocol_requirements = [requirements[protocol_field] for protocol_field in PROTOCOL_FIELDS]
            scripted_requirements = [requirements[scripted_field] for scripted_field in SCRIPTED_AUTH_FIELDS]

            # Check if SAML setup is correct
            requirements[SAML] = all(aqr_requirements + protocol_requirements) or all(scripted_requirements)

            return {
                STATUS: HTTPStatus.OK,
                PAYLOAD: requirements
            }
        except splunk.RESTException as e:
            return {
                STATUS: e.statusCode,
                PAYLOAD: {MESSAGE: "Failed to get SAML requirement fields, error=%s" % e.msg}
            }


def update_requirements(content_lists: list, field_lists: list, requirements: dict) -> dict:
    for content, fields in zip(content_lists, field_lists):
        for field in fields:
            requirements[field] = True if content.get(field, None) else False

    return requirements
