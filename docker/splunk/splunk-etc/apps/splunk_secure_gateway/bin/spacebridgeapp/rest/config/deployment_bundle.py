"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for creating and accessing an MDM deployment bundle
"""

import sys
import json
import time
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23
from spacebridgeapp.util.config import secure_gateway_config as config

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore
from spacebridgeapp.rest.services.splunk_service import update_or_create_sensitive_data, fetch_sensitive_data
from spacebridgeapp.rest.services.spacebridge_service import send_mdm_signing_key_to_spacebridge
from spacebridgeapp.util.mtls import build_key_bundle
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SESSION, AUTHTOKEN, MDM_SIGN_PUBLIC_KEY, \
    USER_META_COLLECTION_NAME, USER, MDM_KEYPAIR_GENERATION_TIME, KEY, TIMESTAMP, \
    SIGN_PUBLIC_KEY, SIGN_PRIVATE_KEY, MDM_SIGN_PRIVATE_KEY, SYSTEM_AUTHTOKEN, \
    PAYLOAD, STATUS

from cloudgateway.private.sodium_client import SodiumClient
from splunk.persistconn.application import PersistentServerConnectionApplication

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "deployment_bundle")

__MTLS_ENABLED = config.get_mtls_enabled()


def _load_key_bundle(session_token):
    if not __MTLS_ENABLED:
        return None

    return build_key_bundle(session_token)


class DeploymentBundle(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the deployment bundle endpoint. Subclasses the spacebridge_app
    BaseRestHandler.

    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
        Handler which returns mdm signing public key
        """

        response = {}
        try:
            kvstore_service = kvstore(collection=USER_META_COLLECTION_NAME, session_key=request[SESSION][AUTHTOKEN], owner=request[SESSION][USER])
            result = json.loads(kvstore_service.get_item_by_key(MDM_KEYPAIR_GENERATION_TIME)[1])
            response.update({TIMESTAMP: result[TIMESTAMP]})
        except Exception as e:
            # If key not in kvstore
            if hasattr(e, 'statusCode') and e.statusCode == HTTPStatus.NOT_FOUND:
                return {
                    PAYLOAD: {
                        'message': 'Could not find mdm keypair update time in kvstore.\n Generate an instance ID file and try again.',
                    },
                    STATUS: HTTPStatus.NOT_FOUND
                }
            return {
                PAYLOAD: {
                    'message': str(e)
                },
                STATUS: HTTPStatus.BAD_REQUEST
            }


        try:
            public_key = fetch_sensitive_data(request[SESSION][AUTHTOKEN], MDM_SIGN_PUBLIC_KEY)
            private_key = fetch_sensitive_data(request[SESSION][AUTHTOKEN], MDM_SIGN_PRIVATE_KEY)
            response.update({'sign_public_key': public_key, 'sign_private_key': private_key})
        except Exception as e:
            # If key not in storage/passwords
            if hasattr(e, 'statusCode') and e.statusCode == HTTPStatus.NOT_FOUND:
                return {
                    PAYLOAD: {
                        'message': 'Could not find one or both of key={} and key={} in /storage/passwords'
                                   .format(MDM_SIGN_PUBLIC_KEY,
                                           MDM_SIGN_PRIVATE_KEY),
                    },
                    STATUS: HTTPStatus.NOT_FOUND
                }

            return {
                PAYLOAD: {
                    'message': str(e),
                },
                STATUS: HTTPStatus.BAD_REQUEST
            }

        return {
            PAYLOAD: response,
            STATUS: HTTPStatus.OK
        }

    def post(self, request):
        """
        Handler which generates and returns an mdm keypair
        """

        # generate mdm credentials
        LOGGER.info("Generating MDM Credentials")
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        key_bundle = _load_key_bundle(system_authtoken)

        [public_key, private_key] = self.sodium_client.sign_generate_keypair()
        now = int(time.time())

        response = {}
        response['message'] = []
        status = HTTPStatus.OK

        try:
            # send public signing key to spacebridge
            send_mdm_signing_key_to_spacebridge(request[SESSION][AUTHTOKEN], public_key, key_bundle)

        except Exception as e:
            status = HTTPStatus.INTERNAL_SERVER_ERROR
            LOGGER.warn("Failed to register mdm keys with spacebridge. error=%s", e)
            return {
                PAYLOAD: {'failed_save': True, 'message': e},
                STATUS: status,
            }

        # update key generation timestamp
        try:
            kvstore_service = kvstore(collection=USER_META_COLLECTION_NAME, session_key=request[SESSION][AUTHTOKEN], owner=request[SESSION][USER])
            entry = {KEY: MDM_KEYPAIR_GENERATION_TIME, TIMESTAMP: now}
            kvstore_service.insert_or_update_item_containing_key(entry)

        except Exception as e:
            status = HTTPStatus.INTERNAL_SERVER_ERROR
            response['failed_timesave'] = True
            response['message'].append(str(e))

        # store to storage/passwords
        try:
            [_, created_public_key] = update_or_create_sensitive_data(request[SESSION][AUTHTOKEN], MDM_SIGN_PUBLIC_KEY,
                                                                      py23.b64encode_to_str(public_key))

        except Exception as e:
            status = HTTPStatus.INTERNAL_SERVER_ERROR
            response['failed_public_localsave'] = True
            response['message'].append(str(e))

        try:
            [_, created_private_key] = update_or_create_sensitive_data(request[SESSION][AUTHTOKEN], MDM_SIGN_PRIVATE_KEY,
                                                                       py23.b64encode_to_str(private_key))

        except Exception as e:
            status = HTTPStatus.INTERNAL_SERVER_ERROR
            response['failed_private_localsave'] = True
            response['message'].append(str(e))

        # don't pass back the message if we have no errors
        if not response['message']:
            del response['message']

        response[SIGN_PUBLIC_KEY] = py23.b64encode_to_str(public_key)
        response[SIGN_PRIVATE_KEY] = py23.b64encode_to_str(private_key)
        response[TIMESTAMP] = now

        return {
            PAYLOAD: response,
            STATUS: status,
        }
