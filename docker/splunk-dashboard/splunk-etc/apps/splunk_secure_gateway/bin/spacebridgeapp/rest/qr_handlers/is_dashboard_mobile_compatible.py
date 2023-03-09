"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for checking if a dashboard is compatible with mobile apps, based
on the dashboard_id
"""

import sys
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.util.helper import extract_parameter

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_is_dashboard_mobile_compatible")

DASHBOARD_ID_LABEL = 'dashboard_id'


class IsDashboardMobileCompatible(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the devices_user endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Handler which checks if a dashboard is compatible with mobile
        """
        # Extracts request data
        user = request['session']['user']
        dashboard_id = extract_parameter(request['query'], DASHBOARD_ID_LABEL, 'query')

        # TODO: This.
        is_compatible = True

        LOGGER.info('Checked mobile compatibility of dashboard_id=%s for user=%s. is_compatible=%s' %
                    (dashboard_id, user, is_compatible))

        # Generates and returns the QR code
        return {
            'payload': {
                'valid': is_compatible,
            },
            'status': 200,
        }
