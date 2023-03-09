"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to manage Subscriptions
"""
import time
import asyncio
from collections import defaultdict

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.subscriptions.subscription_search_requests import update_searches, update_subscriptions
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.subscriptions.process_manager import subprocess_subscription

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + '_subscription_manager.log', 'subscription_manager')


SEARCH_CATEGORY_STANDALONE = 'standalone'
SEARCH_CATEGORY_REF = 'ref'
SEARCH_CATEGORY_BASE = 'base'

PROCESS_CATEGORY_ORDER = [SEARCH_CATEGORY_STANDALONE, SEARCH_CATEGORY_REF, SEARCH_CATEGORY_BASE]


def _categorize_searches(search_bundle):
    categorized = defaultdict(list)
    for search in search_bundle.searches:
        cat = None
        if search.parent_search_key is None:
            cat = SEARCH_CATEGORY_STANDALONE
        elif search.ref:
            cat = SEARCH_CATEGORY_REF
        elif search.base:
            cat = SEARCH_CATEGORY_BASE
        categorized[cat].append(search_bundle.to_search_context(search.key()))
    return categorized


class SubscriptionManager(object):

    def __init__(self, input_config, encryption_context, auth_header,
                 minimum_iteration_time_seconds,
                 search_loader,
                 job_context,
                 async_kvstore_client,
                 warn_threshold_seconds=None,
                 parent_process_monitor=None,
                 shard_id=None,):
        """
        Subscription Manager constructor
        :param input_config:
        :param encryption_context:
        :param session_key:
        :param async_kvstore_client:
        :param async_splunk_client:
        :param async_spacebridge_client:
        """
        self.input_config = input_config
        self.encryption_context = encryption_context
        self.async_kvstore_client = async_kvstore_client
        self.system_auth_header = auth_header
        self.minimum_iteration_time_seconds = minimum_iteration_time_seconds
        self.warn_threshold_seconds = warn_threshold_seconds
        self.shard_id = shard_id
        self.base_job_context = job_context
        self.load_searches = search_loader
        self.subscription_updates = {}
        self.parent_process_monitor = parent_process_monitor

    async def _run_post_job_updates(self, job_results):
        searches = [result.search.__dict__ for result in job_results if result.completed]

        times = [result.search.last_update_time for result in job_results if result.completed]
        LOGGER.debug("count=%s, last_update_times=%s", len(times), times)

        updated_ids_search = await update_searches(self.system_auth_header, searches, self.async_kvstore_client)
        LOGGER.debug("Updated searches count=%s, successes=%s", len(searches), len(updated_ids_search))

        subscription_updates = {}
        for result in job_results:
            if not result.completed:
                LOGGER.debug('skipping incomplete job')
                continue

            subscription_updates = {**subscription_updates, **result.subscription_updates}

        return subscription_updates

    async def _process(self):
        search_bundle = await self.load_searches(self.system_auth_header, self.shard_id, self.async_kvstore_client)

        LOGGER.debug("Found active searches count=%d", len(search_bundle.searches))

        search_contexts = _categorize_searches(search_bundle)

        job_results = []

        for category in PROCESS_CATEGORY_ORDER:
            job_contexts = [self.base_job_context.with_search(search_context, self.subscription_updates)
                            for search_context in search_contexts[category]]

            task_list = [asyncio.create_task(subprocess_subscription(job_context, config.get_mtls_enabled()))
                         for job_context in job_contexts]

            category_result = [await task for task in task_list]

            job_results = job_results + category_result

        self.subscription_updates = await self._run_post_job_updates(job_results)

    async def _loop(self):
        """
        Main Execute loop for Subscription Manager
        :return:
        """
        LOGGER.debug("Starting pubsub iteration")
        start_time_seconds = time.time()

        await self._process()

        time_taken_seconds = time.time() - start_time_seconds

        if self.warn_threshold_seconds and self.warn_threshold_seconds < time_taken_seconds:
            LOGGER.warn("Subscription processing took time_seconds=%s, warn_threshold_seconds=%s",
                        time_taken_seconds, self.warn_threshold_seconds)

        LOGGER.debug("Subscriptions processed, time_taken=%s", time_taken_seconds)

        # if we've taken longer than the minimum, schedule immediately
        raw_delay_required = self.minimum_iteration_time_seconds - time_taken_seconds
        delay_required_seconds = max(raw_delay_required, 0)

        LOGGER.debug("Subscription loop will sleep for delay_seconds=%s", delay_required_seconds)
        await asyncio.sleep(delay_required_seconds)

    async def run(self):
        try:
            self.parent_process_monitor.monitor(LOGGER)
            while True:
                await self._loop()
        except Exception:
            # if something has made its way up here, the only safe thing to do is shut down and wait for
            # Splunk to restart the process
            LOGGER.exception("Unexpected Error while processing subscriptions!")
        LOGGER.debug("Subscription manager terminating")

