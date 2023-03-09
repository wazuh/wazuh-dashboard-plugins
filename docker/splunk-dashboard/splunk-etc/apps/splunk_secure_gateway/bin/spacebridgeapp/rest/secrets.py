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
from spacebridgeapp.util.constants import MTLS_KEY, MTLS_CERT

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "secrets_handler")


_ALLOWED_SECRETS = [MTLS_KEY, MTLS_CERT]


class SecretsStore(BaseRestHandler, PersistentServerConnectionApplication):

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def post(self, request):
        """
        Fetch public and private keys for signing messages from the passwords endpoint
        :param request:
        :return:
        """
        LOGGER.info('Received request for storing secrets %s', request)
        user_token = request['session']['authtoken']
        secret_name = request['path_info']
        secret_value = request['payload']

        if secret_name not in _ALLOWED_SECRETS:
            return _error(400, 'invalid secret_name, not in allowed values')

        LOGGER.info('Received request for storing secrets %s %s', user_token, secret_name)
        return _store_secret(user_token, secret_name, secret_value)


def _error(status_code, message):
    return {
        'payload': {
            'result': 'error',
            'error': message
        },
        'status': status_code
    }


def _store_secret(user_authtoken, secret_name, secret_value):
    splunk_service.update_or_create_sensitive_data(user_authtoken, secret_name, secret_value)

    return {
        'payload': {
            'result': 'ok'
        },
        'status': 200,
    }
