"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Modular Input for processing publish and subscription process
"""
import warnings
import logging

warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

import multiprocessing
import os
from spacebridgeapp.util import py23

py23.suppress_insecure_https_warnings()
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import asyncio
from spacebridgeapp.rest.clients.async_kvstore_client import AsyncKvStoreClient
from cloudgateway.splunk.auth import SplunkAuthHeader
from spacebridgeapp.subscriptions import loader
from spacebridgeapp.subscriptions.process_manager import JobContext
from spacebridgeapp.util.shard import default_shard_id
from cloudgateway.private.sodium_client.sharedlib_sodium_client import SodiumClient
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from solnlib import modular_input
from spacebridgeapp.util.base_modular_input import BaseModularInput
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
from spacebridgeapp.subscriptions.subscription_manager import SubscriptionManager
from spacebridgeapp.rest.load_balancer_verification import get_uri
from cloudgateway.private.websocket.parent_process_monitor import ParentProcessMonitor
from spacebridgeapp.util.config import secure_gateway_config as config


class SubscriptionModularInput(BaseModularInput):
    """
    Main entry for processing Search Subscriptions
    """
    title = 'Splunk Secure Gateway Subscription Processor'
    description = 'Process subscriptions and send visualization data to subscribed devices.'
    app = 'Splunk Secure Gateway'
    name = 'splunk_secure_gateway'
    use_kvstore_checkpointer = False
    use_hec_event_writer = False
    logger = setup_logging(SPACEBRIDGE_APP_NAME + '_modular_input.log', 'ssg_subscription_modular_input.app')

    input_config_key = "ssg_subscription_modular_input://default"
    minimum_iteration_time_seconds = "minimum_iteration_time_seconds"
    warn_threshold_seconds = "maximum_iteration_time_warn_threshold_seconds"

    def extra_arguments(self):
        """
        Override extra_arguments list for modular_input scheme
        :return:
        """
        return [
            {
                'name': 'minimum_iteration_time_seconds',
                'title': 'Minimum Iteration Time in Seconds',
                'description': 'The minimum time an iteration of the subscription processor will run for.  If an '
                               'iteration takes longer than the minimum, the next iteration is scheduled immediately.',
                'data_type': modular_input.Argument.data_type_number
            },
            {
                'name': 'maximum_iteration_time_warn_threshold_seconds',
                'title': 'Minimum Iteration Time Warning Threshold in Seconds',
                'description': 'If processing jobs takes longer than this value, a warning will be logged',
                'data_type': modular_input.Argument.data_type_number
            },
        ]

    def do_run(self, input_config):
        """
        Execute the modular_input
        :param input_config:
        :return:
        """
        try:
            config.assert_spacebridge_server()
        except ValueError as e:
            config.sleep_and_terminate_process(sleep_interval=300)

        if not super(SubscriptionModularInput, self).do_run(input_config):
            return

        shard_id = default_shard_id()

        self.logger.info("Starting libsodium child process")
        sodium_logger = self.logger.getChild('sodium_client')
        sodium_logger.setLevel(logging.WARN)
        sodium_client = SodiumClient(sodium_logger)
        self.logger.info("Loading encryption context")
        encryption_context = SplunkEncryptionContext(self.session_key, SPACEBRIDGE_APP_NAME, sodium_client)

        self.logger.info("Running Subscription Manager modular input on search head")

        # Fetch load balancer address if configured, otherwise use default URI
        try:
            uri = get_uri(self.session_key)
            self.logger.debug("Successfully verified load_balancer_address={}".format(uri))
        except Exception as e:
            self.logger.exception("Failed to verify load_balancer_address. {}".format(e))

        if not uri:
            return

        try:
            minimum_iteration_time_seconds = float(input_config[self.input_config_key][self.minimum_iteration_time_seconds])
            warn_threshold_seconds = float(input_config[self.input_config_key][self.warn_threshold_seconds])
        except:
            self.logger.exception("Failed to load required configuration values")
            return

        try:
            auth_header = SplunkAuthHeader(self.session_key)

            job_context = JobContext(auth_header,
                                     uri,
                                     encryption_context)

            kvstore_client = AsyncKvStoreClient()

            parent_process_monitor = ParentProcessMonitor()

            subscription_manager = SubscriptionManager(input_config=input_config,
                                                       encryption_context=encryption_context,
                                                       auth_header=auth_header,
                                                       shard_id=shard_id,
                                                       job_context=job_context,
                                                       search_loader=loader.load_search_bundle,
                                                       minimum_iteration_time_seconds=minimum_iteration_time_seconds,
                                                       warn_threshold_seconds=warn_threshold_seconds,
                                                       async_kvstore_client=kvstore_client,
                                                       parent_process_monitor=parent_process_monitor
                                                       )

            asyncio.run(subscription_manager.run())
        except:
            self.logger.exception("Unhandled exception during subscription processing")


if __name__ == "__main__":
    worker = SubscriptionModularInput()
    worker.execute()
