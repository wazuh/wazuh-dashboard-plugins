"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Modular Input for cleaning up stale entries in Registered Devices metadata
"""

import warnings

warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

import sys
import os
from splunk.clilib.bundle_paths import make_splunkhome_path
from spacebridgeapp.util import py23, constants


os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

from spacebridgeapp.util.base_modular_input import BaseModularInput
from spacebridgeapp.devices.registered_devices_cleanup import RegisteredDevicesCleanup
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.splunk_utils.common import modular_input_should_run
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME


class RegisteredDevicesModularInput(BaseModularInput):
    title = 'Splunk Secure Gateway Registered Devices'
    description = 'Clean up stale registered devices metadata'
    app = 'Splunk Secure Gateway'
    name = 'splunk_secure_gateway'
    use_kvstore_checkpointer = False
    use_hec_event_writer = False
    input_config_key = "ssg_registered_devices_modular_input://default"
    logger = setup_logging(SPACEBRIDGE_APP_NAME + '.log', 'ssg_registered_devices_modular_input.app')

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
        Executes the modular input
        :param input_config:
        :return:
        """
        if not super(RegisteredDevicesModularInput, self).do_run(input_config):
            return

        if not modular_input_should_run(self.session_key, logger=self.logger):
            self.logger.debug("Modular input will not run on this node.")
            return
        
        self.logger.info("Running Registered Devices Cleanup modular input on search captain node")
        registered_devices_cleanup = RegisteredDevicesCleanup(self.session_key)

        try:
            registered_devices_cleanup.run()
        except:
            self.logger.warning("Failure encountered while running Registered Devices Cleanup")

if __name__ == "__main__":
    worker = RegisteredDevicesModularInput()
    worker.execute()
