"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for the 2nd part of the Spacebridge registration process for
auth code registration: completing device pairing
"""

import sys
import json
import base64
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from splunk.persistconn.application import PersistentServerConnectionApplication

from spacebridgeapp.util import py23
import splunk.rest as rest
from spacebridgeapp.rest.util.errors import SpacebridgePermissionsError
from cloudgateway.registration import pair_device
from cloudgateway.registration_auth_v2 import pair_device_v2
from cloudgateway.device import DeviceInfo, EnvironmentMetadata
from cloudgateway.splunk.auth import SplunkJWTCredentials
from cloudgateway.auth import SimpleUserCredentials
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.util import constants
from spacebridgeapp.util.constants import DEVICE_NAME, DEVICE_TYPE, DEVICE_ID, APP_ID, \
    APP_NAME, PLATFORM, DEVICE_REGISTERED_TIMESTAMP, ENCRYPT_PUBLIC_KEY, SIGN_PUBLIC_KEY, KEY, \
    AUTH_CODE, USERNAME, BODY, PASSWORD, TEMP_KEY, SELF_REGISTER, MESSAGES, TYPE, \
    ERROR, TEXT, ENTRY, CONTENT, QUERY, SESSION, USER, AUTHTOKEN, SYSTEM_AUTHTOKEN, PAYLOAD, \
    REGISTRATION_TYPE, REGISTRATION_METHOD, AUTH_METHOD, DEVICE_MANAGEMENT_METHOD, TRUE, FALSE
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore
from spacebridgeapp.rest.util.helper import extract_parameter
from spacebridgeapp.rest.config.deployment_info import get_deployment_friendly_name
from spacebridgeapp.request.request_processor import BasicAuthHeader
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from splapp_protocol.request_pb2 import VersionGetResponse
from spacebridgeapp.rest.registration.util import RegistrationMethod, AuthMethod, DeviceManagementMethod, \
    is_valid_session_token, validate_registration_via_webhook, generate_jwt_token, extract_parameter_if_exists
from spacebridgeapp.request.version_request_processor import build_version_get_response
from spacebridgeapp.util.time_utils import get_current_timestamp
from spacebridgeapp.versioning.package_version import app_version
from spacebridgeapp.rest.services.splunk_service import authenticate_splunk_credentials
from http import HTTPStatus

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_registration_auth_code")

DEVICE_REGISTRATION_ATTRS = [DEVICE_NAME, DEVICE_TYPE, DEVICE_ID, APP_ID,
                             APP_NAME, PLATFORM, DEVICE_REGISTERED_TIMESTAMP,
                             DEVICE_MANAGEMENT_METHOD]
DEVICE_PUBLIC_KEYS_ATTRS = [ENCRYPT_PUBLIC_KEY, SIGN_PUBLIC_KEY]

class CompletePairingHandler(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling REST Registration endpoint. Subclasses the spacebridge_app
    BaseRestHandler. This multiple inheritance is an unfortunate neccesity based on the way
    Splunk searches for PersistentServerConnectionApplications
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.base_uri = rest.makeSplunkdUri()
        self.async_client_factory = AsyncClientFactory(self.base_uri)

    def post(self, request):
        auth_code = extract_parameter(request[QUERY], AUTH_CODE, QUERY)
        auth_method = extract_parameter_if_exists(request[QUERY], AUTH_METHOD, QUERY, AuthMethod.LOCAL_LDAP.value)
        self_register = extract_parameter_if_exists(request[QUERY], SELF_REGISTER, QUERY, FALSE)
        user = request[SESSION][USER]
        session_token = request[SESSION][AUTHTOKEN]
        system_authtoken = request[SYSTEM_AUTHTOKEN]
        body = json.loads(request[PAYLOAD])

        return handle_confirmation(auth_code, auth_method, self_register, user, session_token,
                                    system_authtoken, body, self.async_client_factory)

def handle_confirmation(auth_code, auth_method, self_register, user, session_token, system_authtoken, body,
                        async_client_factory):
    """
    Handler for the final DevicePairingConfirmationRequest call. This function:
        1. Authenticates the supplied credentials (username and password, or SAML auth)
        2. Retrieves temporary record from the kvstore
        3. Checks if app_type has been disabled since registration
        4. Makes the DevicePairingConfirmationRequest request to the server
        5. Creates a new permanent record for the device in the kvstore
        6. Deletes the temporary kvstore record

    :param auth_code: User-entered authorization code to be returned to Spacebridge
    :param auth_method: If authorization method is SAML or Local/LDAP
    :param self_register: If request was from self_registration
    :param user: User provided by rest handler
    :param session_token: User-provided session token
    :param system_authtoken: System-level access token for writing to the kvstore
    :param body: Parsed JSON body of the incoming POST request
    :return: Success message
    """

    kvstore_temp = KvStore(constants.UNCONFIRMED_DEVICES_COLLECTION_NAME, system_authtoken, owner=user)
    encryption_context = SplunkEncryptionContext(system_authtoken, constants.SPACEBRIDGE_APP_NAME)
    saml_register = auth_method == AuthMethod.SAML.value
    self_register = self_register.lower() == TRUE
    # Flag to indicate if registration should be done w/ jwt token (true) or local auth (false)
    register_with_jwt = saml_register or self_register

    # Authenticates the supplied user
    if register_with_jwt:
        validate_registration_via_webhook(user)
    else:
        username = extract_parameter(body, USERNAME, BODY)
        password = extract_parameter(body, PASSWORD, BODY)
        validate_registration_via_webhook(username)
        username = handle_local_auth(user, username, password)

    # Retrieves temporary record from the kvstore
    temp_key = extract_parameter(body, TEMP_KEY, BODY)
    r, temp_record = kvstore_temp.get_item_by_key(temp_key)
    temp_record = json.loads(temp_record)

    device_id = temp_record[DEVICE_ID]
    device_id_raw = base64.b64decode(device_id)

    device_registration = {KEY: py23.urlsafe_b64encode_to_str(device_id_raw)}
    device_public_keys = {KEY: py23.urlsafe_b64encode_to_str(device_id_raw)}

    for k in temp_record.keys():
        if k in DEVICE_REGISTRATION_ATTRS:
            device_registration[k] = temp_record[k]
        if k in DEVICE_PUBLIC_KEYS_ATTRS:
            device_public_keys[k] = temp_record[k]

    # Extract device encryption information from temporary record
    device_encryption_info = DeviceInfo(
        base64.b64decode(temp_record[ENCRYPT_PUBLIC_KEY]),
        base64.b64decode(temp_record[SIGN_PUBLIC_KEY]),
        base64.b64decode(temp_record[DEVICE_ID]),
        "NA",
        app_id=temp_record[APP_ID],
        app_name=temp_record[DEVICE_TYPE]
    )

    deployment_friendly_name = get_deployment_friendly_name(system_authtoken)

    # Generate credentials
    if register_with_jwt:
        if is_valid_session_token(user, session_token):
            try:
                credentials = generate_jwt_token(user, system_authtoken)
            except Exception as e:
                LOGGER.error("Failed to fetch jwt token for user={} with message={}".format(user, str(e)))
                raise e
        else:
            return jwt_error_response(user)
    else:
        credentials = SimpleUserCredentials(username, password)

    # Build version get response
    version_get_response = VersionGetResponse()
    registration_info = {
        REGISTRATION_TYPE: VersionGetResponse.SAML if saml_register else VersionGetResponse.LOCAL_LDAP,
        REGISTRATION_METHOD: VersionGetResponse.IN_APP if self_register else VersionGetResponse.AUTH_CODE
    }
    try:
        version_get_response = build_version_get_response(session_token, device_encryption_info.app_id,
                                                          temp_record[DEVICE_NAME], async_client_factory,
                                                          registration_info)
    except Exception as e:
        LOGGER.exception("exception fetching environment metadata")

    env_metadata = EnvironmentMetadata(version_get_response.SerializeToString(),
                                        f'{constants.SPLAPP_APP_ID}.{constants.VERSION_GET_RESPONSE}')

    # pair device using registration v2, or v1 if failure
    if temp_record[constants.REGISTRATION_VERSION] == constants.REGISTRATION_V2:
        pair_device_v2(auth_code=auth_code,
                       user_auth_credentials=credentials,
                       device_encryption_info=device_encryption_info,
                       encryption_context=encryption_context,
                       server_name=deployment_friendly_name,
                       server_app_id=constants.SPLAPP_APP_ID,
                       server_app_version=str(app_version()),
                       config=config,
                       env_metadata=env_metadata)
    else:
        pair_device(auth_code, credentials, device_encryption_info, encryption_context,
                    server_name=deployment_friendly_name, config=config, server_app_id=constants.SPLAPP_APP_ID,
                    env_metadata=env_metadata)

    # Create a new permanent record for the device in the kvstore
    owner = user if register_with_jwt else username
    kvstore_user = KvStore(constants.REGISTERED_DEVICES_COLLECTION_NAME, system_authtoken, owner=owner)
    device_registration[DEVICE_REGISTERED_TIMESTAMP] = get_current_timestamp()
    device_registration[REGISTRATION_METHOD] = RegistrationMethod.IN_APP.value if self_register \
        else RegistrationMethod.AUTH_CODE.value
    device_registration[AUTH_METHOD] = AuthMethod.SAML.value if saml_register else AuthMethod.LOCAL_LDAP.value
    kvstore_user.insert_single_item(device_registration)

    # Add the user to the list of users with registered devices, if not already there
    kvstore_users = KvStore(constants.REGISTERED_USERS_COLLECTION_NAME, system_authtoken)
    kvstore_users.insert_or_update_item_containing_key({constants.KEY: owner})

    kvstore_nobody = KvStore(constants.DEVICE_PUBLIC_KEYS_COLLECTION_NAME, system_authtoken)
    kvstore_nobody.insert_single_item(device_public_keys)

    # Delete the temporary kvstore record
    kvstore_temp.delete_item_by_key(temp_key)

    LOGGER.info('Device registration confirmed. Device for user=\"s\", with type=\"s\", and app=\"s\" was recorded in '
            'kvstore', user, temp_record[DEVICE_TYPE], temp_record[APP_NAME])

    # Return success message
    return success_response(credentials, register_with_jwt)

def handle_local_auth(user, username, password):
    """
    Method to get current-context from username and password for local auth.
    Returns username retrieved from from current-context.
    :param username: string
    :param password: string
    :return: string
    """
    try:
        # use what Splunk thinks the username is to generate the session token
        r = authenticate_splunk_credentials(username, password)
    except SpacebridgePermissionsError as e:
        LOGGER.exception('Invalid credentials passed to login api')
        raise e

    LOGGER.info('Received new registration confirmation request by user=%s for device_owner=%s' % (user, username))
    return username

def jwt_error_response(user):
    """
    Returns error response to be used when JWT token fetch fails.
    :param user: string
    :return:
    """
    return {
        'payload': f'Registration Error: Failed to fetch jwt token for user={user}. Mismatched user and session token',
        'status': HTTPStatus.BAD_REQUEST,
    }

def success_response(credentials, register_with_jwt):
    """
    Returns success response to be used when device registration is succesful
    :param credentials:
    :param register_with_jwt: boolean
    :return:
    """
    success_message = 'Device registration successful'
    success_payload = ({'message': success_message, 'token_id': credentials.token_id}
                        if register_with_jwt else success_message)
    return {
        'payload': success_payload,
        'status': HTTPStatus.CREATED,
    }
