"""
(C) 2019 Splunk Inc. All rights reserved.
"""
import requests
import sys

from cloudgateway.private.registration.util import sb_auth_endpoint, sb_auth_header, requests_ssl_context
from spacebridge_protocol import http_pb2
from cloudgateway.private.exceptions import rest as RestException
from cloudgateway.private.encryption.encryption_handler import sign_verify
from cloudgateway.private.sodium_client.errors import SodiumOperationError


def submit_auth_code(auth_code, encryption_context, config, key_bundle=None):
    """
    Given an auth code, submit it to cloudgateway's auth endpoint. Raise an exception if cannot reach cloudgateway
    :param auth_code
    :param encryption_context
    :param mtls_pkcs12: A PKCS12 object containing the certificate and private key information for mTLS
    :return: seriealized protobuf response from cloudgateway
    """

    with requests_ssl_context(key_bundle) as cert:
        try:
            spacebridge_header = {'Authorization': sb_auth_header(encryption_context)}
            return requests.get(sb_auth_endpoint(auth_code, config),
                                headers=spacebridge_header,
                                proxies=config.get_proxies(),
                                cert=cert.name
                                )
        except Exception as e:
            raise RestException.CloudgatewayServerError('Unable to reach cloudgateway: {0}'.format(e), 503)


def is_mdm_signature_valid(payload, mdm_signing_public_key, encryption_context):
    """
    Attempt to verify mdm signature with the given mdm_signing_public_key, and return boolean
    indicating whether or not verification was succesful
    """
    mdm_bundle = payload.serializedMdmVerificationBundle
    signature = payload.mdmVerificationBundleSignature

    if not mdm_signing_public_key or not mdm_bundle or not signature:
        return False
    
    try:
        return sign_verify(encryption_context.sodium_client, mdm_signing_public_key, mdm_bundle,
                                         signature)
    except SodiumOperationError as e:
        # Invalid MDM Signature
        return False


def verify_mdm_signature(payload, mdm_signing_public_key, encryption_context):
    """
    Verify the given mdm signature with the given mdm_signing_public_key. Throws exception
    if signature is invalid or does not match.
    """
    mdm_bundle = payload.serializedMdmVerificationBundle
    signature = payload.mdmVerificationBundleSignature

    if not mdm_bundle or not signature:
        raise RestException.CloudgatewayServerError('A valid mdm signature is required to register device',
                                                    401)

    try:
        is_signature_match = sign_verify(encryption_context.sodium_client, mdm_signing_public_key, mdm_bundle,
                                         signature)
    except SodiumOperationError as e:
        raise RestException.CloudgatewayServerError('Invalid mdm signature', 401)

    if not is_signature_match:
        raise RestException.CloudgatewayServerError('Signature did not match', 401)

    return True



def parse_spacebridge_response(response):
    """
    Takes the serialized protobuf response from cloudgateway's auth endpoint, parses it and returns the deserialized
    protobuf object
    :param response:
    :return: AuthenticationQueryResponse protobuf object
    """

    spacebridge_response = http_pb2.AuthenticationQueryResponse()
    spacebridge_response.ParseFromString(response.content)

    if spacebridge_response.HasField('error'):
        if response.status_code == 500:
            raise RestException.CloudgatewayServerError('cloudgateway encountered an internal error: %s'
                                                        % spacebridge_response.error.message, 500)

        raise RestException.CloudgatewayServerError(
            'cloudgateway request error: %s' % spacebridge_response.error.message,
            response.status_code
        )

    if not str(response.status_code).startswith('2'):
        raise RestException.CloudgatewayServerError("cloudgateway error: %s" % str(response.content), response.status_code)

    return spacebridge_response
