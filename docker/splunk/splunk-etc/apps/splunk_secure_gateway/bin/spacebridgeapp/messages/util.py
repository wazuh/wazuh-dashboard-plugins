"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
import base64
import sys
from cloudgateway.device import DeviceInfo
from http import HTTPStatus
from spacebridgeapp.util import py23
from spacebridgeapp.exceptions.key_not_found_exception import KeyNotFoundError
from spacebridgeapp.util.constants import DEVICE_PUBLIC_KEYS_COLLECTION_NAME


__device_cache = {}


async def fetch_device_info(device_id, async_kvstore_client, system_auth_header):
    """
    Fetch the DeviceInfo for a particular device ic
    :param device_id:
    :param async_kvstore_client:
    :param system_auth_header:
    :return: cloudgateway.device.DeviceInfo
    """
    key_id = py23.urlsafe_b64encode_to_str(device_id)

    if key_id in __device_cache:
        return __device_cache[key_id]

    response = await async_kvstore_client.async_kvstore_get_request(DEVICE_PUBLIC_KEYS_COLLECTION_NAME,
                                                                         auth_header=system_auth_header,
                                                                         key_id=key_id)

    if response.code == HTTPStatus.OK:
        parsed = await response.json()
        result = DeviceInfo(
            base64.b64decode(parsed['encrypt_public_key']),
            base64.b64decode(parsed['sign_public_key']),
            device_id)

        __device_cache[key_id] = result
        return result
    else:
        raise KeyNotFoundError(key_id, response.code)

