"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""
import asyncio
import json
import splunk
import splunk.rest as rest

from collections import defaultdict
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore
from spacebridgeapp.rest.services.spacebridge_service import async_delete_device_from_spacebridge
from spacebridgeapp.rest.services.splunk_service import get_devices_for_user, get_all_users, \
     user_has_registered_devices, get_all_mobile_users
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, NOBODY, USER_KEY, KEY, DEVICE_ID, CODE, \
     REGISTERED_DEVICES_COLLECTION_NAME, DEVICE_PUBLIC_KEYS_COLLECTION_NAME, REGISTERED_USERS_COLLECTION_NAME
from spacebridgeapp.util.kvstore import build_containedin_clause
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.util.mtls import build_mtls_spacebridge_client
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from http import HTTPStatus
from spacebridgeapp.rest.devices.users_devices import get_devices_for_registered_users

BATCH_SIZE = 10

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "device-service")


def delete_device(user, device_owner, device_key, system_authtoken, user_authtoken):
    """
    Deletes device from the KvStore and unregisters it from Spacebridge service.  This function:
        1. Checks if the user has the necessary privileges to delete the given device
        2. Attempts to delete the device from the kvstore

    :param user: User making the deletion request
    :param device_owner: User who owns the device being deleted
    :param device_key: kvstore _key of the device being deleted
    :param system_authtoken: Authorization token with system-level privileges. Used to allow users to delete
    their own devices even when they don't have unrestricted kvstore write access
    :param user_authtoken: Authorization token with the same permissions as "user"
    :return:
    """
    return delete_devices(user, device_owner, [device_key], system_authtoken, user_authtoken)


def delete_devices(user, device_owner, device_keys, system_authtoken, user_authtoken):
    """
    Deletes devices by keys from KvStore and unregisters them from Spacebridge service

    :param user: User making the deletion request
    :param device_owner: User who owns the device being deleted
    :param device_keys: kvstore _key of the devices being deleted
    :param system_authtoken: Authorization token with system-level privileges. Used to allow users to delete
    their own devices even when they don't have unrestricted kvstore write access
    :param user_authtoken: Authorization token with the same permissions as "user"
    :return:
    """
    devices = get_devices_for_registered_users(user_authtoken)
    devices_to_delete = [device for device in devices if device[KEY] in device_keys]

    return asyncio.run(_delete_devices(user, devices_to_delete, system_authtoken, user_authtoken))

def delete_all_devices(user, system_authtoken, user_authtoken):
    """
    Deletes all devices from the KvStore and unregisters them from Spacebridge service

    :param user: User making the deletion request
    :param system_authtoken: Authorization token with system-level privileges. Used to allow users to delete
    their own devices even when they don't have unrestricted kvstore write access
    :param user_authtoken: Authorization token with the same permissions as "user"
    :return:
    """
    all_users = get_all_users(user_authtoken)
    mobile_users = [user for user in get_all_mobile_users(user_authtoken) if user in all_users] + [NOBODY]
    all_devices = [device for user in mobile_users for device in get_devices_for_user(user, user_authtoken)]
    return asyncio.run(_delete_devices(user, all_devices, system_authtoken, user_authtoken))


def _get_async_factory(system_authtoken):
    mtls_spacebridge_client = None
    if config.get_mtls_enabled():
        mtls_spacebridge_client = build_mtls_spacebridge_client(system_authtoken)
    uri = rest.makeSplunkdUri()
    return AsyncClientFactory(uri, spacebridge_client=mtls_spacebridge_client)


async def _delete_devices(user, devices_to_delete, system_authtoken, user_authtoken):
    async_factory = _get_async_factory(user_authtoken)
    user_header = SplunkAuthHeader(user_authtoken)
    system_header = SplunkAuthHeader(system_authtoken)

    devices_by_owner = defaultdict(list)
    for device in devices_to_delete:
        devices_by_owner[device[USER_KEY]].append(device)
    kvs_users = KvStore(REGISTERED_USERS_COLLECTION_NAME, system_authtoken)

    def batch_records(records, n):
        for i in range(0, len(records), n):
            yield records[i:i + n]

    result = []
    for device_owner in devices_by_owner:
        for batch in batch_records(devices_by_owner.get(device_owner), BATCH_SIZE):
            deferred_responses = [asyncio.create_task(_delete_device(user, device, user_header, system_header,
                                                            system_authtoken, async_factory)) for device in batch]
            responses = await asyncio.gather(*deferred_responses, return_exceptions=True)

            for i in range(len(responses)):
                if isinstance(responses[i], Exception):
                    result.append({KEY: batch[i][KEY], CODE: str(responses[i])})
                else:
                    result.append({KEY: batch[i][KEY], CODE: HTTPStatus.OK})

        if not user_has_registered_devices(device_owner, system_authtoken):
            kvs_users.delete_item_by_key(device_owner)
    return result


async def _delete_device(user, device, user_header, system_header, system_authtoken, async_factory):
    async_kvstore_client = async_factory.kvstore_client()
    async_spacebridge_client = async_factory.spacebridge_client()
    header = system_header if user == device[USER_KEY] else user_header
    await async_kvstore_client.async_kvstore_delete_request(REGISTERED_DEVICES_COLLECTION_NAME, header,
                                                            device[KEY], owner=device[USER_KEY])
    try:
        await async_kvstore_client.async_kvstore_delete_request(DEVICE_PUBLIC_KEYS_COLLECTION_NAME, system_header, device[KEY])
    except splunk.RESTException:
        LOGGER.error("public for device not found, device_id=%s" % device[KEY])

    LOGGER.info('device_key=%s (of device_owner=%s) deleted from kvstore by user=%s'
                % (device[KEY], device[USER_KEY], user))

    await async_delete_device_from_spacebridge(async_spacebridge_client, device[DEVICE_ID], system_authtoken)
    LOGGER.info('device key=%s (of device_owner=%s) deleted from spacebridge by user=%s'
                % (device[KEY], device[USER_KEY], user))
