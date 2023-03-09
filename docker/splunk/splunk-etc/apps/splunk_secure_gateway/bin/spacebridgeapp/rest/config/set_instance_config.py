"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for accessing and setting instance setting kvstore records
"""
import logging
import sys
import json
import time
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from spacebridgeapp.util import py23

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SPACEBRIDGE_SERVER, MESSAGE, \
    PAYLOAD, STATUS, INSTANCE_CONFIG_COLLECTION_NAME, KEY, HTTP_DOMAIN, SYSTEM_AUTHTOKEN

from cloudgateway.private.sodium_client import SodiumClient
from splunk.persistconn.application import PersistentServerConnectionApplication
from spacebridgeapp.util.config import secure_gateway_config as config

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_instance_config", level=logging.INFO)

QUERY_LABEL = 'query'
CONFIG_KEYS_LABEL = 'config_key'
KEY_LABEL = 'key'


class SetInstanceConfig(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for setting the instance config endpoint. Subclasses the spacebridge_app
    BaseRestHandler.

    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def post(self, request):
        body = json.loads(request[PAYLOAD])
        kvstore_service = kvstore(collection=INSTANCE_CONFIG_COLLECTION_NAME, session_key=request[SYSTEM_AUTHTOKEN])

        if not body:
            return {PAYLOAD: {MESSAGE: "Empty request body is not accepted. Please populate request body."},
                    STATUS: HTTPStatus.BAD_REQUEST}

        try:
            for key, value in body.items():
                config_item = value

                if not isinstance(value, dict):
                    error = f"Failed to set instance config settings, unexpected type of data {type(value)}"
                    LOGGER.error(error)
                    return {
                        PAYLOAD: {MESSAGE: error},
                        STATUS: HTTPStatus.BAD_REQUEST,
                    }

                config_item[KEY] = key
                kvstore_service.insert_or_update_item_containing_key(config_item)

        except Exception as e:
            LOGGER.error("Failed to set instance config settings. error=%s", e)
            return {
                PAYLOAD: {MESSAGE: e},
                STATUS: HTTPStatus.INTERNAL_SERVER_ERROR,
            }

        return {
            STATUS: HTTPStatus.OK
        }

    def delete(self, request):
        body = json.loads(request[PAYLOAD])
        config_key = body[KEY_LABEL]
        kvstore_service = kvstore(collection=INSTANCE_CONFIG_COLLECTION_NAME, session_key=request[SYSTEM_AUTHTOKEN])
        try:
            response = kvstore_service.delete_item_by_key(config_key)
            return {
                PAYLOAD: {MESSAGE: f"Config key {config_key} deleted {response}"},
                STATUS: HTTPStatus.OK
            }

        except Exception as e:
            status = HTTPStatus.INTERNAL_SERVER_ERROR
            LOGGER.warn("Failed to delete instance config key %s. error=%s", config_key, e)
            return {
                PAYLOAD: {MESSAGE: e},
                STATUS: status,
            }
