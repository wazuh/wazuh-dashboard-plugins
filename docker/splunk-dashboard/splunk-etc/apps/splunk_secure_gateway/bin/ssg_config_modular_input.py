# Suppress warnings to pass AppInspect when calling --scheme
import warnings
import os

from spacebridgeapp.util import py23

py23.suppress_insecure_https_warnings()
warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import json
import logging

from google.protobuf.json_format import MessageToDict
from cloudgateway.discovery import query_discovery_instances
from cloudgateway.private.sodium_client.sharedlib_sodium_client import SodiumClient
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from spacebridgeapp.util.base_modular_input import BaseModularInput
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridge_protocol.discovery_pb2 import SpacebridgeInstancesResponse
from spacebridgeapp.rest.services.splunk_service import get_config_property, update_config_property
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore


def _query_spacebridge_server(session_token):
    try:
        kvstore_service = kvstore(collection=constants.INSTANCE_CONFIG_COLLECTION_NAME, session_key=session_token)
        response, result = kvstore_service.get_item_by_key(constants.SPACEBRIDGE_SERVER)

        result_json = json.loads(result)
        current_spacebridge_server_url = result_json.get(constants.HTTP_DOMAIN, None)

        return current_spacebridge_server_url
    except Exception as e:
        return None

def _get_spacebridge_instance_info(encryption_context, current_spacebridge_server):
    get_instances_response = query_discovery_instances(encryption_context, config=config)

    instances_response = SpacebridgeInstancesResponse()
    instances_response.ParseFromString(get_instances_response.instances)
    instances = instances_response.instances

    current_instance = None
    # A private spacebridge_server will result in an empty current_instance
    for instance in instances:
        if instance.httpDomain == current_spacebridge_server:
            current_instance = instance

    return current_instance


def _build_spacebridge_server_payload(spacebridge_instance):
    return {
        constants.INSTANCE_ID: spacebridge_instance.instanceId,
        constants.HTTP_DOMAIN: spacebridge_instance.httpDomain,
        constants.GRPC_DOMAIN: spacebridge_instance.grpcDomain,
        constants.REGION: spacebridge_instance.region,
        constants.LABEL: spacebridge_instance.regionLabel,
        constants.REGION_DESCRIPTION: spacebridge_instance.regionDescription,
        constants.ID: spacebridge_instance.id,
        constants.KEY: constants.SPACEBRIDGE_SERVER
    }


class ConfigModularInput(BaseModularInput):
    title = 'Config Modular Input'
    description = 'Initializes the Config Modular Input to Synchronize KVStore changes'
    app = 'Config Modular Input'
    name = 'config'
    use_kvstore_checkpointer = False
    use_hec_event_writer = False
    logger = setup_logging('ssg_config_modular_input.log', 'ssg_config_modular_input.app')
    spacebridge_server_conf_path = "securegateway/setup/spacebridge_server"

    def do_run(self, input_config):

        try:
            config.assert_spacebridge_server()
        except ValueError as e:
            config.sleep_and_terminate_process(sleep_interval=300)

        if not super(ConfigModularInput, self).do_run(input_config):
            return

        # Setup
        self.logger.debug('Enable config_modular_input')
        kvstore_service = kvstore(collection=constants.INSTANCE_CONFIG_COLLECTION_NAME,
                                  session_key=self.session_key)
        encryption_context = SplunkEncryptionContext(self.session_key,
                                                     constants.SPACEBRIDGE_APP_NAME,
                                                     SodiumClient())

        # Get most recent spacebridge_server from KVStore
        kvstore_spacebridge_server = _query_spacebridge_server(self.session_key)

        # Get most recent spacebridge_server from config
        current_spacebridge_server = get_config_property(self.spacebridge_server_conf_path,
                                                         self.session_key)

        # Check if current_spacebridge in config is a known public spacebridge_sever, and get it's instance info
        # A private spacebridge_server will result in current_spacebridge_instance being None
        current_spacebridge_instance = _get_spacebridge_instance_info(encryption_context, current_spacebridge_server)

        # If spacebridge_server is public and kvstore is empty, initialize it with the current config's instance info
        if current_spacebridge_instance and not kvstore_spacebridge_server:
            self.logger.info("Detected empty instance config KVStore, initializing with config spacebridge_server = %s",
                             current_spacebridge_server)

            spacebridge_server_payload = _build_spacebridge_server_payload(current_spacebridge_instance)
            kvstore_service.insert_or_update_item_containing_key(spacebridge_server_payload)

        # If config spacebridge_server and kvstore spacebridge_server don't match, update config spacebridge_server
        elif kvstore_spacebridge_server and current_spacebridge_server and \
            current_spacebridge_server != kvstore_spacebridge_server:
            self.logger.info("Spacebridge_server update detected, updating config with latest spacebridge_server = %s",
                        kvstore_spacebridge_server)

            try:
                update_config_property(self.spacebridge_server_conf_path,
                                       kvstore_spacebridge_server,
                                       self.session_key)
            except Exception as e:
                self.logger.error("Config_modular_input failed to update %s = %s" % (self.spacebridge_server_conf_path,
                                                                                     kvstore_spacebridge_server))


if __name__ == "__main__":
    worker = ConfigModularInput()
    worker.execute()
