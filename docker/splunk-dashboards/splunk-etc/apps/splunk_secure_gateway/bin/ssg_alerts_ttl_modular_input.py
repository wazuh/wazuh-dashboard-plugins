"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Modular input which periodically goes and deletes old alerts from KV Store
"""
import sys
from spacebridgeapp.util import py23
from splunk.clilib.bundle_paths import make_splunkhome_path

from spacebridgeapp.util.base_modular_input import BaseModularInput
from spacebridgeapp.util.splunk_utils.common import modular_input_should_run
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.util.alerts_ttl_utility import AlertsTtlUtility
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject
from spacebridgeapp.util.time_utils import get_current_timestamp


class AlertsTTLModularInput(BaseModularInput):
    title = 'Splunk Secure Gateway Mobile Alerts TTL'
    description = 'Cleans up storage of old mobile alerts'
    app = 'Splunk Secure Gateway'
    name = 'splunk_secure_gateway'
    use_kvstore_checkpointer = False
    use_hec_event_writer = False
    logger = setup_logging(constants.SPACEBRIDGE_APP_NAME + '.log', 'ssg_alerts_ttl_modular_input.app')
    ttl_days = "ttl_days"
    input_config_key = "ssg_alerts_ttl_modular_input://default"

    def do_run(self, input_config):
        """
        Executes the modular input using the input config which specifies TTL for alerts
        """
        if not super(AlertsTTLModularInput, self).do_run(input_config):
            return

        if not modular_input_should_run(self.session_key, logger=self.logger):
            self.logger.debug("Modular input will not run on this node.")
            return

        self.delete_old_snoozes()

        self.logger.info("Running Alerts TTL modular input with input=%s" % str(input_config))
        alerts_ttl_utility = AlertsTtlUtility(self.session_key,
                                              float(input_config[self.input_config_key][self.ttl_days]))
        alerts_ttl_utility.run()

    def extra_arguments(self):
        """
        Override extra_arguments list for modular_input scheme
        :return:
        """
        return [{'name': 'ttl_days',
                 'title': 'TTL in Days',
                 'description': 'Alert ttl specified in days'}]

    def delete_old_snoozes(self):
        """
        Deletes snoozes which have expired, i.e. their end time is less than the current timestamp
        """

        # TODO: Add snooze_by_id collection once thats added
        access_object = KVStoreCollectionAccessObject(
            collection=constants.SNOOZED_SCOPES_COLLECTION_NAME,
            session_key=self.session_key,
        )

        try:
            current_timestamp = get_current_timestamp()
            query = {constants.END_TIME: {constants.LESS_THAN_OPERATOR: str(int(current_timestamp))}}
            # Using string comparision here seems a little dangerous, but because get_current_timestamp returns an
            # int (casted for future proofing), and ascii comparison works between two integers, this should be fine
            access_object.delete_items_by_query(query)
            self.logger.debug('Deleted expired snoozes with query %s', query)
        except Exception as e:
            self.logger.exception('Exception deleting expired snoozes, with exception %s', e)


if __name__ == "__main__":
    worker = AlertsTTLModularInput()
    worker.execute()
