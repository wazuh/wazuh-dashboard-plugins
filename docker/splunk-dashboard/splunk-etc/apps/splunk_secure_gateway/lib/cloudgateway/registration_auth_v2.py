import sys
import requests
from urllib3.util.retry import Retry
from urllib3.exceptions import MaxRetryError
from requests.adapters import HTTPAdapter
from requests.exceptions import RetryError

from cloudgateway.private.exceptions.registration_exceptions import RegistrationError
from cloudgateway.private.registration.authenticate import is_mdm_signature_valid, verify_mdm_signature
from cloudgateway.private.registration.registration_utils import (
    derive_auth_params,
    enable_routing,
    send_public_keys
)
from cloudgateway.auth import SimpleUserCredentials
from cloudgateway.encryption_context import EncryptionContext
from cloudgateway.device import DeviceInfo
from cloudgateway.private.sodium_client.pysodium import (
    crypto_sign_verify_detached,
    crypto_secretbox_open,
    crypto_box_seal,
    crypto_sign_detached
)
from cloudgateway.private.util.config import SplunkConfig
from cloudgateway.private.util.constants import (
    HEADER_AUTHORIZATION,
    HEADER_SPACEBRIDGE_AUTH_ID,
    REGISTRATION_V2_PATH,
    MDM,
    NOT_MDM
)
from spacebridge_protocol.http_pb2 import EnvironmentMetadata
from http import HTTPStatus
from spacebridge_protocol.registration_v2_pb2 import (
    CLIENT_ID_V1,
    ClientRegistration,
    ClientRegistrationRequest,
    KeyBundle,
    RegistrarQueryResponse,
    RegistrarResult,
    RegistrarResultRequest
)


def authenticate_code_v2(auth_code: str,
                         encryption_context: EncryptionContext,
                         resolve_app_name,
                         config: SplunkConfig = SplunkConfig(),
                         mdm_signing_public_key: bytes = None,
                         enforce_mdm: bool = False) -> DeviceInfo:
    """
    Part 1/2 of the registration process
    Submit an auth code to spacebridge, and retrieve the encryption credentials for the device associated to
    that auth code

    :param auth_code: auth code shown on mobile device
    :param encryption_context: EncryptionContext object. Can be a regular EncryptionContext or a subclass such
    as SplunkEncryptionContext depending on whether you want to run in standalone mode or not.
    :param resolve_app_name: A function that, given an app id, will return a human friendly app name
    :param config: CloudgatewaySdkConfig object
    :return: DeviceInfo object
    """

    # Get both keys from Encryption_context
    sb_key_bundle = KeyBundle(
        clientIdVersion=CLIENT_ID_V1,
        publicKeyForEncryption=encryption_context.encrypt_public_key(),
        publicKeyForSigning=encryption_context.sign_public_key()
    )

    # Send keys to spacebridge
    send_public_keys(encryption_context, config, sb_key_bundle)

    _, auth_id, shared_encryption_key = derive_auth_params(encryption_context, auth_code)

    payload, client_registration = fetch_and_validate_auth_code(auth_id,
                                                                shared_encryption_key,
                                                                encryption_context,
                                                                config,
                                                                num_retries=7)

    # Parse device info
    device_sign_key = client_registration.keyBundle.publicKeyForSigning
    device_encrypt_key = client_registration.keyBundle.publicKeyForEncryption
    device_id = encryption_context.generichash_raw(device_sign_key)
    confirmation_code = encryption_context.generichash_hex(device_sign_key).upper()[:8]
    app_id = client_registration.clientInfo.appId
    app_friendly_name = client_registration.clientInfo.appFriendlyName
    app_name = app_friendly_name if app_friendly_name else resolve_app_name(app_id)
    platform = client_registration.clientInfo.operatingSystemName

    if enforce_mdm:
        # attempt to verify, throw exception on failure
        verify_mdm_signature(payload, mdm_signing_public_key, encryption_context)
        device_management_method = MDM
    else:
        # attempt to verify, save whether or not verification was successful
        mdm_valid = is_mdm_signature_valid(payload, mdm_signing_public_key, encryption_context)
        device_management_method = MDM if mdm_valid else NOT_MDM

    device_encryption_info = DeviceInfo(encrypt_public_key=device_encrypt_key,
                                        sign_public_key=device_sign_key,
                                        device_id=device_id,
                                        confirmation_code=confirmation_code,
                                        app_id=app_id,
                                        app_name=app_name,
                                        platform=platform,
                                        device_management_method=device_management_method)

    return device_encryption_info


