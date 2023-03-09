"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for testing websocket connectivity
"""

import base64
import sys
import json
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23
import splunk.rest as rest
import requests
from cloudgateway.encryption_context import EncryptionContext, generate_keys
from cloudgateway.device import DeviceInfo
from cloudgateway.private.registration.util import sb_auth_header
from cloudgateway.registration import request_code, fetch_server_credentials
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.debug.e2e_test import wss
from spacebridgeapp.util.guid_generator import get_guid
from spacebridgeapp.rest.debug.util import create_splunk_resp

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "e2e_wss_test")

# Module level constants
CLIENT_VERSION = "1.0.0"
APP_ID = "com.splunk.mobile.Stargate"
DEFAULT_REQUEST_MODE = "clientSingleRequest"
DEFAULT_REQUEST_TYPE = "versionGetRequest"
TEST_DEVICE_NAME = "ssg_e2e_test"
AUTH_CODE_STATUS = 'auth_code_status'
SERVER_REGISTRATION_STATUS = 'server_registration_status'
COMPLETED_CLIENT_REGISTRATION = 'completed_client_registration'
WSS_RID = 'wss_rid'
WSS_RESPONSE = 'wss_response'
ERROR = 'error'



def create_encryption_ctx():
    """Create new encryption context"""
    return EncryptionContext(generate_keys())


def create_client_device(client_encryption_ctx: EncryptionContext):
    """Create a new client device object given an encryption ctx"""
    return DeviceInfo(client_encryption_ctx.encrypt_public_key(),
                      client_encryption_ctx.sign_public_key(),
                      base64.b64decode(sb_auth_header(client_encryption_ctx)),
                      app_id=APP_ID,
                      client_version=CLIENT_VERSION)


class TestWebsocketHandler(BaseRestHandler, PersistentServerConnectionApplication):
    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.base_uri = rest.makeSplunkdUri()

    def get(self, request):
        """
        Perform a test registration and websocket message
        """
        LOGGER.info("Received request to run a test end-to-end request")

        response = {
            AUTH_CODE_STATUS: False,
            SERVER_REGISTRATION_STATUS: False,
            COMPLETED_CLIENT_REGISTRATION: False,
            WSS_RESPONSE: False,
            ERROR: False,
        }

        user_token = request['session']['authtoken']
        system_authtoken = request['system_authtoken']
        user = request['session']['user']
        token_id = None

        try:
            ## Init by cleaning up test device if it wasn't cleaned up for whatever reason from last run
            self.delete_device(user, TEST_DEVICE_NAME, user_token)

            request_type = json.loads(request['query']['request_type'])
            request_mode = request['query']['request_mode']
            client_encryption_ctx = create_encryption_ctx()
            client_device = create_client_device(client_encryption_ctx)
            auth_code = request_code(client_device, client_encryption_ctx)

            r1 = requests.get(f"{self.base_uri}services/ssg/registration/query",
                              params={"auth_code": auth_code, "device_name": TEST_DEVICE_NAME},
                              verify=False,
                              headers={'Authorization': f'Splunk {user_token}'})

            response[AUTH_CODE_STATUS] = r1.status_code

            if r1.status_code != 200:
                response[ERROR] = r1.text
                return json.dumps(create_splunk_resp(response))

            response_jsn = json.loads(r1.text)
            temp_key = response_jsn['temp_key']

            r2 = requests.post(
                f"{self.base_uri}services/ssg/registration/confirmation?&auth_code={auth_code}"\
                    "&self_register=False&auth_method=saml",
                json={'temp_key': temp_key},
                verify=False,
                headers={'Authorization': f'Splunk {user_token}',
                        'Content-Type': 'application/json'})

            response['server_registration_status'] = r2.status_code
            LOGGER.info("completed registration with response={}".format(r2.text))
            token_id = r2.json()['token_id']

            if r2.status_code != 201:
                response[ERROR] = r2.text
                return json.dumps(create_splunk_resp(response))

            paired_server_device, credentials_bundle = fetch_server_credentials(auth_code, client_encryption_ctx)

            if not paired_server_device:
                response[ERROR] = "Failed to complete client side registration"
                return json.dumps(create_splunk_resp(response))

            response['completed_client_registration'] = True
            LOGGER.info("Completed client side registration")

            # Websocket test
            rid = get_guid()
            response[WSS_RID] = rid
            wss_response = wss.run_wss_test(request_type,
                                            credentials_bundle,
                                            client_encryption_ctx,
                                            paired_server_device,
                                            rid,
                                            type=request_mode)
            LOGGER.info("Completed websocket test")
            response[WSS_RESPONSE] = str(wss_response)

        except Exception as e:
            LOGGER.exception(e)
            response[ERROR] = str(e)

        # Clean up
        self.delete_device(user, TEST_DEVICE_NAME, user_token)
        if token_id:
            self.delete_token(system_authtoken, token_id, user)

        return {
            'raw_payload': json.dumps(create_splunk_resp(response)),
            'status': 200
        }



    def delete_device(self, user, device_name, user_token):
        """ delete our fake device once we are done with the test"""
        r = requests.get(f"{self.base_uri}services/ssg/kvstore/user_devices",
                         headers={'Authorization': f'Splunk {user_token}'},
                         verify=False)

        devices = [d for d in r.json() if d['device_name'] == device_name]
        device_id = devices[0]['_key'] if devices else ""

        if device_id:
            r = requests.post(f"{self.base_uri}services/ssg/kvstore/delete_device", verify=False,
                               params={'device_owner': user, 'device_key': device_id},
                               headers={'Authorization': 'Splunk {}'.format(user_token)})
            LOGGER.info("deleting device with response={}, code={}".format(r.text, r.status_code))
        else:
            LOGGER.info("device id not found so skipping deletion")

    def delete_token(self, system_token, token_id, user):
        """ Delete JWT token with given id """
        r = requests.delete(f'{rest.makeSplunkdUri()}services/authorization/tokens/{user}',
                            verify=False,
                            data={'id': token_id},
                            headers={'Authorization': f'Splunk {system_token}'})

        LOGGER.info("deleted token={} with response={}".format(token_id, r.text))


