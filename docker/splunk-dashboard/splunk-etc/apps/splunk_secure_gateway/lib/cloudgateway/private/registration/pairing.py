"""
(C) 2019 Splunk Inc. All rights reserved.
"""
import base64
import sys

import requests

from cloudgateway.private.registration.util import requests_ssl_context
from spacebridge_protocol import http_pb2
from cloudgateway.private.exceptions.rest import CloudgatewayServerError


def pair_device_with_sb(auth_code, auth_header, device_id, encrypt_pubic_key, sign_public_key,
                        encrypted_credentials_bundle, config, key_bundle=None):

    sb_request_proto = build_device_pairing_req(auth_code,
                                                device_id,
                                                encrypt_pubic_key,
                                                sign_public_key,
                                                encrypted_credentials_bundle)

    # Generates a protobuf object from the supplied dictionary, proto_object
    # Makes the registration confirmation PUT request to the cloudgateway endpoint
    try:
        response = make_device_pairing_req(auth_code, auth_header, sb_request_proto, config, key_bundle)
    except Exception as e:
        raise CloudgatewayServerError('Unable to reach Spacebridge', 503)

    # Parses the protobuf response, checking for error objects
    return parse_sb_response(response)


def make_device_pairing_req(auth_code, auth_header, sb_request_proto, config, key_bundle=None):
    """
    Takes an auth code, cloudgateway auth header as well as a device pairing confirmation request proto
    and posts the request to cloudgateway. This is the final step of the registration process
    :param auth_code: 10 digit auth code presented to the client device at the start of registration
    :param auth_header: authentication header to talk to cloudgateway
    :param sb_request_proto:
    :return: void
    """

    with requests_ssl_context(key_bundle) as cert:
        try:
            return requests.put(
                url='{0}/api/registrations/{1}'.format(config.get_spacebridge_domain(), auth_code),
                headers={'Content-Type': 'application/x-protobuf', 'Authorization': str(auth_header)},
                data=sb_request_proto.SerializeToString(),
                proxies=config.get_proxies(),
                cert=cert.name
            )
        except Exception:
            raise CloudgatewayServerError('Unable to reach Spacebridge', 503)


def parse_sb_response(raw_response):
    """
    Parses the cloudgateway response a device pairing confirmation request
    :param raw_response: bytes received from cloudgateway
    :return:  DevicePairingConfirmationResponse protobuf object
    """
    sb_response_proto = http_pb2.DevicePairingConfirmationResponse()
    sb_response_proto.ParseFromString(raw_response.content)

    if sb_response_proto.HasField('error'):
        if raw_response.status_code == 500:
            raise CloudgatewayServerError('Cloudgateway encountered an internal error: {0}'.format(sb_response_proto.error.message)
                                          , 500)
        raise CloudgatewayServerError(
            'Cloudgateway request error: {0}'.format(sb_response_proto.error.message),
            raw_response.status_code
        )

    if not str(raw_response.status_code).startswith('2'):
        raise CloudgatewayServerError("Cloudgateway error: {0}".format(raw_response.content), raw_response.status_code)

    return sb_response_proto


def build_encypted_credentials_bundle(username, encrypted_session_token, encrypt_func, server_app_id,
                                      deployment_name="", token_type=http_pb2.TokenType.Value('SESSION'), token_expires_at=0,
                                      env_metadata=None):
    """
    Takes a username, an encrypted session token and an encryption function, creates a credentials bundle proto
    and then encrypts the proto (hence building the encrypted credentials bundle).
    :param username:
    :param encrypted_session_token:
    :param encrypt_func:
    :return:
    """
    credentials_bundle_proto = http_pb2.CredentialsBundle()
    credentials_bundle_proto.sessionToken = encrypted_session_token
    credentials_bundle_proto.userName = username
    credentials_bundle_proto.deploymentName = deployment_name
    credentials_bundle_proto.tokenType = token_type
    credentials_bundle_proto.tokenExpiresAt = token_expires_at

    if server_app_id:
        credentials_bundle_proto.serverTypeId = server_app_id

    if env_metadata and env_metadata.serialized_metadata:
        credentials_bundle_proto.environmentMetadata.serializedMetadata = env_metadata.serialized_metadata
    if env_metadata and env_metadata.id:
        credentials_bundle_proto.environmentMetadata.id = env_metadata.id


    credentials_bundle = credentials_bundle_proto.SerializeToString()
    return encrypt_func(credentials_bundle)


def build_device_pairing_req(auth_code, device_id, encrypt_public_key, sign_public_key, encrypted_credentials_bundle):
    """
    Build Device Pairing Confirmation Request protobuf object
    """


    sb_request_proto = http_pb2.DevicePairingConfirmationRequest()
    sb_request_proto.authenticationCode = auth_code
    sb_request_proto.deviceId = device_id
    sb_request_proto.deploymentPublicKeyForEncryption = encrypt_public_key
    sb_request_proto.deploymentPublicKeyForSigning = sign_public_key
    sb_request_proto.encryptedCredentialsBundle = encrypted_credentials_bundle

    return sb_request_proto