def pair_device_v2(auth_code: str,
                   user_auth_credentials: SimpleUserCredentials,
                   device_encryption_info: DeviceInfo,
                   encryption_context: EncryptionContext,
                   server_name: str = "",
                   server_app_id: str = "",
                   server_app_version: str = "",
                   config: SplunkConfig = SplunkConfig(),
                   env_metadata: EnvironmentMetadata = None):
    """
     Part 2/2 of the registration process.
     Send splunk app's public key and registration information to the registrar to confirm the client registration and
     upload registrar pairing data

     :param auth_code:  auth code of the device
     :param user_auth_credentials: UserAuthCredentials object interface which captures different forms of session tokens
     :param device_encryption_info: DeviceInfo object which was returned in the authenticate_code api call
     :param encryption_context: EncryptionContext object. Can be a regular EncryptionContext or a subclass such
     as SplunkEncryptionContext depending on whether you want to run in standalone mode or not.
     :param server_name: optional parameter for name of server so that device can identify which instance it is paired
     with
     :param server_app_id: optional parameter for id of the server application, used by the device for identification
     :param server_app_version: optional parameter that allows the device to confirm app version
     :param config: CloudgatewaySdkConfig object
     :param key_bundle: optional parameter for Client KeyBundle proto object containing clientIdVersion and both public keys
     :param env_metadata: optional EnvironmentMetadata proto object
     :return:
     """

    # Validate Auth Credentials
    user_auth_credentials.validate()

    # Enable routing server side
    enable_routing(encryption_context, device_encryption_info.device_id, config)

    # Build Client KeyBundle
    key_bundle = KeyBundle(
        clientIdVersion=CLIENT_ID_V1,
        publicKeyForEncryption=encryption_context.encrypt_public_key(),
        publicKeyForSigning=encryption_context.sign_public_key()
    )

    # Parse session metadata
    session_token = user_auth_credentials.get_credentials() \
        if sys.version_info < (3, 0) else str.encode(user_auth_credentials.get_credentials())

    token_expires_at = user_auth_credentials.get_expiration()
    token_type = user_auth_credentials.get_token_type()
    encrypted_session_token = encryption_context.secure_session_token(session_token)

    # Generate auth_id from auth_code
    _, auth_id, _ = derive_auth_params(encryption_context, auth_code)

    # Build encrypted payload and sign the message
    registrar_result = build_registrar_result(user_auth_credentials.get_username(),
                                              encrypted_session_token,
                                              server_app_id,
                                              server_app_version,
                                              server_name=server_name,
                                              key_bundle=key_bundle,
                                              token_type=token_type,
                                              token_expires_at=token_expires_at,
                                              env_metadata=env_metadata)

    # Confirm client registration and upload registrar pairing data
    query_registration_confirmation(auth_id,
                                    encryption_context,
                                    device_encryption_info.encrypt_public_key,
                                    registrar_result,
                                    config)


def query_registration_confirmation(auth_id: bytes,
                                    encryption_context: EncryptionContext,
                                    device_public_key: bytes,
                                    registrar_result: RegistrarResult,
                                    config: SplunkConfig):
    encrypted_registrar_result = crypto_box_seal(registrar_result.SerializeToString(),
                                                 device_public_key)
    signature = crypto_sign_detached(encrypted_registrar_result,
                                     encryption_context.sign_private_key())
    request = RegistrarResultRequest(
        encryptedRegistrarResult=encrypted_registrar_result,
        signature=signature
    )

    response = requests.post(
        url=f'https://{config.get_spacebridge_server()}/{REGISTRATION_V2_PATH}/registrar_confirm',
        headers={
            HEADER_AUTHORIZATION: encryption_context.sign_public_key(transform=encryption_context.generichash_hex),
            HEADER_SPACEBRIDGE_AUTH_ID: auth_id.hex()
        },
        data=request.SerializeToString(),
        proxies=config.get_proxies()
    )
    if response.status_code != HTTPStatus.OK:
        raise RegistrationError(prefix='HTTP error during RegistrationConfirmation',
                                code=response.status_code,
                                message=response.text)


def fetch_and_validate_auth_code(auth_id, shared_encryption_key, encryption_context, config, num_retries=0):
    client_id = encryption_context.sign_public_key(transform=encryption_context.generichash_hex)

    # Query the client registration
    query_response = query_client_registration(config, auth_id, client_id, num_retries)

    # Unpack client registration payload
    client_registration_request = query_response.clientRegistration

    # Unpack client registration payload
    client_registration_request = query_response.clientRegistration
    serialized_payload = client_registration_request.serializedPayload

    payload = ClientRegistrationRequest.Payload()
    payload.ParseFromString(serialized_payload)

    # Decrypt client registration payload
    client_registration = decrypt_client_registration_payload(payload, shared_encryption_key)
    device_sign_key = client_registration.keyBundle.publicKeyForSigning

    # Validate registration query response signature
    validate_registrar_query_response(query_response, device_sign_key)

    # Return payload and decrypted client_registration
    return payload, client_registration


