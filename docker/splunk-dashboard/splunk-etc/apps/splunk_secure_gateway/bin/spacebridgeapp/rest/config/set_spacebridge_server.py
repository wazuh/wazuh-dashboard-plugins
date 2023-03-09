"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for setting Spacebridge server that will also unregister all devices in KVStore Instance config
"""
import logging
import sys
import json

import splunk
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from spacebridgeapp.util import py23

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SPACEBRIDGE_SERVER, MESSAGE, HTTP_DOMAIN, \
    PAYLOAD, STATUS, INSTANCE_CONFIG_COLLECTION_NAME, KEY, SESSION, USER, SYSTEM_AUTHTOKEN, AUTHTOKEN, CODE, RESULT
from spacebridgeapp.util.config import secure_gateway_config as config
from cloudgateway.private.sodium_client import SodiumClient
from splunk.persistconn.application import PersistentServerConnectionApplication
from spacebridgeapp.rest.services.device_service import delete_all_devices

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_set_spacebridge_server", level=logging.INFO)


class SetSpacebridgeServer(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for deleting existing devices and updating the spacebridge_server in Kvstore.
    BaseRestHandler.

    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def post(self, request):
        user = request[SESSION][USER]
        session_token = request[SESSION][AUTHTOKEN]
        system_authtoken = request[SYSTEM_AUTHTOKEN]

        body = json.loads(request[PAYLOAD])
        kvstore_service = kvstore(collection=INSTANCE_CONFIG_COLLECTION_NAME, session_key=request[SYSTEM_AUTHTOKEN])

        if not body:
            error = "Empty request body is not accepted. Please populate request body."
            LOGGER.error(error)
            return build_error_response(error, HTTPStatus.BAD_REQUEST)

        # Sanity check on data sent
        if not SPACEBRIDGE_SERVER in body:
            error = f"Failed to set Spacebridge Server expecting key = spacebridge_server"
            LOGGER.error(error)
            return build_error_response(error, HTTPStatus.BAD_REQUEST)

        value = body[SPACEBRIDGE_SERVER]

        if not isinstance(value, dict):
            error = f"Failed to set Spacebridge Server, unexpected type of data {type(value)}"
            LOGGER.error(error)
            return build_error_response(error, HTTPStatus.BAD_REQUEST)

        # Validate that we're not trying to change to the same Spacebridge server that we're already on
        if config.get_spacebridge_server() == value[HTTP_DOMAIN]:
            return {
                PAYLOAD: {
                    MESSAGE: "Spacebridge already set to this server. No devices deleted.",
                    RESULT: json.dumps([])
                },
                STATUS: HTTPStatus.OK
            }

        value[KEY] = SPACEBRIDGE_SERVER

        # Attempt to delete devices before changing Spacebridge server
        # If all devices are unable to be deleted catch error and halt changing server
        # If some devices are deleted continue to change Spacebridge server and report the failed devices
        LOGGER.debug("Attempting to delete all devices.")

        try:
            deletion_result = delete_all_devices(user, session_token, system_authtoken)

            successful_deletions = []
            failed_deletions = []

            for result in deletion_result:
                if result[CODE] == HTTPStatus.OK:
                    successful_deletions.append(result)
                else:
                    failed_deletions.append(result)

            num_success = len(successful_deletions)
            num_failed = len(failed_deletions)

            # Only do this check if deletion_result is non zero, to avoid the case of no registered devices
            if deletion_result and num_failed == len(deletion_result):
                error = "All device deletions failed. Aborting changing Spacebridge Server."
                LOGGER.warn(error)
                return build_error_response(error, HTTPStatus.INTERNAL_SERVER_ERROR)

        except Exception as e:
            error = f"An error occurred while deleting all devices, error = {str(e)}. " \
                    f"Aborting changing Spacebridge Server."

            LOGGER.warn(error)
            return build_error_response(error, HTTPStatus.INTERNAL_SERVER_ERROR)

        LOGGER.info("Delete devices completed. Deletions_succeeded = %s, Deletions_failed = %s" %
                    (num_success, num_failed))

        # Deletion completed, attempt to modify Spacebridge server
        try:
            LOGGER.debug("Attempting to update spacebridge_server in instance config")
            kvstore_service.insert_or_update_item_containing_key(value)
            LOGGER.info("spacebridge_server has been successfully updated")
        except splunk.RESTException as e:
            error = f"Failed to change Spacebridge server, after deleting devices. " \
                    f"Error = {str(e)}, Deleted devices = {deletion_result}"
            LOGGER.warn(error)
            return build_error_response(error, HTTPStatus.INTERNAL_SERVER_ERROR)

        return {
            PAYLOAD: {
                MESSAGE: "Spacebridge server update complete. Successful deletions = %s, Failed deletions = %s" % (
                    num_success, num_failed),
                RESULT: json.dumps(deletion_result)},
            STATUS: HTTPStatus.OK
        }


def build_error_response(message, status):
    return {
        PAYLOAD: {MESSAGE: message},
        STATUS: status,
    }
