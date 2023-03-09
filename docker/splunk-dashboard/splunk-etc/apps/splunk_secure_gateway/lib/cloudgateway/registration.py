"""
(C) 2019 Splunk Inc. All rights reserved.

APIs for device registration to Spacebridge
"""
import collections
import sys

from cloudgateway import py23
from cloudgateway.key_bundle import KeyBundle

from cloudgateway.private.registration.authenticate import submit_auth_code, parse_spacebridge_response, \
    is_mdm_signature_valid, verify_mdm_signature
from cloudgateway.private.registration.pairing import build_encypted_credentials_bundle, pair_device_with_sb

from cloudgateway.private.registration import unregister
from cloudgateway.private.registration.client import make_device_authentication_request, \
    parse_device_authentication_response, make_authentication_result_request, parse_authentication_result_response, \
    parse_credentials_bundle
from cloudgateway.private.encryption.encryption_handler import encrypt_for_send
from cloudgateway.device import DeviceInfo, CredentialsBundle
from cloudgateway.private.registration.util import sb_auth_header
from cloudgateway.private.util.constants import (
    MDM,
    NOT_MDM
)
from cloudgateway.private.exceptions.rest import CloudgatewayServerError, CloudgatewayMaxRetriesError
from cloudgateway.private.util.config import SplunkConfig
from functools import partial

from cloudgateway.private.util.tokens_util import calculate_token_info
from spacebridge_protocol import http_pb2


def authenticate_code(auth_code, encryption_context, resolve_app_name, config=SplunkConfig(), key_bundle=None,
                      mdm_signing_public_key=None, enforce_mdm=False):
    """
    Part 1/2 of the registration process
    Submit an auth code to space bridge, and retrieve the encryption credentials for the device associated to
    that auth code

    :param auth_code: auth code shown on mobile device
    :param encryption_context: EncryptionContext object. Can be a regular EncryptionContext or a subclass such
    as SplunkEncryptionContext depending on whether you want to run in standalone mode or not.
    :param resolve_app_name: A function that, given an app id, will return a human friendly app name
    :param config: CloudgatewaySdkConfig object
    :return: DeviceInfo object
    """

    raw_response = submit_auth_code(auth_code, encryption_context, config, key_bundle)
    sb_response_proto = parse_spacebridge_response(raw_response)

    encrypt_public_key = sb_response_proto.payload.publicKeyForEncryption
    sign_public_key = sb_response_proto.payload.publicKeyForSigning

    app_friendly_name = sb_response_proto.payload.appFriendlyName
    app_name = app_friendly_name if app_friendly_name else resolve_app_name(sb_response_proto.payload.appId)
    platform = sb_response_proto.payload.appPlatform

    if enforce_mdm:
        # attempt to verify, throw exception on failure
        verify_mdm_signature(sb_response_proto.payload, mdm_signing_public_key, encryption_context)
        device_management_method = MDM
    else:
        # attempt to verify, save whether or not verification was succesful
        mdm_valid = is_mdm_signature_valid(sb_response_proto.payload, mdm_signing_public_key, encryption_context)
        device_management_method = MDM if mdm_valid else NOT_MDM
    
    device_encryption_info = DeviceInfo(encrypt_public_key,
                                        sign_public_key,
                                        sb_response_proto.payload.deviceId,
                                        encryption_context.generichash_hex(sign_public_key).upper()[:8],
                                        sb_response_proto.payload.appId,
                                        app_name=app_name,
                                        platform=platform,
                                        device_management_method=device_management_method)

    return device_encryption_info



