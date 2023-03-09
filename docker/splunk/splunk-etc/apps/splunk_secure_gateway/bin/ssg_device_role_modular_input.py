"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Modular Input for updating the mapping of devices to roles used for sending push notifications by role
"""

import warnings

warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

import asyncio
import sys
import os
import splunk.rest as rest
from splunk.clilib.bundle_paths import make_splunkhome_path
from spacebridgeapp.util import py23


os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

from spacebridgeapp.util.base_modular_input import BaseModularInput
from spacebridgeapp.util.splunk_utils.common import modular_input_should_run
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.alerts.device_role_mapping import update


class DeviceRolesMappingModularInput(BaseModularInput):
    """
    """
    title = 'Splunk Secure Gateway Role Based Notification Manager'
    description = 'Used for sending mobile alerts to users by role'
    app = 'Splunk Secure Gateway'
    name = 'splunk_secure_gateway'
    use_kvstore_checkpointer = False
    use_hec_event_writer = False
    logger = setup_logging(SPACEBRIDGE_APP_NAME + '_modular_input.log', 'ssg_device_role_mapping.app')
    input_config_key = "ssg_device_role_modular_input://default"

    def extra_arguments(self):
        """
        Override extra_arguments list for modular_input scheme
        :return:
        """
        return [
            {
                'name': 'param1',
                'description': 'No params required'
            }
        ]

    def do_run(self, input_config):
        """
        This will update the Device Role Mapping table in KV Store with the new mapping of a device to role
        :param input_config:
        :return:
        """
        if not super(DeviceRolesMappingModularInput, self).do_run(input_config):
            return

        if not modular_input_should_run(self.session_key, logger=self.logger):
            self.logger.debug("Modular input will not run on this node.")
            return

        # Use default URI for Device Role Mapping
        try:
            uri = rest.makeSplunkdUri()
        except Exception as e:
            self.logger.exception("Failed to generate default URI. {}".format(e))

        if not uri:
            return

        try:
            async_client_factory = AsyncClientFactory(uri)
            kvstore_client = async_client_factory.kvstore_client()
            splunk_client = async_client_factory.splunk_client()
            asyncio.run(update(self.session_key, kvstore_client, splunk_client))
        except SystemExit as e:
            if e.code == 0:
                self.logger.debug("device to role mapping updated successfully with code={}".format(str(e.code)))
            else:
                self.logger.error("device to role mapping update failed with error={}".format(str(e)))
        except:
            self.logger.exception("Unexpected exception in device to role mapping")


if __name__ == "__main__":
    worker = DeviceRolesMappingModularInput()
    worker.execute()
