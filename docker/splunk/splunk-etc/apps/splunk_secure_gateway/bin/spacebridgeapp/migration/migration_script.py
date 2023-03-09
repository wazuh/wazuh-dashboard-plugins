"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Python module for migrating data from SCG to SSG
"""
import json
import time
import warnings
import os
from http import HTTPStatus
import splunk
from spacebridgeapp.util import py23, constants

warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.rest.services.kvstore_service import get_all_collections
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.app_info import APP_ID_TO_META_MAP, get_app_platform
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, ENCRYPTION_KEYS, \
    MDM_SIGN_PUBLIC_KEY, MDM_SIGN_PRIVATE_KEY, CLOUDGATEWAY_APP_NAME, META_COLLECTION_NAME, NOBODY, KEY, \
    MIGRATION_DONE, STATUS
from spacebridgeapp.rest.services.splunk_service import fetch_sensitive_data, update_or_create_sensitive_data
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore

# WHAT LOG SHOULD THIS BE GOING TO
LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + '.log', 'ssg_migration.app')


TIMEOUT_SECONDS = 5
password_keys = [ENCRYPTION_KEYS, MDM_SIGN_PUBLIC_KEY, MDM_SIGN_PRIVATE_KEY]
collections_not_to_migrate = ['ar_dashboards', 'ar_beacons', 'ar_beacon_regions', 'ar_geofences', 'assets',
                              'asset_groups', 'ar_workspaces', 'ar_capabilities', 'ar_phantom_metadata',
                              'groups', 'drone_mode_tvs', 'drone_mode_ipads', 'tv_bookmark']

COLLECTING_DATA = "ID1"
COPY_KV_STORE = "ID2"
COPY_KEYS = "ID3"
PENDING = "0"
DONE = "1"
APP_NAME = "app_name"


def resolve_device_platform_and_type(device):
    if constants.PLATFORM not in device and device[constants.APP_ID] in APP_ID_TO_META_MAP:
        device[constants.PLATFORM] = get_app_platform(device[constants.APP_ID])
    if constants.DEVICE_TYPE in device and device[constants.DEVICE_TYPE] == constants.APPLE_TV:
        device[constants.DEVICE_TYPE] = constants.SPLUNK_TV
        device[constants.APP] = constants.SPLUNK_TV
    if constants.DEVICE_TYPE in device and device[constants.DEVICE_TYPE] == constants.ALERTS_IOS_LEGACY:
        device[constants.DEVICE_TYPE] = constants.ALERTS_IOS
        device[APP_NAME] = constants.ALERTS_IOS

    return device


class Migration(object):

    def __init__(self, session_key):
        """
        Migration constructor
        :param session_key: session key passed by rest request
        """
        self.session_key = session_key
        self.system_auth_header = SplunkAuthHeader(self.session_key)

    def _migrate(self, meta_collection, migration_info):
        # List of all collections
        _, collections_content = get_all_collections(self.session_key, app_name=constants.CLOUDGATEWAY_APP_NAME)
        all_collections = json.loads(collections_content)['entry']
        app_collections = [x for x in all_collections if x['acl']['app'] == CLOUDGATEWAY_APP_NAME]
        app_collection_names = {x['name'] for x in app_collections
                                if x['name'] not in collections_not_to_migrate}
        # Special case this collection because it doesn't show up in the SCG /collections/config endpoint
        app_collection_names.add("user_meta")

        registered_users_kvstore = KvStore(constants.REGISTERED_USERS_COLLECTION_NAME, self.session_key,
                                           app=constants.CLOUDGATEWAY_APP_NAME, owner=NOBODY)
        _, users_content = registered_users_kvstore.get_collection_keys()
        registered_user_records = json.loads(users_content)
        all_registered_users = [registered_user_record[u'_key']
                                for registered_user_record in registered_user_records]

        if NOBODY not in all_registered_users:
            all_registered_users.append(NOBODY)

        migration_info[COLLECTING_DATA] = DONE
        meta_collection.insert_or_update_item_containing_key(migration_info)

        for collection in app_collection_names:
            # Iterate through all users and insert data per user
            for user in all_registered_users:
                cloud_gateway_kvstore = KvStore(collection, self.session_key,
                                                app=constants.CLOUDGATEWAY_APP_NAME, owner=user)
                _, scg_content = cloud_gateway_kvstore.get_all_items()
                scg_content = json.loads(scg_content)
                if scg_content:
                    if collection == constants.REGISTERED_DEVICES_COLLECTION_NAME:
                        scg_content = [resolve_device_platform_and_type(device) for device in scg_content]
                    secure_gateway_kvstore = KvStore(collection, self.session_key,
                                                     app=constants.SPACEBRIDGE_APP_NAME, owner=user)
                    _, ssg_content = secure_gateway_kvstore.insert_multiple_items(scg_content)

        migration_info[COPY_KV_STORE] = DONE
        meta_collection.insert_or_update_item_containing_key(migration_info)

        # Copying passwords.conf to Splunk Secure Gateway
        for key in password_keys:
            try:
                value = fetch_sensitive_data(self.session_key, key, app=CLOUDGATEWAY_APP_NAME)
                update_or_create_sensitive_data(self.session_key, key, value)
            except splunk.ResourceNotFound:
                LOGGER.debug('key=%s not found in storage/passwords', key)

        migration_info[COPY_KEYS] = DONE
        meta_collection.insert_or_update_item_containing_key(migration_info)
        migration_info[STATUS] = DONE
        meta_collection.insert_or_update_item_containing_key(migration_info)

    def run(self):
        """
        Attempts to sync the migration. If the kvstore is not yet available, schedules
        a non-blocking retry attempt in 5 seconds
        """
        LOGGER.info("Attempting Migration from Splunk Cloud Gateway to Splunk Secure Gateway")
        try:
            meta_collection = KvStore(META_COLLECTION_NAME, self.session_key, owner=NOBODY)
            migration_info = {KEY: MIGRATION_DONE, STATUS: PENDING}
            meta_keys = meta_collection.get_collection_keys()

            if MIGRATION_DONE in meta_keys:
                migration_status = meta_collection.get_item_by_key(MIGRATION_DONE)
            else:
                migration_status = PENDING
            if migration_status.isdigit() and int(migration_status):
                LOGGER.debug("Migration will not run because migration from Splunk Cloud Gateway "
                             "is already done")
            else:
                self._migrate(meta_collection, migration_info)

        except splunk.RESTException as e:
            if e.statusCode == HTTPStatus.SERVICE_UNAVAILABLE:
                LOGGER.info("KVStore is not yet setup. Retrying migration in 5 seconds")
                time.sleep(TIMEOUT_SECONDS)
                self.run()
            else:
                raise e
