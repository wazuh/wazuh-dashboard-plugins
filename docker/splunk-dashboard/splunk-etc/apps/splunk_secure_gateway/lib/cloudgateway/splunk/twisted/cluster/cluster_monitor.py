"""
(C) 2019 Splunk Inc. All rights reserved.

Cluster support to determine if modular_input_should_run
"""
from twisted.internet import defer
from cloudgateway.splunk.twisted.clients.async_server_info_client import AsyncServerInfoClient

class ClusterMonitor(object):

    def __init__(self, logger, interval=300, initial_is_shc_member=None,
                 async_server_info_client=AsyncServerInfoClient()):

        self.interval = interval
        self.async_server_info_client = async_server_info_client
        self.is_shc_member_state = initial_is_shc_member
        self.logger = logger

    @defer.inlineCallbacks
    def monitor(self, auth_header, reactor):

        self.logger.debug("Running Cluster monitor every {} seconds".format(self.interval))
        should_run = yield self.modular_input_should_run(auth_header)
        if not should_run:
            self.logger.debug("Stopping modular input is no longer Search Head Cluster Captain.")
            reactor.stop()

        # Call on interval
        reactor.callLater(self.interval, self.monitor, auth_header, reactor)

    @defer.inlineCallbacks
    def modular_input_should_run(self, auth_header):
        """
        This is a modified version of the ITOA version which includes a throttling interval before calling API.
        Otherwise it returns the previous should_run state
        :return:
        """
        # The is_shc_member_state is sticky so we only populate it once
        if self.is_shc_member_state is None:
            self.is_shc_member_state = yield self.async_server_info_client.async_is_shc_member(auth_header)

        # if we are not a shc member then we can always run
        if not self.is_shc_member_state:
            self.logger.debug("Modular input is not part of search head cluster will run")
            defer.returnValue(True)

        # if we surpassed our throttle interval we should update the state
        is_captain = yield self.async_server_info_client.async_is_captain(auth_header)
        defer.returnValue(is_captain)
