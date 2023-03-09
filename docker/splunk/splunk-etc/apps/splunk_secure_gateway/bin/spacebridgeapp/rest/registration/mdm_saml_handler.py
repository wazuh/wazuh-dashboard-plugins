"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for the Spacebridge SAML MDM registration process
"""
import base64
import json
import os
import sys
from functools import partial

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore
from spacebridgeapp.rest.services.splunk_service import update_or_create_sensitive_data, fetch_sensitive_data
from cloudgateway.private.encryption.encryption_handler import sign_verify, sign_detached, encrypt_for_send, \
    decrypt_for_receive, decrypt_session_token
from cloudgateway.private.sodium_client import SodiumClient
from cloudgateway.encryption_context import EncryptionContext, generate_keys
from cloudgateway.device import EncryptionKeys
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from cloudgateway.splunk.auth import SplunkJWTCredentials
from spacebridgeapp.util import constants, py23
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest import async_base_endpoint
from spacebridgeapp.rest.util.helper import extract_parameter
from spacebridgeapp.util.constants import DEVICE_NAME, DEVICE_TYPE, DEVICE_ID, APP_ID, \
    SESSION, MDM_SIGN_PUBLIC_KEY, USER, BODY, MDM_SIGNATURE, SIGN_PUBLIC_KEY, SIGN_PRIVATE_KEY, \
    MDM_SIGN_PRIVATE_KEY, ENCRYPT_PUBLIC_KEY, PUBLIC_KEY, SYSTEM_AUTHTOKEN, PAYLOAD, ENTRY, CONTENT, \
    HTTP_PORT
from http import HTTPStatus
from spacebridgeapp.request.request_processor import async_is_valid_session_token
from spacebridgeapp.rest.registration.util import validate_registration_via_webhook, generate_jwt_token

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_registration_saml")

DEVICE_REGISTRATION_ATTRS = [DEVICE_NAME, DEVICE_TYPE, DEVICE_ID, APP_ID]
DEVICE_PUBLIC_KEYS_ATTRS = [ENCRYPT_PUBLIC_KEY, SIGN_PUBLIC_KEY]


class MdmSamlHandler(async_base_endpoint.AsyncBaseRestHandler):
    """
    Main class for handling REST SAML Registration endpoint. Subclasses the spacebridge_app
    AsyncBaseRestHandler
    """

    async def post(self, request):
        user = request[SESSION][USER]
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        body = json.loads(request[PAYLOAD])
        mdm_signing_bundle = get_mdm_signing_bundle(system_authtoken)
        result = await self.handle_saml_mdm_request(user, request, system_authtoken, mdm_signing_bundle, body)
        return result

    async def handle_saml_mdm_request(self, user, request, system_authtoken, mdm_signing_bundle, body):
        """
        Handles the MDM SAML Registration Request.
        Validates signature sent from client, validates session token, generates a JWT token,
        and sends it encrypted using splapp's keys and the client public key
        :param user: string provided by rest handler
        :param session_token: string
        :param system_authtoken: string
        :param mdm_signing_bundle: Object
        :param body: JSON
        :return: Reponse object with payload and status
        """
        validate_registration_via_webhook(user)

        public_key = base64.b64decode(extract_parameter(body, PUBLIC_KEY, BODY))
        mdm_signature = base64.b64decode(extract_parameter(body, MDM_SIGNATURE, BODY))

        client_keys = EncryptionKeys(None, None, public_key, None)
        client_encryption_context = EncryptionContext(client_keys)

        try:
            valid_signature = sign_verify(SodiumClient(LOGGER.getChild("sodium_client")),
                                          base64.b64decode(mdm_signing_bundle[SIGN_PUBLIC_KEY].encode('utf8')),
                                          client_encryption_context.encrypt_public_key(),
                                          mdm_signature)
        except Exception as e:
            LOGGER.exception("Exception verifying signature from client for user={}".format(user))
            return {
                'payload': {
                    'token': "",
                    'user': user,
                    'status': HTTPStatus.UNAUTHORIZED
                },
                'status': HTTPStatus.OK
            }

        async_splunk_client = self.async_client_factory.splunk_client()
        port_number = await get_http_port_number(async_splunk_client, system_authtoken)
        session_token = get_session_token_from_request(request, port_number)
        valid_request = await async_is_valid_session_token(user, session_token, async_splunk_client)

        LOGGER.info("Received new mdm registration request by user={}".format(user))

        if valid_signature and valid_request:
            try:
                credentials = generate_jwt_token(user, system_authtoken)
            except Exception as e:
                LOGGER.exception("Exception fetching jwt token for user={} with message={}".format(user, e))
                return {
                    'payload': {
                        'token': "",
                        'user': user,
                        'status': HTTPStatus.UNPROCESSABLE_ENTITY
                    },
                    'status': HTTPStatus.OK
                }

            splapp_encryption_context = SplunkEncryptionContext(system_authtoken,
                                                                constants.SPACEBRIDGE_APP_NAME,
                                                                SodiumClient(LOGGER.getChild("sodium_client")))

            jwt_credentials = credentials.get_credentials() if sys.version_info < (3, 0) else str.encode(
                credentials.get_credentials())
            # Encrypt session token using splapp keys
            secured_session_token = splapp_encryption_context.secure_session_token(jwt_credentials)
            # Encrypt session token using client's given public key
            encrypted_jwt_token = encrypt_for_send(SodiumClient(LOGGER.getChild("sodium_client")),
                                                         client_encryption_context.encrypt_public_key(),
                                                         secured_session_token)
            base64_encrypted_jwt_token = py23.b64encode_to_str(encrypted_jwt_token)

            return {
                'payload': {
                    'token': base64_encrypted_jwt_token,
                    'user': user,
                    'status': HTTPStatus.OK
                },
                'status': HTTPStatus.OK
            }
        else:
            LOGGER.info("Error: Mismatched user={} and session token".format(user))
            return {
                'payload': {
                    'token': "",
                    'user': user,
                    'status': HTTPStatus.UNAUTHORIZED
                },
                'status': HTTPStatus.OK
            }


def get_session_token_from_request(request, port_number):
    key = f'splunkd_{port_number}'
    cookies = request[constants.COOKIES]
    cookies_obj = {}
    for c in cookies:
        cookies_obj[c[0]] = c[1]
    return cookies_obj[key]


def get_mdm_signing_bundle(system_authtoken):
    """
    Method to fetch that the mdm signing bundle for this instance
    :param request: Object
    :return: Object
    """
    response = {}
    public_key = fetch_sensitive_data(system_authtoken, MDM_SIGN_PUBLIC_KEY)
    private_key = fetch_sensitive_data(system_authtoken, MDM_SIGN_PRIVATE_KEY)
    response.update({SIGN_PUBLIC_KEY: public_key, SIGN_PRIVATE_KEY: private_key})
    return response


async def get_http_port_number(async_splunk_client, system_authtoken):
    response = await async_splunk_client.async_get_server_settings(SplunkAuthHeader(system_authtoken))
    response_json = await response.json()
    http_port_number = response_json[ENTRY][0][CONTENT][HTTP_PORT]
    return http_port_number
