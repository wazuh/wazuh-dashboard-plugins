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

from spacebridgeapp.rest.util.helper import extract_parameter
from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SESSION, AUTHTOKEN, \
    PAYLOAD, STATUS, INSTANCE_CONFIG_COLLECTION_NAME, KEY, VALUE, SYSTEM_AUTHTOKEN

from cloudgateway.private.sodium_client import SodiumClient
from splunk.persistconn.application import PersistentServerConnectionApplication

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_instance_config", level=logging.INFO)

QUERY_LABEL = 'query'
CONFIG_KEYS_LABEL = 'config_key'
KEY_LABEL = 'key'


class GetInstanceConfig(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the instance config endpoint. Subclasses the spacebridge_app
    BaseRestHandler.

    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        LOGGER.info("getting instance config")
        try:
            config_key = extract_parameter(request[QUERY_LABEL], CONFIG_KEYS_LABEL, QUERY_LABEL)
        except Exception:
            LOGGER.debug("No config key provided, returning all instance config settings")
            config_key = None

        kvstore_service = kvstore(collection=INSTANCE_CONFIG_COLLECTION_NAME, session_key=request[SYSTEM_AUTHTOKEN])
        if config_key:
            r, content = kvstore_service.get_item_by_key(config_key)
            instance_config_setting = json.loads(content)
            instance_config_setting[KEY_LABEL] = instance_config_setting[KEY]

            return {
                PAYLOAD: [instance_config_setting],
                STATUS: HTTPStatus.OK
            }
        else:
            r, content = kvstore_service.get_all_items()
            instance_config_settings = json.loads(content)
            for item in instance_config_settings:
                item[KEY_LABEL] = item[KEY]

            LOGGER.info("returning instance config")
            return {
                PAYLOAD: instance_config_settings,
                STATUS: HTTPStatus.OK
            }
