"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to for common request processor methods
"""

import json
import base64
import time
import sys

from spacebridgeapp.util import py23
from spacebridgeapp.rest.devices.user_devices import public_keys_for_device
from cloudgateway.private.encryption.encryption_handler import sign_verify, decrypt_for_receive
from cloudgateway.private.encryption.encryption_handler import decrypt_session_token
from cloudgateway.private.encryption.encryption_handler import encrypt_session_token
from http import HTTPStatus
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeExpiredTokenError, SpacebridgeApiRequestError, \
    JWTExpiredTokenError
from spacebridgeapp.exceptions.run_as_exceptions import RunAsTokenExpiredError, RunAsTokenInvalidSignature
from splapp_protocol import common_pb2
from splapp_protocol import request_pb2
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_request_processor.log", "request_processor")

# Module Level Constants
SESSION_KEY = "sessionKey"
CONFIRMATION_CODE = "conf_code"
TEMPORARY_KEY = "temp_key"
MESSAGE_VALUES = {
    HTTPStatus.CONFLICT: 'ERROR_ALREADY_REGISTERED',
    422: 'ERROR_APP_NOT_ENABLED',
    HTTPStatus.CREATED: 'SUCCESS'
}


class BasicAuthHeader(object):
    def __init__(self, username, password):
        self.username = username
        self.password = password

    def __repr__(self):
        user_pass = "%s:%s" % (self.username, self.password)

        return 'Basic {}'.format(py23.b64encode_to_str(user_pass.encode()))

    # to make it harder to accidentally log the current users password
    def __str__(self):
        return 'Basic {}:???'.format(self.username)

    async def validate(self, async_splunk_client, logger, request_context):
        """
        Validate the username, password against splunk's login api
        """
        response = await async_splunk_client.async_get_splunk_cookie(self.username, self.password)
        if response.code == HTTPStatus.OK:
            return True

        message = await response.text()
        logger.info("valid_session_token=false with message={}, status_code={}".format(message, response.code))
        raise SpacebridgeExpiredTokenError("Failed to authenticate session token with error={}, status_code={}"
                                           .format(message, response.code))


class JWTAuthHeader(object):
    def __init__(self, username, token):
        self.username = username
        self.token = token

    def __repr__(self):
        return 'Bearer %s' % self.token

    # to make it harder to log the current users token
    def __str__(self):
        return 'Bearer ???'

    async def validate(self, async_splunk_client, logger, request_context):
        """
        Validate the token against splunk's login api
        """

        response = await async_splunk_client.async_get_current_context(self)
        if response.code == HTTPStatus.OK:
            return True

        message = await response.text()
        logger.info("valid_session_token=false with message={}, status_code={}"
                    .format(message, response.code))
        raise JWTExpiredTokenError("Failed to authenticate session token with error={}, status_code={}"
                                   .format(message, response.code))


class SpacebridgeAuthHeader(object):
    def __init__(self, device_id):
        self.device_id = device_id

    def __repr__(self):
        return py23.encode_hex_str(self.device_id)


def secure_session_token(encryption_context, username, password):
    """
    :param encryption_context: An encryption context with encryption public and private keys
    :param username: the current user's username
    :param password: the current user's password
    :return:
    """
    public_key = encryption_context.encrypt_public_key()
    private_key = encryption_context.encrypt_private_key()

    session_token_raw = json.dumps({
        'username': username,
        'password': password,
    }).encode('utf-8')

    ciphertext = encrypt_session_token(encryption_context.sodium_client, session_token_raw, public_key, private_key)
    return py23.b64encode_to_str(ciphertext)


def parse_session_token(encryption_context, encrypted_session_token):
    """
    :param encrypted_session_token: [string] encrypted username and password json of user
    :return: A value suitable to be used as an Authorization header value
    """
    public_key = encryption_context.encrypt_public_key()
    private_key = encryption_context.encrypt_private_key()

    try:
        raw_token = base64.b64decode(encrypted_session_token)
        decrypted_token = decrypt_session_token(encryption_context.sodium_client, raw_token, public_key, private_key)
        session_jsn = json.loads(decrypted_token)

        if session_jsn.get('type') == constants.JWT_TOKEN_TYPE:
            username, token = session_jsn['username'], session_jsn['token']
            return JWTAuthHeader(username, token)

        username, password = session_jsn['username'], session_jsn['password']
        return BasicAuthHeader(username, password)
    except Exception:
        LOGGER.exception("Exception encountered while parsing session token")

    return BasicAuthHeader('unknown_user', 'unknown_password')


async def get_splunk_cookie(request_context, async_splunk_client, username, password):
    """
    Fetches splunk session cookie
    """

    response = await async_splunk_client.async_get_splunk_cookie(username, password)
    if response.code == HTTPStatus.OK:
        jsn = await response.json()
        return jsn[SESSION_KEY]
    else:
        message = await response.text()
        raise SpacebridgeApiRequestError(
            "Call to get splunk session cookie failed with response.code={}, message={}".format(response.code, message),
            status_code=response.code)


async def parse_run_as_credentials(encryption_context, system_auth_header, async_client_factory, run_as_credentials):
    """
    :param encryption_context: An encryption context with encryption public and private keys
    :param system_auth_header:
    :param async_client_factory:
    :param run_as_credentials: run as credentials containing encrypted session token with expiry
    :return: A value suitable to be used as an Authorization header value
    """

    public_key = encryption_context.encrypt_public_key()
    private_key = encryption_context.encrypt_private_key()

    # deserialize to TrustToken proto
    trust_token = common_pb2.TrustToken()
    trust_token.ParseFromString(run_as_credentials.trustToken)

    # decrypt TrustToken.encryptedSessionToken
    encrypted_session_token_with_expiry_bytes = trust_token.encryptedSessionToken
    session_token_with_expiry_bytes = decrypt_for_receive(encryption_context.sodium_client,
                                                          public_key, private_key,
                                                          encrypted_session_token_with_expiry_bytes)

    # deserialize to SessionTokenWithExpiry proto
    session_token_with_expiry = common_pb2.SessionTokenWithExpiry()
    session_token_with_expiry.ParseFromString(session_token_with_expiry_bytes)

    # verify run as token not expired and signature is valid
    verify_run_as_token_not_expired(session_token_with_expiry)

    # verify run as token's signature is valid
    signature_verified = await verify_run_as_token_signature(encryption_context,
                                                             async_client_factory,
                                                             system_auth_header,
                                                             trust_token.deviceId,
                                                             encrypted_session_token_with_expiry_bytes,
                                                             run_as_credentials.signature)
    if not signature_verified:
        log_message = "RunAs Token signature is invalid for device_id={}".format(trust_token.deviceId)
        LOGGER.error(log_message)
        raise RunAsTokenInvalidSignature(log_message)

    # now parse the regular session token
    return parse_session_token(encryption_context, session_token_with_expiry.sessionToken)


def verify_run_as_token_not_expired(session_token_with_expiry):
    expires_at = session_token_with_expiry.expiresAt
    if time.time() > expires_at:
        log_message = "Recieved Expired RunAs Token: expires_at={}".format(expires_at)
        LOGGER.warn(log_message)
        raise RunAsTokenExpiredError(log_message)


async def verify_run_as_token_signature(encryption_context,
                                        async_client_factory,
                                        system_auth_header,
                                        device_id,
                                        encrypted_session_token_with_expiry_bytes,
                                        signature):
    keys = await public_keys_for_device(device_id, system_auth_header, async_client_factory.kvstore_client())
    sender_sign_public_key, _ = keys
    signature_verified = sign_verify(encryption_context.sodium_client, sender_sign_public_key,
                                     encrypted_session_token_with_expiry_bytes, signature)

    return signature_verified


def process_device_credentials_validate_request(request_context,
                                                client_single_request,
                                                server_single_response,
                                                async_client_factory):
    """
    Since it came this far, credentials are valid. Process this request by setting the deviceCredentialsValidateResponse to True.
    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_client_factory:
    :return:
    """
    LOGGER.debug("Processing process_device_credentials_validate_request")

    server_single_response.deviceCredentialsValidateResponse.SetInParent()
    server_single_response.deviceCredentialsValidateResponse.areDeviceCredentialsValid = True


def set_registration_response(server_single_response, response_code):
    """
    Function to set registration response value in proto
    @param server_single_response: server_single_response protobuf message
    @param response_code: http response code
    """
    error_value = MESSAGE_VALUES.get(response_code)
    server_single_response.completeDeviceRegistrationResponse.code = \
        request_pb2.CompleteDeviceRegistrationResponse.Code.Value(error_value)


async def process_complete_device_registration_request(request_context,
                                                       client_single_request,
                                                       server_single_response,
                                                       async_client_factory):
    """
    Validates and sends request to complete device registration

    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_client_factory:
    :return:
    """
    server_single_response.completeDeviceRegistrationResponse.SetInParent()

    auth_code = client_single_request.completeDeviceRegistrationRequest.authenticationCode
    confirmation_code = client_single_request.completeDeviceRegistrationRequest.confirmationCode
    device_name = client_single_request.completeDeviceRegistrationRequest.deviceName
    async_splunk_client = async_client_factory.splunk_client()
    registration_query_response = await async_splunk_client.async_get_registration_query(request_context.auth_header,
                                                                                         auth_code,
                                                                                         device_name)
    if registration_query_response.code != HTTPStatus.OK:
        if registration_query_response.code in MESSAGE_VALUES:
            set_registration_response(server_single_response, registration_query_response.code)
        elif registration_query_response.code == HTTPStatus.NOT_FOUND:
            response_text = await registration_query_response.text()
            if response_text.find("Expired authentication code"):
                server_single_response.completeDeviceRegistrationResponse.code = \
                    request_pb2.CompleteDeviceRegistrationResponse.Code.Value('ERROR_AUTH_CODE_INVALID')
            else:
                server_single_response.completeDeviceRegistrationResponse.code = \
                    request_pb2.CompleteDeviceRegistrationResponse.Code.Value('ERROR_VALIDATION_FAILED')
                LOGGER.info("Response code: %s" % registration_query_response.code)
        else:
            server_single_response.completeDeviceRegistrationResponse.code = \
                request_pb2.CompleteDeviceRegistrationResponse.Code.Value('ERROR_VALIDATION_FAILED')
        LOGGER.info("Registration query failed. Response code: %s" % registration_query_response.code)
    else:
        response_json = await registration_query_response.json()
        if response_json:
            response_confirmation_code = response_json[CONFIRMATION_CODE]
            temporary_key = response_json[TEMPORARY_KEY]

            # Check that the confirmation code from the TV matches the one in the backend and if so, confirmation call
            if response_confirmation_code != confirmation_code:
                server_single_response.completeDeviceRegistrationResponse.code = \
                    request_pb2.CompleteDeviceRegistrationResponse.Code.Value('ERROR_CONFIRMATION_INVALID')
                LOGGER.info("Confirmation code mismatch. Received %s Expected %s" %
                            (confirmation_code, response_confirmation_code))
            else:
                registration_confirmation_response = \
                    await async_splunk_client.async_post_registration_confirmation(request_context.auth_header,
                                                                                   auth_code,
                                                                                   temporary_key,
                                                                                   device_name)
                if registration_confirmation_response.code in MESSAGE_VALUES:
                    set_registration_response(server_single_response, registration_confirmation_response.code)
                else:
                    server_single_response.completeDeviceRegistrationResponse.code = \
                        request_pb2.CompleteDeviceRegistrationResponse.Code.Value('ERROR_VALIDATION_FAILED')
                    LOGGER.info("Response code: %s" % registration_confirmation_response.code)
        else:
            server_single_response.completeDeviceRegistrationResponse.code = \
                request_pb2.CompleteDeviceRegistrationResponse.Code.Value('ERROR_VALIDATION_FAILED')
            LOGGER.info("Registration query was missing body. Response code: %s" % registration_query_response.code)


async def async_is_valid_session_token(user, session_token, async_splunk_client):
    """
    Method to validate that the user provided session token matches the user
    :param user: string
    :param session_token: string
    :param async_splunk_client: AsyncSplunkClient
    :return: boolean
    """
    response = await async_splunk_client.async_get_current_context(SplunkAuthHeader(session_token))
    response_json = await response.json()
    context_user = response_json[constants.ENTRY][0][constants.CONTENT][constants.USERNAME]
    if user == context_user:
        return True
    else:
        return False