def pair_device(auth_code, user_auth_credentials, device_encryption_info, encryption_context, server_name="",
                server_app_id = "",
                config=SplunkConfig(),
                key_bundle=None,
                env_metadata=None):
    """
    Part 2/2 of the registration process.
    Send splunk app's public key information and encrypted credentials for user to cloudgateway. Upon success, this
    will complete the credential swap as now the client has the splunk app's credentials and the splunk app has received
    the app's public key

    :param auth_code:  auth code of the device
    :param user_auth_credentials: UserAuthCredentials object interface which captures different forms of session tokens
    :param device_encryption_info: DeviceInfo object which was returned in the authenticate_code api call
    :param encryption_context: EncryptionContext object. Can be a regular EncryptionContext or a subclass such
    as SplunkEncryptionContext depending on whether you want to run in standalone mode or not.
    :param server_name: optional parameter for name of server so that device can identify which instance it is paired
    with
    :param config: CloudgatewaySdkConfig object
    :return:
    """
    user_auth_credentials.validate()
    sodium_client = encryption_context.sodium_client

    encrypt_public_key = encryption_context.encrypt_public_key()
    sign_public_key = encryption_context.sign_public_key()
    encryption_func = partial(encrypt_for_send, sodium_client, device_encryption_info.encrypt_public_key)
    auth_header = sb_auth_header(encryption_context)

    session_token = user_auth_credentials.get_credentials() if sys.version_info < (3, 0) else str.encode(user_auth_credentials.get_credentials())
    token_expires_at = user_auth_credentials.get_expiration()
    token_type = user_auth_credentials.get_token_type()

    encrypted_session_token = encryption_context.secure_session_token(session_token)
    encrypted_credentials_bundle = build_encypted_credentials_bundle(user_auth_credentials.get_username(),
                                                                     encrypted_session_token, encryption_func,
                                                                     server_app_id,
                                                                     deployment_name=server_name, token_type=token_type,
                                                                     token_expires_at=token_expires_at,
                                                                     env_metadata=env_metadata)
    pair_device_with_sb(auth_code, auth_header, device_encryption_info.device_id, encrypt_public_key, sign_public_key,
                        encrypted_credentials_bundle, config, key_bundle)


def unregister_device(device_id, encryption_context, config=SplunkConfig(), key_bundle=None):
    """
    Unregister ascljk a device from cloud gateway. Initiating this will cause cloud gateway to remove the routing entry
    and also force the client device to unregister

    :param device_id:  device id from DeviceInfo object
    :param encryption_context: EncryptionContext object. Can be a regular EncryptionContext or a subclass such
    as SplunkEncryptionContext depending on whether you want to run in standalone mode or not.
    :return: DeviceUnregistrationResponse proto or throws an exception if the request can't be completed
    :param config: CloudgatewaySdkConfig object
    """

    unregister_proto = unregister.build_device_unregister_req(device_id, encryption_context)
    raw_response = unregister.make_unregister_req(unregister_proto, sb_auth_header(encryption_context), config,
                                                  key_bundle)
    unregister.parse_sb_response(raw_response)

    return raw_response


def request_code(device_info, encryption_context, config=SplunkConfig(), key_bundle=None,
                 mdm_encryption_context=None):
    """Submits device's public key information to Cloud Gateway and fetches 10 digit
    pairing code. First part of the registration process for the client.
    Args:
        device_info ([DeviceInfo]): device information of the client side
        encryption_context ([EncryptionContext]):

    Returns:
        [String]: 10-digit auth code
    """

    r = make_device_authentication_request(device_info, encryption_context, config, key_bundle, mdm_encryption_context)

    return parse_device_authentication_response(r)


def fetch_server_credentials(auth_code, encryption_context, num_retries=10, config=SplunkConfig(), key_bundle=None):
    """Fetch server's encryption keys as well as session token. This is the last part of the registration process
    for the client side and needs to happen after the server side has finished the registration process on the
    server side. If the server side has not completed registration yet, Cloudgateway will wait up to 30s and
    return a 204. This api will continue to retry when it receives a 204 until it we exceed num_retries at which
    point it will return a max retries exceeded exception.

    Args:
        auth_code ([string]): 10-digit auth code
        encryption_context ([EncryptionContext]):
        num_retries ([int]): Number of times to retry. Only retries if Cloud gateway has not received registration
        from the server side.

    Returns:
        [(DeviceInfo, CredentialsBundle)]: Tuple where first element is a DeviceInfo object containing encryption
        information of the server side. The second element is a CredentialsBundle object which contains a session token
        and username which is used for authenticating with the server side and running splunk queries.
    """
    for i in range(num_retries):
        r = make_authentication_result_request(auth_code, encryption_context, config, key_bundle)
        try:
            payload = parse_authentication_result_response(r)
            break
        except CloudgatewayServerError as e:
            if e.status != 204:
                raise e

            if e.status == 204 and i == num_retries - 1:
                raise CloudgatewayMaxRetriesError("Server side device has not completed registration. Please try again",
                                                  204)

    signing_public_key = payload.deploymentPublicKeyForSigning
    encrypt_public_key = payload.deploymentPublicKeyForEncryption
    encrypted_credentials_bundle = payload.encryptedCredentialsBundle
    server_id = encryption_context.generichash_raw(signing_public_key)

    server_info = DeviceInfo(encrypt_public_key, signing_public_key, device_id=server_id)
    credentials_bundle = parse_credentials_bundle(encrypted_credentials_bundle, encryption_context)

    return server_info, credentials_bundle

