import requests
from spacebridge_protocol import http_pb2, sb_common_pb2
from cloudgateway.device import make_device_id
from cloudgateway.private.registration.util import sb_client_auth_endpoint, sb_auth_header, \
    sb_client_auth_result_endpoint, \
    sb_mdm_authentication_endpoint, requests_ssl_context
from cloudgateway.private.exceptions import rest as RestException
from cloudgateway.private.encryption.encryption_handler import decrypt_for_receive, encrypt_for_send, sign_detached
from cloudgateway.device import CredentialsBundle, DeviceInfo, EnvironmentMetadata
from cloudgateway import py23
from functools import partial


def build_device_authentication_request(device_info, mdm_encryption_context=None):
    """Builds a DeviceAuthenticationRequest proto which will be sent
    to Cloud Gateway

    Args:
        device_info ([DeviceInfo]): DeviceInfo object containing the device's
        encryption key information

    Returns:
        [DeviceAuthenticationRequest proto]:
    """
    device_authentication_request = http_pb2.DeviceAuthenticationRequest()
    device_authentication_request.publicKeyForSigning = device_info.sign_public_key
    device_authentication_request.publicKeyForEncryption = device_info.encrypt_public_key
    device_authentication_request.appId = device_info.app_id
    device_authentication_request.clientVersion = device_info.client_version
    device_authentication_request.appFriendlyName = device_info.app_name if device_info.app_name else ""
    device_authentication_request.appPlatform = device_info.platform if device_info.platform else ""

    if mdm_encryption_context:
        mdm_bundle = http_pb2.MdmVerificationBundle()
        mdm_bundle.publicKeyForSigning = device_info.sign_public_key
        mdm_bundle.publicKeyForEncryption = device_info.encrypt_public_key
        serialized_bundle = mdm_bundle.SerializeToString()

        device_authentication_request.serializedMdmVerificationBundle = serialized_bundle
        device_authentication_request.mdmVerificationBundleSignature = \
            sign_detached(mdm_encryption_context.sodium_client,
                          mdm_encryption_context.sign_private_key(),
                          serialized_bundle)



    return device_authentication_request


def make_device_authentication_request(device_info, encryption_context, config, key_bundle=None,
                                       mdm_encryption_context=None):
    """Makes a device authentication request to Cloud Gateway. If successful,
    Cloud Gateway will return a DeviceAuthenticationResponse object.

    Args:
        device_info ([DeviceInfo]): device info object containing client's
            public keys
        encryption_context ([EncryptionContext]):

    Raises:
        RestException.CloudgatewayServerError

    Returns:
        [Requests.Response]: response object whose content is a serialized
            DeviceAuthenticationResponse proto
    """

    with requests_ssl_context(key_bundle) as cert:
        request_proto = build_device_authentication_request(device_info, mdm_encryption_context)
        try:
            spacebridge_header = {'Authorization': sb_auth_header(encryption_context)}
            return requests.post(sb_client_auth_endpoint(config),
                                 headers=spacebridge_header,
                                 data=request_proto.SerializeToString(),
                                 cert=cert.name,
                                 proxies=config.get_proxies()
                                 )

        except Exception as e:
            raise RestException.CloudgatewayServerError('Unable to reach cloudgateway: {0}'.format(e), 503)


def parse_device_authentication_response(response):
    """Parse the response from Cloud Gateway on device authentication request

    Args:
        response ([requests.response]): response object returned by the requests library

    Raises:
        RestException.CloudgatewayServerError: [description]

    Returns:
        [String]: 10-digit auth code
    """

    if response.status_code != 200:
        raise RestException.CloudgatewayServerError('Unable to reach cloudgateway, response_code={0}'.format(
                                                    response.status_code), response.status_code)

    device_authentication_response = http_pb2.DeviceAuthenticationResponse()
    device_authentication_response.ParseFromString(response.content)

    if device_authentication_response.HasField('error'):
        raise RestException.CloudgatewayServerError(
            'cloudgateway request error: {}'.format(device_authentication_response.error.message),
            response.status_code
        )

    return device_authentication_response.payload.authenticationCode


def build_authentication_result_request(auth_code):
    """Build AuthenticationResultReqeust Proto object

    Args:
        auth_code ([string]): 10-digit auth code returned by Cloud Gateway on Device Authentication Request

    Returns:
        [AuthenticationResultRequest.proto]
    """
    authentication_result_request = http_pb2.AuthenticationResultRequest()
    authentication_result_request.authenticationCode = auth_code

    return authentication_result_request


def make_authentication_result_request(auth_code, encryption_context, config, key_bundle=None):
    """ Make AuthenticationResultRequest to Cloud Gateway

    Args:
        auth_code ([string]): 10-digit auth code returned by Cloud Gateway on Device Authentication Request
        encryption_context ([EncryptionContext]):

    Raises:
        RestException.CloudgatewayServerError:

    Returns:
        [Requests.Response]: Response object containing serialized AuthenticationResultResponse object
    """
    request_proto = build_authentication_result_request(auth_code)
    with requests_ssl_context(key_bundle) as cert:
        try:
            spacebridge_header = {'Authorization': sb_auth_header(encryption_context)}
            return requests.get(sb_client_auth_result_endpoint(auth_code, config),
                                headers=spacebridge_header,
                                data=request_proto.SerializeToString(),
                                cert=cert.name,
                                proxies=config.get_proxies()
                                )

        except Exception as e:
            raise RestException.CloudgatewayServerError('Unable to reach cloudgateway: {0}'.format(e), 503)


