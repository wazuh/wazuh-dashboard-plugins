"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
import base64
import warnings
import pickle
import asyncio

warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

import fileinput
import sys
from cloudgateway.device import EncryptionKeys
from cloudgateway.splunk.encryption import EncryptionContext
from cloudgateway.private.sodium_client.sharedlib_sodium_client import SodiumClient
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.subscriptions.subscription_processor import process_pubsub_subscription
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_subscription_subprocess.log",
                       "subscription_subprocess")


async def _run(job_contexts, sodium_client):
    errors = []

    LOGGER.debug("Running search process, searches=%s", len(job_contexts))

    for job in job_contexts:
        LOGGER.debug("Processing search job.  search_key=%s", job.search_context.search.key())
        encryption_keys = EncryptionKeys.from_json(job.encryption_keys)
        encryption_context = EncryptionContext(encryption_keys, sodium_client)
        async_client_factory = AsyncClientFactory(job.splunk_uri)
        try:
            await process_pubsub_subscription(job.auth_header, encryption_context,
                                              async_client_factory.spacebridge_client(), async_client_factory.kvstore_client(),
                                              async_client_factory.splunk_client(), job.search_context)
        except Exception as e:
            LOGGER.exception("Failed to process search, search_key=%s", job.search_context.search.key())
            errors.append(e)

    if len(errors) > 0:
        raise errors[0]


def run_search_process(job_contexts, sodium_client):
    try:
        asyncio.run(_run(job_contexts, sodium_client))
    except Exception:
        LOGGER.exception("Failed to process searches")
    LOGGER.debug("Search job process finished")
    sys.exit(0)


if __name__ == "__main__":
    # entry point for single search processing
    LOGGER.debug("Starting subscription os process")
    try:
        SODIUM_CLIENT = SodiumClient()
        for line in fileinput.input():
            pickle_format = base64.b64decode(line)
            input_contexts = pickle.loads(pickle_format)
            run_search_process(input_contexts, SODIUM_CLIENT)
    except Exception as e:
        LOGGER.exception("Failed to start subscription os process")
        raise e

