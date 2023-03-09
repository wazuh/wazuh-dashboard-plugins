"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject
from spacebridgeapp.util import constants
from spacebridgeapp.util.constants import NOBODY
from spacebridgeapp.util.time_utils import day_to_seconds, get_current_timestamp

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + '.log', 'alerts_ttl_utility.app')


class AlertsTtlUtility(object):
    """
    Utility class to clean up alerts related KV Store table by deleting entries older than K days in the past
    """

    def __init__(self, session_key, ttl_days, owner=NOBODY):
        """

        :param session_key: session key passed by modular input
        :param ttl_days: items older than ttl_days will be removed
        :param owner: owner of the collection
        """
        self.session_key = session_key
        self.owner = owner
        self.ttl_resource_list = [KVStoreCollectionTTLResource(constants.MOBILE_ALERTS_COLLECTION_NAME,
                                                               "notification.created_at", ttl_days),
                                  KVStoreCollectionTTLResource(constants.ALERTS_RECIPIENT_DEVICES_COLLECTION_NAME,
                                                               "timestamp", ttl_days)]

    def delete_invalid_entries(self, collection, collection_handler, timestamp_attribute_name):
        try:
            current_timestamp = get_current_timestamp()
            query = {timestamp_attribute_name: {constants.GREATER_THAN_OPERATOR: current_timestamp}}
            resp = collection_handler.delete_items_by_query(query)
            LOGGER.info(
                "Successfully deleted invalid entries for collection=%s with response=%s" % (collection, str(resp)))
        except:
            LOGGER.exception("Exception deleting invalid entries for collection=%s" % collection)

    def run(self):
        """
        Goes through each alerts related collection and deletes items older than ttl_days
        """
        LOGGER.info("Running alerts ttl utility")

        try:
            for kvstore_ttl_resource in self.ttl_resource_list:

                timestamp_attribute_name = kvstore_ttl_resource.time_attribute_name
                collection = kvstore_ttl_resource.collection_name
                ttl_num_seconds = day_to_seconds(kvstore_ttl_resource.ttl_num_days)

                collection_handler = KVStoreCollectionAccessObject(collection=kvstore_ttl_resource.collection_name,
                                                                   session_key=self.session_key,
                                                                   timestamp_attribute_name=timestamp_attribute_name)

                self.delete_invalid_entries(collection, collection_handler, timestamp_attribute_name)
                try:
                    resp = collection_handler.delete_expired_items(expired_time=ttl_num_seconds)
                    LOGGER.info("Successfully performed TTL for collection=%s with response=%s" % (collection, str(resp)))
                except:
                    LOGGER.exception("Exception performing TTL for collection=%s" % collection)
        except:
            LOGGER.exception("Failure encountered during Alerts TTL ")




class KVStoreCollectionTTLResource(object):
    """
    Helper class to store TTL configuration information
    """
    def __init__(self, collection_name, time_attribute_name, ttl_num_days=3):
        self.collection_name = collection_name
        self.time_attribute_name = time_attribute_name
        self.ttl_num_days = ttl_num_days