def parse_authentication_result_response(response):
    """Parse response from Cloud Gatewaay on a AuthenticationResultRequest

    Args:
        response (Requests.Response): response object whose content is a serialized
            AuthenticationResultResponse object

    Raises:
        RestException.CloudgatewayServerError

    Returns:
        [AuthenticationResultResponse proto]
    """
    if response.status_code != 200:
        raise RestException.CloudgatewayServerError('Unable to reach cloudgateway, response_code={0}'.format(
                                                    response.status_code), response.status_code)

    authentication_result_response = http_pb2.AuthenticationResultResponse()
    authentication_result_response.ParseFromString(response.content)

    if authentication_result_response.HasField('error'):
        raise RestException.CloudgatewayServerError(
            'cloudgateway request error: {}'.format(authentication_result_response.error.message),
            response.status_code
        )

    return authentication_result_response.payload


def parse_credentials_bundle(encrypted_credentials_bundle, encryption_context):
    """Decrypt encrypted credentials bundle into a CredentialsBundle object

    Args:
        encrypted_credentials_bundle ([http_pb2.CredentialsBundle]): CredentialsBundle protobuf
        encryption_context ([EncryptionContext]):

    Returns:
        [device.CredentialsBundle]: CredentialsBundle object wrapping the session token and username
            returned by the server side on successful registration
    """

    decrypted_bundle = decrypt_for_receive(encryption_context.sodium_client, encryption_context.encrypt_public_key(),
                                           encryption_context.encrypt_private_key(), encrypted_credentials_bundle)

    credentials_bundle = http_pb2.CredentialsBundle()
    credentials_bundle.ParseFromString(decrypted_bundle)

    env_metadata = EnvironmentMetadata(py23.b64encode_to_str(credentials_bundle.environmentMetadata.serializedMetadata),
                                       credentials_bundle.environmentMetadata.id)

    credentials_bundle_obj = CredentialsBundle(session_token=credentials_bundle.sessionToken,
                                               username=credentials_bundle.userName,
                                               deployment_name=credentials_bundle.deploymentName,
                                               server_type=credentials_bundle.serverTypeId,
                                               token_type=credentials_bundle.tokenType,
                                               token_expires_at=credentials_bundle.tokenExpiresAt,
                                               env_metadata=env_metadata)

    return credentials_bundle_obj


def build_credentials_bundle(username, password, encryption_context, app_id="com.splunk.mobile.Stargate"):
    credentials_bundle = sb_common_pb2.MdmAuthenticationRequest.CredentialsBundle()
    credentials_bundle.username = username
    credentials_bundle.password = password
    credentials_bundle.publicKeyForSigning = encryption_context.sign_public_key()
    credentials_bundle.publicKeyForEncryption = encryption_context.encrypt_public_key()
    credentials_bundle.registeringAppId = app_id

    return credentials_bundle


def build_mdm_authentication_request(username, password, encryption_context, server_info, mdm_sign_private_key):
    """

    Args:
        server_info (DeviceInfo):
    """
    auth_request = sb_common_pb2.MdmAuthenticationRequest()
    credentials_bundle = build_credentials_bundle(username, password, encryption_context)
    encrypt_func = partial(encrypt_for_send, encryption_context.sodium_client,
                           server_info.encrypt_public_key)
    client_sign_func = partial(sign_detached, encryption_context.sodium_client,
                        encryption_context.sign_private_key())
    mdm_sign_func = partial(sign_detached, encryption_context.sodium_client,
                               mdm_sign_private_key)
    encrypted_credentials_bundle = encrypt_func(credentials_bundle.SerializeToString())

    client_credentials = sb_common_pb2.MdmAuthenticationRequest.ClientCredentials()
    client_credentials.encryptedCredentialsBundle = encrypted_credentials_bundle
    client_credentials.registrarClientId = encryption_context.generichash_hex(server_info.sign_public_key)
    client_credentials.registrationVersion = sb_common_pb2.REGISTRATION_VERSION_1

    auth_request.clientCredentials = client_credentials.SerializeToString()
    auth_request.clientSignature = client_sign_func(client_credentials.SerializeToString())
    auth_request.mdmSignature = mdm_sign_func(client_credentials.SerializeToString())

    return auth_request


def make_mdm_authentication_request(username, password, server_info, encryption_context, mdm_sign_private_key,
                                    config, pkcs12):
    """ Make AuthenticationResultRequest to Cloud Gateway

    Args:
        auth_code ([string]): 10-digit auth code returned by Cloud Gateway on Device Authentication Request
        encryption_context ([EncryptionContext]):

    Raises:
        RestException.CloudgatewayServerError:

    Returns:
        [Requests.Response]: Response object containing serialized AuthenticationResultResponse object
    """
    request_proto = build_mdm_authentication_request(username, password, encryption_context, server_info,
                                                     mdm_sign_private_key)

    with requests_ssl_context(pkcs12) as cert:
        try:
            return requests.post(
                url='{0}/api/mdm/authenticate'.format(config.get_spacebridge_domain()),
                headers={'Content-Type': 'application/x-protobuf', 'Authorization': sb_auth_header(encryption_context)},
                data=request_proto.SerializeToString(),
                proxies=config.get_proxies(),
                cert=cert
            )
        except Exception as e:
            raise RestException.CloudgatewayServerError('Unable to reach cloudgateway: {0}'.format(e), 503)

