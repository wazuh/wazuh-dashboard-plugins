
"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""
import json
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import time_utils
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.rest.services.splunk_service import get_all_mobile_users
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, VERSION, NOT_EQUAL, LAST_UPDATE_TIME, EXPIRED_TIME, \
    SEARCHES_COLLECTION_NAME, SUBSCRIPTIONS_COLLECTION_NAME, SEARCH_UPDATES_COLLECTION_NAME, \
    SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME, KEY
from spacebridgeapp.util.kvstore import build_not_containedin_clause

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + '.log', 'subscription_clean_up.app')


def not_subscription_keys_query(subscriptions):
    # Find all subscriptions that have not yet expired
    r, subscription_records = subscriptions.get_all_items()
    subscriptions = json.loads(subscription_records)

    # Delete all search_updates that are not attached to valid subscriptions
    keys = [subscription[KEY] for subscription in subscriptions]
    if len(keys):
        return build_not_containedin_clause(KEY, keys)
    return {}


class SubscriptionCleanUp(object):
    STUCK_SEARCH_MULTIPLIER = 10
    # Search job data is cached for 10 min from creation of search job
    SEARCH_JOB_CACHE_TIME = 600

    def __init__(self, session_key, clean_up_time):
        """
        Subscription Clean Up constructor
        :param session_key: session key passed by modular input
        :param clean_up_time: configurable time given in days
        """
        self.session_key = session_key
        self.clean_up_time = clean_up_time
        self.system_auth_header = SplunkAuthHeader(self.session_key)

    def _clean_expired_subscriptions(self, collection):
        expired_time = time_utils.get_current_timestamp() - self.clean_up_time
        LOGGER.debug('Deleting subscriptions older than expired_time=%s', expired_time)

        collection.delete_expired_items(expired_time=self.clean_up_time, expiration_attribute_name=EXPIRED_TIME)
        collection.delete_items_by_query({VERSION: {NOT_EQUAL: 2}})

    def _clean_expired_searches(self, collection):
        stuck_search_delete_time = self.clean_up_time * self.STUCK_SEARCH_MULTIPLIER
        timestamp_before = time_utils.get_current_timestamp() - stuck_search_delete_time
        LOGGER.debug('Deleting searches older than last_update_time=%s', timestamp_before)

        collection.delete_expired_items(expired_time=stuck_search_delete_time,
                                        expiration_attribute_name=LAST_UPDATE_TIME)
        collection.delete_items_by_query({VERSION: {NOT_EQUAL: 2}})
        collection.delete_items_by_query({LAST_UPDATE_TIME: None})

    def _clean_user_namespaced_items(self):
        users = get_all_mobile_users(self.session_key)

        timestamp_before = time_utils.get_current_timestamp() - self.clean_up_time
        LOGGER.debug('Deleting credentials older than last_update_time=%s, users=%s', timestamp_before, len(users))
        for owner in users:
            credentials = KVStoreCollectionAccessObject(collection=SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME,
                                                        owner=owner,
                                                        session_key=self.session_key)
            credentials.delete_expired_items(expired_time=timestamp_before, expiration_attribute_name=LAST_UPDATE_TIME)

    def run(self):
        """
        Goes through each subscription and deletes items older than expiration_time + clean_up_time
        """
        LOGGER.debug("Running Subscription Clean Up")

        subscriptions = KVStoreCollectionAccessObject(collection=SUBSCRIPTIONS_COLLECTION_NAME,
                                                      session_key=self.session_key)

        searches = KVStoreCollectionAccessObject(collection=SEARCHES_COLLECTION_NAME,
                                                 session_key=self.session_key)

        search_updates = KVStoreCollectionAccessObject(collection=SEARCH_UPDATES_COLLECTION_NAME,
                                                       session_key=self.session_key)

        # clean all expired subscriptions
        self._clean_expired_subscriptions(subscriptions)

        # Build kvstore query to return any records not in valid subscription list
        # All subscriptions should be valid after above cleaning
        not_keys_query = not_subscription_keys_query(subscriptions)

        # Delete any search_updates, subscription_credentials that don't belong to valid subscriptions
        search_updates.delete_items_by_query(not_keys_query)

        self._clean_user_namespaced_items()

        # Clean up any searches that have not been updated in a multiple of the clean_up time
        self._clean_expired_searches(searches)

        LOGGER.debug("Completed Subscription Clean up")
