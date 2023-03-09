"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for restarting SSG modular inputs
"""

import sys
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services import splunk_service

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "restart_ssg")

class RestartSsgInputs(BaseRestHandler, PersistentServerConnectionApplication):

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def post(self, request):
        """
        Restart modular inputs associated to SSG
        """
        LOGGER.info("Received request to restart SSG modular inputs")
        user_token = request['session']['authtoken']
        return _restart_inputs(user_token)


def _restart_inputs(user_authtoken):
    responses = splunk_service.restart_all_modular_inputs(user_authtoken)
    return {
        'status': 200,
        'payload': responses
    }

