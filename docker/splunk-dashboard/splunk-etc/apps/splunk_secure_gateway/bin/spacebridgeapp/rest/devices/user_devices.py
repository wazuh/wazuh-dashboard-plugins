"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for getting the devices in the kvstore belonging to a specific user
"""

import base64
import json
import sys

from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.util import py23
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.devices.util import augment_device_with_metadata
from spacebridgeapp.rest.services.splunk_service import get_devices_for_user, get_devices_metadata
from spacebridgeapp.exceptions.key_not_found_exception import KeyNotFoundError

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_user_devices")


class DevicesForUser(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the devices_user endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Handler which retrieves all devices in the kvstore belonging to a specific user. This function:
            1. Identifies the user to retrieve for, either the current user or one specified in a query param.
            2. Retrieves all devices from that user's devices kvstore collection
        """

        # Identifies the user to retrieve for, either the current user or one specified in a query param.
        authtoken = request['session']['authtoken']
        user = request['session']['user']
        if 'user' in request['query'] and py23.py2_check_unicode(request['query']['user']):
            user = request['query']['user']

        LOGGER.info('Getting devices in kvstore of devices_owner=%s for user=%s' % (user, request['session']['user']))

        # Retrieves all devices from that user's devices kvstore collection
        user_devices = get_devices_for_user(user, authtoken)
        devices_meta = get_devices_metadata(authtoken)
        augment_device_with_metadata(user_devices, devices_meta)
        
        return {
            'payload': user_devices,
            'status': 200,
        }


__public_key_cache = {}


async def public_keys_for_device(device_id, auth_header, async_kvstore_client):
    """
    Fetch the public keys for a given device, which can be then used to verify signatures or encrypt messages before
    sending.
    :param device_id: An un-encoded device id of the device
    :param auth_header: A valid splunk header, e.g. SplunkAuthHeader, BasicAuthHeader or JWTAuthHeader
    :param async_kvstore_client: AsyncKvStoreClient
    :return: A tuple of (signing_public_key, encryption_public_key), un-encoded
    """

    key_id = py23.urlsafe_b64encode_to_str(device_id)

    if key_id in __public_key_cache:
        return __public_key_cache[key_id]

    response = await async_kvstore_client.async_kvstore_get_request(constants.DEVICE_PUBLIC_KEYS_COLLECTION_NAME,
                                                                    auth_header=auth_header,
                                                                    key_id=key_id)

    if response.code == HTTPStatus.OK:
        parsed = await response.json()
        result = (
            base64.b64decode(parsed['sign_public_key']),
            base64.b64decode(parsed['encrypt_public_key']))

        __public_key_cache[key_id] = result
        return result
    else:
        raise KeyNotFoundError(key_id, response.code)
