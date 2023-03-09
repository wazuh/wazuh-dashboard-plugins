"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
import random

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.subscriptions.job_result import JobResult
from spacebridgeapp.subscriptions.subscription_processor import process_pubsub_subscription
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
from spacebridgeapp.util.mtls import build_mtls_spacebridge_client
from spacebridgeapp.util.config import secure_gateway_config as config
import asyncio

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + '_process_manager.log', 'process_manager')

class JobContext(object):
    def __init__(self, auth_header, splunk_uri, encryption_context, search_context=None, subscription_update_ids=None):
        self.auth_header = auth_header
        self.splunk_uri = splunk_uri
        self.encryption_context = encryption_context
        self.search_context = search_context

        if subscription_update_ids is None:
            subscription_update_ids = {}

        self.subscription_update_ids = subscription_update_ids

    def with_search(self, search_context, subscription_updates):
        return JobContext(self.auth_header, self.splunk_uri, self.encryption_context, search_context,
                          subscription_updates)

async def subprocess_subscription(job_context, mtls_enabled):
    mtls_spacebridge_client = None
    if mtls_enabled:
        mtls_spacebridge_client = build_mtls_spacebridge_client(job_context.auth_header.session_token)

    encryption_context = job_context.encryption_context
    async_client_factory = AsyncClientFactory(job_context.splunk_uri, spacebridge_client=mtls_spacebridge_client)
    result = JobResult(False)
    try:
        result = await process_pubsub_subscription(job_context.auth_header, encryption_context,
                                                   async_client_factory.spacebridge_client(),
                                                   async_client_factory.kvstore_client(),
                                                   async_client_factory.splunk_client(),
                                                   job_context.search_context,
                                                   job_context.subscription_update_ids)
    except Exception:
        LOGGER.exception("Failed to process subscription")

    return result

def _run(job_context):
    return asyncio.run(subprocess_subscription(job_context, config.get_mtls_enabled()))







