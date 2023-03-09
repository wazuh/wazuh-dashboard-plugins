"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for fetching public and private keys necessary for signing cloud gateway messages
"""

import sys
import json
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services import splunk_service
from spacebridgeapp.util.constants import ENCRYPTION_KEYS

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "sign_credentials_handler")


class SignCredentialsHandler(BaseRestHandler, PersistentServerConnectionApplication):

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Fetch public and private keys for signing messages from the passwords endpoint
        :param request:
        :return:
        """
        LOGGER.info('Received request for fetching encrypted credentials')
        system_authtoken = request['system_authtoken']
        return fetch_credentials(system_authtoken)


def fetch_credentials(system_authtoken):
    raw_data = json.loads(splunk_service.fetch_sensitive_data(system_authtoken, ENCRYPTION_KEYS))

    return {
        'payload': {
            constants.SIGN_PRIVATE_KEY: raw_data[constants.SIGN_PRIVATE_KEY],
            constants.SIGN_PUBLIC_KEY: raw_data[constants.SIGN_PUBLIC_KEY],
        },
        'status': 200,
    }
