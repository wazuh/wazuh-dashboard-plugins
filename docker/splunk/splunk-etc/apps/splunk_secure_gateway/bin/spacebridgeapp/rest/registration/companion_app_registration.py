"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST handler for companion apps to register with Splunk Secure Gateway
"""
import base64
import json
import os
import sys
from http import HTTPStatus
from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from spacebridgeapp.util import py23, constants
from cloudgateway.private.encryption.encryption_handler import sign_verify
from cloudgateway.private.sodium_client.sharedlib_sodium_client import SodiumClient
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject
from spacebridgeapp.rest.util.helper import extract_parameter
from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_registration_query")

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

# Constants
FRIENDLY_NAME = 'friendly_name'
VERSION = 'version'
APP_ID = 'app_id'
SIGNATURE = 'signature'
APP_NAME = 'app_name'
BASE_URL = 'base_url'


class MissingFieldsException(Exception):
    def __init__(self, missing_fields):
        self.missing_fields = missing_fields
        self.statusCode = HTTPStatus.BAD_REQUEST
        self.msg = "Missing necessary fields={}".format(missing_fields)

    def __eq__(self, obj):
        if isinstance(obj, self.__class__):
            return self.missing_fields == obj.missing_fields and self.statusCode == obj.statusCode
        return False


class InvalidSignatureException(Exception):
    def __init__(self, msg=None):
        self.statusCode = HTTPStatus.BAD_REQUEST
        self.msg = "The provided signature was invalid. {}".format(msg)

    def __eq__(self, obj):
        if isinstance(obj, self.__class__):
            return all(getattr(obj, attr) == getattr(self, attr) for attr in vars(self).keys())
        return False


class CompanionAppRegistrationHandler(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Endpoint used to register companion splunk apps with Splunk Secure Gateway
    """

    REQUIRED_FIELDS = {FRIENDLY_NAME, VERSION, APP_ID, SIGNATURE, APP_NAME, BASE_URL}
    SSG_SIGNING_PK = base64.b64decode("oVwwBhettnxt1QBGpVBV2pOKmFkip+hH6ybFG3QqZkE=")
    COMPANION_APPS_COLLECTION_NAME = "companion_apps"
    APP_IDS_LABEL = "app_ids"

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """ get registered companion apps """

        try:
            system_authtoken = request['system_authtoken']
            kvstore_client = KVStoreCollectionAccessObject(collection=self.COMPANION_APPS_COLLECTION_NAME,
                                                           session_key=system_authtoken)
            r, content = kvstore_client.get_all_items()
            payload = json.loads(content.decode('utf-8')) if r.status == HTTPStatus.OK else content.decode('utf-8')

            return {
                constants.PAYLOAD:  payload,
                constants.STATUS: r.status
            }
        except Exception as e:
            LOGGER.exception('An error occurred fetching registered companion apps')
            raise e

    def post(self, request):
        """ register a new companion app. Must have valid signature"""

        app_bundle = json.loads(request[constants.PAYLOAD])
        session_token = request['session']['authtoken']

        # Validate if provided bundle has all the required fields
        self.validate_app_bundle(app_bundle)

        # Validate provided signature
        self.validate_signature(app_bundle)

        # Write bundle to KV Store
        kvstore_payload = self.build_kvstore_payload(app_bundle)
        kvstore_client = KVStoreCollectionAccessObject(collection=self.COMPANION_APPS_COLLECTION_NAME,
                                                       session_key=session_token)
        r, content = kvstore_client.insert_or_update_item_containing_key(kvstore_payload)
        payload = json.loads(content.decode('utf-8')) if r.status == HTTPStatus.OK else content.decode('utf-8')

        return {
            constants.PAYLOAD: payload,
            constants.STATUS: r.status
        }

    def delete(self, request):
        """ delete a companion app using comma separated list of app_ids.
        e.g. app_ids=id1,id2,id3
        """
        session_token = request['session']['authtoken']
        app_ids = extract_parameter(request['query'], self.APP_IDS_LABEL, "query")
        app_ids_lst = app_ids.strip().split(',')

        query = {constants.OR_OPERATOR: [{constants.KEY: app_id} for app_id in app_ids_lst]}
        kvstore_client = KVStoreCollectionAccessObject(collection=self.COMPANION_APPS_COLLECTION_NAME,
                                                       session_key=session_token)

        r, content = kvstore_client.delete_items_by_query(query)

        return {
            constants.PAYLOAD: content.decode('utf-8'),
            constants.STATUS: r.status
        }

    def validate_app_bundle(self, app_bundle):
        """
        Check if app bundle contains all necessary info
        """
        missing_fields = {field for field in self.REQUIRED_FIELDS if field not in app_bundle}

        if missing_fields:
            raise MissingFieldsException(missing_fields)

        return True

    def validate_signature(self, app_bundle):
        """
        Validate signature provided in app bundle. The signature should be generated by signing the app id using the
        signing private key and we verify this by using the app id and the signing public key.
        """

        app_id = app_bundle[APP_ID].encode('utf-8')

        try:
            signature = base64.b64decode(app_bundle['signature'])
            if not sign_verify(self.sodium_client, self.SSG_SIGNING_PK, app_id, signature):
                raise InvalidSignatureException()
        except Exception as e:
            raise InvalidSignatureException(msg=str(e))

    @staticmethod
    def build_kvstore_payload(app_bundle):
        """ payload which gets written into kvstore """
        return {
            FRIENDLY_NAME: app_bundle[FRIENDLY_NAME],
            VERSION: app_bundle[VERSION],
            APP_NAME: app_bundle[APP_NAME],
            BASE_URL: app_bundle[BASE_URL],
            constants.KEY: app_bundle[APP_ID]
        }


