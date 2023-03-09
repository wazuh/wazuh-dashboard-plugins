"""
(C) 2019 Splunk Inc. All rights reserved.

Cluster support to determine if modular_input_should_run
"""

import asyncio
from cloudgateway.splunk.asyncio.clients.async_server_info_client import AioServerInfoClient

class ClusterMonitor(object):

    def __init__(self, logger, interval=300, initial_is_shc_member=None,
                 async_server_info_client=None):

        self.interval = interval
        self.is_shc_member_state = initial_is_shc_member
        self.logger = logger

        if not async_server_info_client:
            self.async_server_info_client = AioServerInfoClient(verify_ssl=False)

    async def monitor(self, auth_header):

        self.logger.debug("Running Cluster monitor every {} seconds".format(self.interval))
        should_run = await self.modular_input_should_run(auth_header)
        if not should_run:
            self.logger.debug("Stopping modular input is no longer Search Head Cluster Captain.")
            asyncio.get_event_loop().stop()

        # Call on interval
        await asyncio.sleep(self.interval)
        await self.monitor(auth_header)

    async def modular_input_should_run(self, auth_header):
        """
        This is a modified version of the ITOA version which includes a throttling interval before calling API.
        Otherwise it returns the previous should_run state
        :return:
        """
        # The is_shc_member_state is sticky so we only populate it once
        if self.is_shc_member_state is None:
            self.is_shc_member_state = await self.async_server_info_client.async_is_shc_member(auth_header)

        # if we are not a shc member then we can always run
        if not self.is_shc_member_state:
            self.logger.debug("Modular input is not part of search head cluster will run")
            return True

        # if we surpassed our throttle interval we should update the state
        is_captain = await self.async_server_info_client.async_is_captain(auth_header)
        return is_captain
