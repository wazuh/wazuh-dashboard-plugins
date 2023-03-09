"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for checking if tokens are enabled
"""

import sys

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23

from http import HTTPStatus
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.splunk_service import get_tokens_enabled


class TokensEnabledHandler(BaseRestHandler, PersistentServerConnectionApplication):
    """
        Main class for handling REST tokens enabled endpoint. Subclasses the spacebridge_app
        BaseRestHandler. This multiple inheritance is an unfortunate neccesity based on the way
        Splunk searches for PersistentServerConnectionApplications
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        system_authtoken = request['system_authtoken']
        tokens_enabled = get_tokens_enabled(system_authtoken)

        return {
            'payload': {
                'tokens_enabled': tokens_enabled
            },
            'status': HTTPStatus.OK
        }

