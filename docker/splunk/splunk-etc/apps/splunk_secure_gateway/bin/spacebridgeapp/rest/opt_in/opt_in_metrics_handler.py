"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for accessing and setting opt-in signals
"""
import sys
import json
import splunk
from http import HTTPStatus

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.time_utils import get_current_timestamp
from spacebridgeapp.rest.base_endpoint import BaseRestHandler, build_error_payload
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KVStore
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SESSION, AUTHTOKEN, USER, PAYLOAD, STATUS, \
    META_COLLECTION_NAME, NOBODY, TIMESTAMP, KEY, SYSTEM_AUTHTOKEN
from spacebridgeapp.metrics.metrics_collector import OptInPageMetric


LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "opt_in_metrics_handler")





class OptInMetrics(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the opt_in endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)


    def post(self, request):
        """
        Post call to opt-in metrics by type.  
        :param request:
        :return:
        """
        try:
            # system_auth token required to add key in nobody namespace
            system_authtoken = request[SYSTEM_AUTHTOKEN]
            user = request[SESSION][USER]
            post_data = json.loads(request['payload'])
            option = post_data['option']
            metric = OptInPageMetric(system_authtoken, LOGGER, user, option)
            LOGGER.debug('opt_in_metrics=%s', metric)
            metric.send_to_telemetry()
            return {
                PAYLOAD: {},
                STATUS: HTTPStatus.OK
            }
        except splunk.RESTException as e:
            return build_error_payload(e)



