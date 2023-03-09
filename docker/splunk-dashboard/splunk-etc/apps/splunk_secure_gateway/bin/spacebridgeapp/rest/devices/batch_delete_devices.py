"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for batch deleting devices
"""

import sys
import json

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path
from http import HTTPStatus

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SESSION, AUTHTOKEN, \
    PAYLOAD, SYSTEM_AUTHTOKEN, USER, QUERY

from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.device_service import delete_devices

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_batch_delete_devices")
DEVICE_OWNER = 'device_owner'


class BatchDeleteDevices(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main rest handler class for the batch delete device functionality
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def post(self, request):
        """
        Deletes the specified devices from the kvstore. Parses necessary data and credentials
        out of the request object, validates permissions, and makes the deletion request.

        Uses POST because DELETE method doesn't work from the Splunk UI
        """
        user = request[SESSION][USER]
        device_owner = user
        if DEVICE_OWNER in request[QUERY] and py23.py2_check_unicode(request[QUERY][DEVICE_OWNER]):
            device_owner = request[QUERY][DEVICE_OWNER]
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        user_authtoken = request[SESSION][AUTHTOKEN]

        device_keys = json.loads(request[PAYLOAD])
        count = len(device_keys)
        LOGGER.info('Deleting %d devices in kvstore of device_owner=%s for user=%s' % (count, device_owner, user))

        deleted = []
        if count > 0:
            deleted = delete_devices(user, device_owner, device_keys, system_authtoken, user_authtoken)

        if len(deleted) == 0:
            return {
                'status': HTTPStatus.NOT_FOUND
            }

        return {
            'payload': deleted,
            'status': HTTPStatus.OK,
        }

