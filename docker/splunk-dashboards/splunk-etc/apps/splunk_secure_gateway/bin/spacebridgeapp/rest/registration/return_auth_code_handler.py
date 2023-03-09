"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for the Spacebridge registration v2 process
"""

from http import HTTPStatus
import sys

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
import asyncio
from spacebridgeapp.util import py23

from cloudgateway.splunk.auth import SplunkJWTCredentials
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from cloudgateway.private.sodium_client import SodiumClient
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.util.constants import DEVICE_NAME, DEVICE_TYPE, DEVICE_ID, APP_ID, PLATFORM, \
    ENCRYPT_PUBLIC_KEY, SIGN_PUBLIC_KEY, SESSION, USER, AUTHTOKEN, SYSTEM_AUTHTOKEN,HTTP_DOMAIN, GRPC_DOMAIN
from spacebridgeapp.rest.registration.util import is_valid_session_token, generate_jwt_token
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.rest.config.get_spacebridge_servers import get_current_spacebridge_server_bundle
from cloudgateway.registration_v2 import start_registration
from spacebridge_protocol.http_pb2 import EnvironmentMetadata
from spacebridge_protocol.registration_v2_pb2 import ClientRegistration
from splapp_protocol.request_pb2 import VersionGetResponse
from spacebridgeapp.request.version_request_processor import build_version_get_response


from splunk import rest


LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "return_auth_code")

DEVICE_REGISTRATION_ATTRS = [DEVICE_NAME, DEVICE_TYPE, DEVICE_ID, APP_ID, PLATFORM]
DEVICE_PUBLIC_KEYS_ATTRS = [ENCRYPT_PUBLIC_KEY, SIGN_PUBLIC_KEY]


class ReturnAuthCodeHandler(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling REST RegistrationV2 endpoint. Subclasses the spacebridge_app
    BaseRestHandler. This multiple inheritance is an unfortunate neccesity based on the way
    Splunk searches for PersistentServerConnectionApplications
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.base_uri = rest.makeSplunkdUri()
        self.async_client_factory = AsyncClientFactory(self.base_uri)

    def post(self, request):
        user = request[SESSION][USER]
        session_token = request[SESSION][AUTHTOKEN]
        system_authtoken = request[SYSTEM_AUTHTOKEN]

        return handle_initiate_registration(user, session_token, system_authtoken, self.async_client_factory)


def handle_initiate_registration(user, session_token, system_authtoken, async_client_factory):
    """
    Handler for the initial RegistrationV2 call. This function validates session token, generates a JWT token,
    and retrieves an auth code to send to frontend
    :param user: User provided by rest handler
    :param system_authtoken: System-level access token for writing to the kvstore
    :return: auth_code
    """

    LOGGER.info("Starting handle initiate registration")
    splapp_encryption_context = SplunkEncryptionContext(system_authtoken,
                                                        constants.SPACEBRIDGE_APP_NAME,
                                                        SodiumClient(LOGGER.getChild("sodium_client")))

    valid_request = is_valid_session_token(user, session_token)
    if valid_request:
        try:
            credentials = generate_jwt_token(user, system_authtoken)
        except Exception as e:
            LOGGER.info("Failed to fetch jwt token for user={} with message={}".format(user, str(e)))
            jwt_error_message = 'Registration Error: Failed to fetch jwt token for user={}, with error={}'.format(user, str(e))
            return {
                'payload': {
                    'message': jwt_error_message,
                },
                'status': HTTPStatus.UNPROCESSABLE_ENTITY,
            }

    version_get_response = VersionGetResponse()
    registration_info = {
        constants.REGISTRATION_TYPE: VersionGetResponse.SAML,
        constants.REGISTRATION_METHOD: VersionGetResponse.IN_APP
    }
    try:
        version_get_response = build_version_get_response(session_token=session_token, app_id="",
                                                          device_name="", async_client_factory=async_client_factory,
                                                          registration_info=registration_info)
    except Exception as e:
        LOGGER.exception("exception fetching environment metadata")

    env_metadata = EnvironmentMetadata(serializedMetadata=version_get_response.SerializeToString())

    LOGGER.debug("Starting registration for user={}".format(user))
    auth_code = start_registration(splapp_encryption_context, credentials, env_metadata, config)

    # Get spacebridge HTTP domain and GRPC domain from KVStore
    # If HTTP_DOMAIN not found default back to config, GRPC_DOMAIN not found just return empty
    spacebridge_server_bundle = get_current_spacebridge_server_bundle(session_token)
    spacebridge_http_domain = spacebridge_server_bundle.get(HTTP_DOMAIN, config.get_spacebridge_server())
    spacebridge_grpc_domain = spacebridge_server_bundle.get(GRPC_DOMAIN, '')

    # Client expects both as urls
    spacebridge_http_url = f'https://{spacebridge_http_domain}'
    spacebridge_grpc_url = f'https://{spacebridge_grpc_domain if spacebridge_grpc_domain else ""}'

    LOGGER.debug("Done registration for user={}".format(user))

    return {
        'payload': {
            'message': 'Initiate registration successful',
            'auth_code': auth_code,
            'spacebridge_server_url': spacebridge_http_url,
            'spacebridge_grpc_url': spacebridge_grpc_url,
            'token_id': credentials.token_id},
        'status': HTTPStatus.OK,
    }
