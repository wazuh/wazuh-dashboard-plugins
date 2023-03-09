"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module providing client for tracking incoming requests
"""
import asyncio

from cloudgateway.splunk.auth import SplunkAuthHeader
from spacebridgeapp.rest.clients.async_kvstore_client import AsyncKvStoreClient
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeError
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.util.time_utils import get_current_timestamp

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_async_request_client.log", "async_request_client")


class AsyncRequestClient(object):
    def __init__(self, kvstore_client: AsyncKvStoreClient):
        """
        Client for tracking incoming requests
        """
        self.kvstore_client = kvstore_client
        self.requested_device_keys = set()
        super(AsyncRequestClient, self).__init__()

    def on_request(self, device_key: str):
        """
        Function to trigger whenever there is a new request from a client device. Caches the provided
        device_key to indicate that that device has had activity.

        :param device_key: the key in the Registered Devices Collection that corresponds to
                           the device making the request
        """
        LOGGER.debug("Recording request for device with key=%s", device_key)
        self.requested_device_keys.add(device_key)
    
    async def flush(self, auth_header: SplunkAuthHeader):
        """
        Flushes the cache to KV Store, updating timestamp information for all devices that
        have had activity.

        :param auth_header: A system auth header to authenticate KV Store calls
        """
        try:
            await self._flush(auth_header)
        except (SpacebridgeError, asyncio.TimeoutError):
            LOGGER.warning("Failed to flush request cache")
        except Exception as e:
            LOGGER.warning("Unhandled error flushing request cache")
            raise e

    async def _flush(self, auth_header: SplunkAuthHeader):
        if not self.requested_device_keys:
            return
        LOGGER.debug("Flushing request cache, size=%s", len(self.requested_device_keys))

        # Save the current keys and reset the set
        tmp_device_keys = self.requested_device_keys
        self.requested_device_keys = set()

        # Create KV Store payload with updated meta data
        current_timestamp = get_current_timestamp()
        meta_data = []
        for key in tmp_device_keys:
            meta_data.append({constants.KEY: key, constants.LAST_SEEN_TIMESTAMP: current_timestamp})

        # Save payload to KV Store
        await self.kvstore_client.async_batch_save_request(
            auth_header=auth_header,
            collection=constants.REGISTERED_DEVICES_META_COLLECTION_NAME,
            entries=meta_data)

        LOGGER.debug("Request flush complete, size=%s", len(tmp_device_keys))
