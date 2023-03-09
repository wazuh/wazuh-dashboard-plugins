"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import sys
from functools import reduce

from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.devices.util import augment_device_with_metadata
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.splunk_service import get_all_mobile_users, get_all_users, \
    get_devices_for_user, get_devices_metadata, user_is_administrator
from http import HTTPStatus


LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_users_devices")


class DevicesForUser(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the devices_user endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Handler which retrieves all devices in the kvstore belonging to all users.
        """
        # Retrieves all devices from that user's devices kvstore collection
        LOGGER.info('Getting devices in kvstore belonging to all users for user=%s' % request['session']['user'])
        authtoken = request['session']['authtoken']
        all_devices = get_devices_for_registered_users(authtoken)
        devices_meta = get_devices_metadata(authtoken)
        augment_device_with_metadata(all_devices, devices_meta)

        return {
            'payload': all_devices,
            'status': 200
        }



def get_devices_for_registered_users(authtoken):
    """
    This function gets all devices from the kvstore owned by all users (or the users viewable
    using the supplied authorization token). This function:
        1. Generates a list of Splunk users
        2. Retrieves lists of all devices from each user's devices kvstore collection and concatenates them together

    :param authtoken: Authorization token to supply to the kvstore interface
    :return: List of devices
    """

    # This branching logic is necessary as a work around to an issue with the /authentication/users endpoint in Core
    # The bug blocks inherited admins are not able to view other admins,
    # which is an issue on cloud instances because of sc_admins
    users = [user for user in get_all_mobile_users(authtoken)]

    if not user_is_administrator(authtoken):
        users = [user for user in users if user in get_all_users(authtoken)]

    devices = reduce(lambda acc, user: acc + get_devices_for_user(user, authtoken), users, [])
    return devices
