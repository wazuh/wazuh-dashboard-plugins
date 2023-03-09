
"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for kvstore dashboard client
"""

import base64
import sys
import json
from http import HTTPStatus
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23
import splunk.rest as rest
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject
from spacebridgeapp.rest.debug.util import create_splunk_resp
from spacebridgeapp.util.constants import OWNER, LIMIT, SORT, APP

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "kvstore_dashboard_client")

COLLECTION = "collection"
DELETE_FIELD_NAME = "delete_field_name"
DELETE_FIELD_VALUE = "delete_field_value"
POST_DATA = "post_data"


class KvstoreDashboardClientHandler(BaseRestHandler, PersistentServerConnectionApplication):

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.base_uri = rest.makeSplunkdUri()

    def get(self, request):
        """
        Perform a test registration and websocket message
        """
        response = {'result': '', 'error': ''}

        user_token = request['session']['authtoken']

        try:
            collection = request['query'][COLLECTION]
            owner = request['query'][OWNER]
            app = request['query'][APP]
            limit = request['query'][LIMIT]
            sort = request['query'][SORT] if SORT in request['query'] else ""

            response['result'] = json.dumps(self.exec_get(owner, collection, app, limit, sort, user_token), indent=3)

        except Exception as e:
            LOGGER.exception(str(e))
            response['result'] = str(e)

        return {
            'raw_payload': json.dumps(create_splunk_resp(response)),
            'status': 200
        }

    def exec_get(self, owner, collection, app, limit, sort, auth_token):
        kvstore_client = KVStoreCollectionAccessObject(collection, auth_token, app, owner)
        r, devices = kvstore_client.get_all_items(limit=limit, sort=sort)
        return json.loads(devices)
