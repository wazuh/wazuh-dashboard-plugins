"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for Splunk Cloud Gateway migration to Splunk Secure Gateway
"""
import sys
import json
from http import HTTPStatus
from splunk import RESTException
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.migration.migration_script import Migration
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.services.splunk_service import get_app_list_request
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore
from spacebridgeapp.rest.config.get_spacebridge_servers import get_current_spacebridge_server_bundle
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, CLOUDGATEWAY_APP_NAME, META_COLLECTION_NAME, NOBODY, \
    KEY, MIGRATION_DONE, STATUS, SYSTEM_AUTHTOKEN, PAYLOAD, INSTANCE_ID, ENTRY, CONTENT, DISABLED
LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "ssg_migration_handler")

RUN = "RUN"
STOP = "STOP"
PENDING = "0"
DONE = "1"
CANCELLED = "2"
NOT_SUPPORTED = "3"
SUPPORTED_SB_INSTANCE = "spacebridge-us-east-1"


class MigrationHandler(BaseRestHandler, PersistentServerConnectionApplication):

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        status, migration_data = get_migration_status(system_authtoken)

        return {
            'payload': {
                'status': status,
                'migration': migration_data,
            },
            'status': HTTPStatus.OK,
        }

    def post(self, request):
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        body = json.loads(request[PAYLOAD])

        if RUN in body:
            worker = Migration(system_authtoken)
            worker.run()
            return {
                'payload': {
                    'RUN': "success",
                },
                'status': HTTPStatus.OK,
            }
        if STOP in body:
            meta_collection = KvStore(META_COLLECTION_NAME, system_authtoken, owner=NOBODY)
            migration_info = {KEY: MIGRATION_DONE, STATUS: CANCELLED}
            meta_collection.insert_or_update_item_containing_key(migration_info)
            return {
                'payload': {
                    'STOP': "success",
                },
                'status': HTTPStatus.OK,
            }

    def put(self, request):
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        meta_collection = KvStore(META_COLLECTION_NAME, system_authtoken, owner=NOBODY)
        migration_info = {KEY: MIGRATION_DONE, STATUS: PENDING}
        meta_collection.insert_or_update_item_containing_key(migration_info)
        return {
           'payload': {
               "test": "reset"
           },
           'status': HTTPStatus.OK,
        }


def get_migration_status(system_authtoken):
    """
    Get the migration_status and migration_data
    :param system_authtoken:
    :return: (migration_status, migration_data)
    """
    try:
        # Non default SB server doesn't support migration
        spacebridge_server_bundle = get_current_spacebridge_server_bundle(system_authtoken)
        spacebridge_instance_id = spacebridge_server_bundle.get(INSTANCE_ID, '')
        if spacebridge_instance_id and spacebridge_instance_id != SUPPORTED_SB_INSTANCE:
            return NOT_SUPPORTED, {}

        # Check if SCG is disabled
        app_info = get_app_list_request(system_authtoken, CLOUDGATEWAY_APP_NAME)
        if not app_info or app_info[ENTRY][0][CONTENT][DISABLED]:
            return CANCELLED, {}

        # Return migration status
        try:
            meta_collection = KvStore(META_COLLECTION_NAME, system_authtoken, owner=NOBODY)
            _, migration_done_obj = meta_collection.get_item_by_key(MIGRATION_DONE)
            migration_data = json.loads(migration_done_obj)
            return migration_data[STATUS], migration_data
        except RESTException as e:
            # If migration_done key is not found then we fall-through to PENDING
            if e.statusCode != HTTPStatus.NOT_FOUND:
                raise e

    except Exception as e:
        return CANCELLED, {}

    return PENDING, {}
