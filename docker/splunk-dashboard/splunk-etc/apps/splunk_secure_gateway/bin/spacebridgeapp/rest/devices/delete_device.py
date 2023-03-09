"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for deleting a specific device
"""

import sys
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SESSION, AUTHTOKEN, SYSTEM_AUTHTOKEN, USER, QUERY, CODE
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.util.helper import extract_parameter
from spacebridgeapp.rest.services.device_service import delete_device
from http import HTTPStatus

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_delete_device")
DEVICE_KEY_LABEL = 'device_key'
DEVICE_OWNER = 'device_owner'


class DeleteDevice(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main rest handler class for the delete device functionality
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def post(self, request):
        """
        Deletes the specified device from the kvstore. Parses necessary data and credentials
        out of the request object, validates permissions, and makes the deletion request.

        Uses POST because DELETE method doesn't work from the Splunk UI
        """
        user = request[SESSION][USER]
        device_owner = user
        if DEVICE_OWNER in request[QUERY] and py23.py2_check_unicode(request[QUERY][DEVICE_OWNER]):
            device_owner = request[QUERY][DEVICE_OWNER]
        device_key = extract_parameter(request[QUERY], DEVICE_KEY_LABEL, QUERY)
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        user_authtoken = request[SESSION][AUTHTOKEN]

        LOGGER.info('Deleting device_key=%s in kvstore of device_owner=%s for user=%s'
                    % (device_key, device_owner, user))

        deleted = delete_device(user, device_owner, device_key, system_authtoken, user_authtoken)
        if len(deleted) == 0:
            return {
                'status': HTTPStatus.NOT_FOUND
            }

        if deleted[0][CODE] == HTTPStatus.OK:
            return {
                'payload': 'Device with key %s successfully deleted' % device_key,
                'status': HTTPStatus.OK,
            }
        else:
            raise Exception(deleted[0][CODE])