def build_registrar_result(username,
                           encrypted_session_token,
                           server_app_id,
                           server_app_version,
                           server_name="",
                           key_bundle=None,
                           token_type=RegistrarResult.Credentials.TokenType.Value('SESSION'),
                           token_expires_at=0,
                           env_metadata=None):
    registrar_result = RegistrarResult()

    # Build Credentials
    registrar_result.confirmation.credentials.sessionToken = encrypted_session_token
    registrar_result.confirmation.credentials.userName = username
    registrar_result.confirmation.credentials.tokenType = token_type
    registrar_result.confirmation.credentials.tokenExpiresAt = token_expires_at

    # Build RegistrarInfo
    if server_app_id:
        registrar_result.confirmation.registrarInfo.typeId = server_app_id
    if server_app_version:
        registrar_result.confirmation.registrarInfo.version = server_app_version
    if server_name:
        registrar_result.confirmation.registrarInfo.name = server_name

    if env_metadata and env_metadata.serialized_metadata:
        registrar_result.confirmation.registrarInfo.environmentMetadata.serializedMetadata = env_metadata.serialized_metadata
    if env_metadata and env_metadata.id:
        registrar_result.confirmation.registrarInfo.environmentMetadata.id = env_metadata.id

    # Populate KeyBundle

    if key_bundle and key_bundle.clientIdVersion:
        registrar_result.confirmation.keyBundle.clientIdVersion = key_bundle.clientIdVersion
    if key_bundle and key_bundle.publicKeyForSigning:
        registrar_result.confirmation.keyBundle.publicKeyForSigning = key_bundle.publicKeyForSigning
    if key_bundle and key_bundle.publicKeyForEncryption:
        registrar_result.confirmation.keyBundle.publicKeyForEncryption = key_bundle.publicKeyForEncryption

    return registrar_result


def decrypt_client_registration_payload(payload: ClientRegistrationRequest.Payload,
                                        shared_encryption_key: bytes) -> ClientRegistration:
    client_nonce = payload.nonce
    client_registration = crypto_secretbox_open(payload.encryptedClientRegistration,
                                                client_nonce,
                                                shared_encryption_key)

    client_registration_pb = ClientRegistration()
    client_registration_pb.ParseFromString(client_registration)

    return client_registration_pb


def validate_registrar_query_response(response: RegistrarQueryResponse,
                                      device_signing_key: bytes):
    serialized_payload = response.clientRegistration.serializedPayload
    signature = response.clientRegistration.signature

    # Ensure signature match
    crypto_sign_verify_detached(signature, serialized_payload, device_signing_key)


def query_client_registration(config: SplunkConfig,
                              auth_id: bytes,
                              client_id: str,
                              num_retries: int = 0) -> RegistrarQueryResponse:
    # Retry wait time is computed as {backoff factor} * (2 ** ({number of total retries} - 1))
    # Hence backoff_factor of 0.1 will sleep for [0.0s, 0.2s, 0.4s, …] between retries
    # Total retry time with the values set below and num_retries = 7, is 12.6s
    s = requests.Session()
    s.proxies.update(config.get_proxies())
    retries = Retry(total=num_retries,
                    backoff_factor=0.1,
                    status_forcelist=[404, 500, 502, 503, 504])
    s.mount('https://', HTTPAdapter(max_retries=retries))

    try:
        response = s.get(
            f'https://{config.get_spacebridge_server()}/{REGISTRATION_V2_PATH}/registrar_query',
            headers={
                HEADER_AUTHORIZATION: client_id,
                HEADER_SPACEBRIDGE_AUTH_ID: auth_id.hex()
            })
    except RetryError as retry_error:
        raise RegistrationError(prefix='Retry logic failure for RegistrarQueryRequest',
                                code=HTTPStatus.REQUEST_TIMEOUT,
                                message=retry_error.response)
    except MaxRetryError as max_retry_error:
        raise RegistrationError(prefix='Max number of retries exceeded for RegistrarQueryRequest',
                                code=HTTPStatus.REQUEST_TIMEOUT,
                                message=max_retry_error.reason)

    if response.status_code != HTTPStatus.OK:
        raise RegistrationError(prefix='HTTP error during RegistrarQueryRequest',
                                code=response.status_code,
                                message=response.text)
    response_pb = RegistrarQueryResponse()
    response_pb.ParseFromString(response.content)
    if response_pb.HasField('error'):
        raise RegistrationError(prefix='Application error during RegistrarQueryRequest',
                                code=response_pb.error.code,
                                message=response_pb.error.message)

    return response_pb
