"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import base64
import os
import time
from functools import partial

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import requests
from base64 import b64decode
from spacebridgeapp.util import py23
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from cloudgateway.private.sodium_client import SodiumClient
from cloudgateway.private.encryption.encryption_handler import sign_detached
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.util import errors as Errors
from spacebridge_protocol import http_pb2
from spacebridgeapp.util.config import secure_gateway_config as config
from cloudgateway.private.registration.util import requests_ssl_context
from http import HTTPStatus

APP_TYPE_LABEL = 'app_type'

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_registration_query")


def authentication_query_request(auth_code, encryption_context):
    """ Abstraction layer for the spacebridge request. This function:
        1. Makes the registration query GET request to the spacebridge endpoint
        2. Parses the protobuf response
        3. Packs the response values into a response object. Binary objects are encoded to ensure kvstore compatibility

    :param auth_code: Authorization code of the device being registered
    :return: response object containing "public_key", "device_id", and "conf_code"
    """

    # Makes the registration query GET request to the spacebridge endpoint
    try:
        headers = {'Authorization': encryption_context.sign_public_key(transform=encryption_context.generichash_hex)}
        response = requests.get('%s/api/registrations/%s' % (config.get_spacebridge_domain(), auth_code),
                                headers=headers, proxies=config.get_proxies())
    except Exception:
        LOGGER.exception("Exception contacting spacebridge")
        raise Errors.SpacebridgeServerError('Unable to reach Spacebridge', 503)

    # Parses the protobuf response
    spacebridge_response = http_pb2.AuthenticationQueryResponse()
    spacebridge_response.ParseFromString(response.content)

    if spacebridge_response.HasField('error'):
        if response.status_code == 500:
            raise Errors.SpacebridgeServerError('Spacebridge encountered an internal error: %s'
                                                % spacebridge_response.error.message, 500)

        raise Errors.SpacebridgeServerError(
            'Spacebridge request error: %s' % spacebridge_response.error.message,
            response.status_code
        )

    if not str(response.status_code).startswith('2'):
        raise Errors.SpacebridgeServerError("Spacebridge error: %s" % str(response.content), response.status_code)

    # Packs the response values into a response object. Binary objects are encoded to ensure kvstore compatibility
    encrypt_public_key = spacebridge_response.payload.publicKeyForEncryption
    sign_public_key = spacebridge_response.payload.publicKeyForSigning
    response = {
        'encrypt_public_key': py23.b64encode_to_str(encrypt_public_key),
        'sign_public_key': py23.b64encode_to_str(sign_public_key),
        'device_id': py23.b64encode_to_str(spacebridge_response.payload.deviceId),
        'conf_code': encryption_context.generichash_hex(sign_public_key).upper()[:8],
    }

    try:
        response[APP_TYPE_LABEL] = translate_app_name(http_pb2.AppType.Name(spacebridge_response.payload.appType))
    except ValueError as err:
        # When app_type is 'APPTYPE_INVALID'
        raise Errors.SpacebridgeRestError('Registration Error: %s' % str(err), 501)

    return response


def delete_device_from_spacebridge(device_id, system_authtoken, key_bundle=None):
    """
    Deletes device from spacebridge
    :param device_id:
    :param system_authtoken:
    :return: response from spacebridge
    """
    headers, unregister_proto = _process_unregister_request(device_id, system_authtoken)

    with requests_ssl_context(key_bundle):
        try:
            response = requests.delete("%s/api/session" % config.get_spacebridge_domain(),
                                       headers=headers, proxies=config.get_proxies(),
                                       data=unregister_proto.SerializeToString())
        except Exception:
            LOGGER.exception("Exception attempting sending delete device request to Spacebridge")
            raise Errors.SpacebridgeServerError('Unable to reach Spacebridge', HTTPStatus.SERVICE_UNAVAILABLE)

    LOGGER.info("Received response=%s on delete device from Spacebridge request" % response.status_code)

    _process_unregister_response(response.content)

    return response


async def async_delete_device_from_spacebridge(async_spacebridge_client, device_id, system_authtoken):
    """
    Async deletes device from spacebridge
    :param async_spacebridge_client:
    :param device_id:
    :param system_authtoken:
    :return: response from spacebridge
    """
    headers, unregister_proto = _process_unregister_request(device_id, system_authtoken)

    response = await async_spacebridge_client.async_send_delete_request(
        api="/api/session", auth_header=None, data=unregister_proto.SerializeToString(), headers=headers)

    if response.code != HTTPStatus.OK:
        response = await response.text()
        LOGGER.exception("Exception attempting sending delete device request to Spacebridge, with code=%s, error_msg=%s"
                         % (response.code, response))
        raise Errors.SpacebridgeServerError('Unable to reach Spacebridge for device=%s'
                                            % device_id, HTTPStatus.SERVICE_UNAVAILABLE)

    LOGGER.info("Received response=%s on delete device from Spacebridge request" % response.code)

    _process_unregister_response(response._body)

    return response


def _process_unregister_response(response):
    spacebridge_response = http_pb2.DeviceUnregistrationResponse()
    spacebridge_response.ParseFromString(response)
    LOGGER.info('Spacebridge response: %s' % str(spacebridge_response))
    if spacebridge_response.HasField('error') and spacebridge_response.error.code != http_pb2.HttpError.Code.Value('ERROR_ROUTING_UNDELIVERABLE'):
        raise Errors.SpacebridgeServerError("Spacebridge error on delete device request=%s" %
                                            spacebridge_response.error.message)


def _process_unregister_request(device_id, system_authtoken):
    sodium_client = SodiumClient(LOGGER.getChild("sodium_client"))
    encryption_context = SplunkEncryptionContext(system_authtoken, constants.SPACEBRIDGE_APP_NAME, sodium_client)
    public_key_hash = encryption_context.sign_public_key(transform=encryption_context.generichash_hex)
    unregister_proto = http_pb2.DeviceUnregistrationRequest()
    unregister_proto.deviceId = b64decode(device_id)
    unregister_proto.deploymentId = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)
    headers = {'Authorization': public_key_hash, 'Content-Type': 'application/x-protobuf'}
    return headers, unregister_proto


def device_pairing_confirmation_request(auth_header, auth_code, username, device_id,
                                        encrypt_public_key, sign_public_key,
                                        session_token_encrypted, encrypt, deployment_friendly_name):
    """ Abstraction layer for the spacebridge request. This function:
        1. Creates the encrypted_credentials_bundle
        2. Generates a protobuf object from the supplied dictionary, proto_object
        3. Makes the registration confirmation PUT request to the spacebridge endpoint
        4. Parses the protobuf response, checking for error objects

    :param auth_code: Authorization code of the device being registered
    :param proto_object: Dict containing protobuf values
    :param username: User username for the encrypted_credentials_bundle
    :param password: User password for the encrypted_credentials_bundle
    :return: None
    """

    # Creates the encrypted_credentials_bundle
    credentials_bundle_proto = http_pb2.CredentialsBundle()
    credentials_bundle_proto.sessionToken = session_token_encrypted
    credentials_bundle_proto.userName = username
    credentials_bundle_proto.deploymentName = deployment_friendly_name
    credentials_bundle = credentials_bundle_proto.SerializeToString()

    encrypted_credentials_bundle = encrypt(credentials_bundle)

    # Generates a protobuf object from the supplied dictionary, proto_object
    sb_request_proto = http_pb2.DevicePairingConfirmationRequest()
    sb_request_proto.authenticationCode = auth_code
    sb_request_proto.deviceId = device_id
    sb_request_proto.deploymentPublicKeyForEncryption = encrypt_public_key
    sb_request_proto.deploymentPublicKeyForSigning = sign_public_key
    sb_request_proto.encryptedCredentialsBundle = encrypted_credentials_bundle
    LOGGER.info("Registration Bundle deploymentPublicKey= %s" % str(sb_request_proto.deploymentPublicKey))
    LOGGER.info("Registration Bundle deviceId= %s" % str(sb_request_proto.deviceId))

    # Makes the registration confirmation PUT request to the spacebridge endpoint
    try:
        response = requests.put(
            '%s/api/registrations/%s' % (config.get_spacebridge_domain(), auth_code),
            headers={
                'Content-Type': 'application/x-protobuf',
                'Authorization': str(auth_header)
            },
            data=sb_request_proto.SerializeToString(),
            proxies=config.get_proxies()
        )
    except Exception:
        raise Errors.SpacebridgeServerError('Unable to reach Spacebridge', 503)

    # Parses the protobuf response, checking for error objects
    sb_response_proto = http_pb2.DevicePairingConfirmationResponse()
    sb_response_proto.ParseFromString(response.content)

    if sb_response_proto.HasField('error'):
        if response.status_code == 500:
            raise Errors.SpacebridgeServerError('Spacebridge encountered an internal error: %s'
                                                % sb_response_proto.error.message, 500)
        raise Errors.SpacebridgeServerError(
            'Spacebridge request error: %s' % sb_response_proto.error.message,
            response.status_code
        )

    if not (200 <= response.status_code < 300):
        raise Errors.SpacebridgeServerError("Spacebridge error: %s" % str(response.content), response.status_code)


def send_mdm_signing_key_to_spacebridge(authtoken, mdm_public_signing_key, key_bundle=None):
    """ Send the mdm public signing key to spacebridge
        Abstraction layer for the spacebridge request. This function:
        1. Creates the mdm_credentials_bundle
        2. Serializes the bundle to bytes
        3. Signs the serialized bundle with the splapps private signing key
        4. Creates a proto object with the serialized bundle + signature and sends to spacebridge
        5. Parses the protobuf response, checking for error objects

    """

    sodium_client = SodiumClient(LOGGER.getChild("sodium_client"))
    encryption_context = SplunkEncryptionContext(authtoken,
                                                 constants.SPACEBRIDGE_APP_NAME,
                                                 sodium_client)
    sign_func = partial(sign_detached, sodium_client, encryption_context.sign_private_key())
    client_id = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)

    request_proto = http_pb2.MdmAuthenticationGrantRequest()
    client_mdm_permission = request_proto.ClientMdmPermission()
    client_mdm_permission.clientId = client_id
    client_mdm_permission.mdmPublicKeyForSigning = mdm_public_signing_key
    serialized = client_mdm_permission.SerializeToString()
    signature = sign_func(serialized)
    request_proto.clientMdmPermission = serialized
    request_proto.signature = signature
    headers = {'Authorization': encryption_context.sign_public_key(transform=encryption_context.generichash_hex), 'Content-Type': 'application/x-protobuf'}

    def call_grants():
        with requests_ssl_context(key_bundle) as cert:
            return requests.post(
                '{}/api/mdm/grants'.format(config.get_spacebridge_domain()),
                headers=headers,
                data=request_proto.SerializeToString(),
                proxies=config.get_proxies(),
                timeout=constants.TIMEOUT_SECONDS,
                cert=cert.name
            )

    try:
        response = call_grants()
    except requests.exceptions.Timeout as e:
        raise Errors.SpacebridgeServerError('Failed to receive a response from spacebridge', 500)

    sb_response_proto = http_pb2.MdmAuthenticationGrantResponse()
    sb_response_proto.ParseFromString(response.content)

    retries = 0
    while 500 <= response.status_code < 600 and retries < 3:
        wait = 2**retries
        retries = retries + 1
        time.sleep(wait)

        try:
            response = call_grants()
        except requests.exceptions.Timeout as e:
            raise Errors.SpacebridgeServerError('Failed to receive a response from spacebridge', 500)

        sb_response_proto = http_pb2.MdmAuthenticationGrantResponse()
        sb_response_proto.ParseFromString(response.content)

    if sb_response_proto.HasField('error'):
        if response.status_code == 500:
            raise Errors.SpacebridgeServerError('Spacebridge encountered an internal error:{}'
                                                .format(sb_response_proto.error.message), 500)
        raise Errors.SpacebridgeServerError(
            'Spacebridge request error: {}'.format(sb_response_proto.error.message, response.status_code)
        )

    if not (200 <= response.status_code < 300):
        raise Errors.SpacebridgeServerError("Spacebridge error: {}".format(response.content), response.status_code)


def translate_app_name(app_type):
    """ Translate the app_type recognized by Spacebridge to the type recognized by the kvstore

    :param app_type: String representing protobuf name of app_type
    :return: String representing the kvstore name of the app_type
    """
    if app_type == 'APPTYPE_INVALID':
        raise ValueError('Application type of device being registered is invalid')

    app_names = {
        'APPTYPE_INVALID': 'APPTYPE_INVALID',
        'APPTYPE_ALERTS': 'Alerts iOS',
        'APPTYPE_APPLE_TV': 'Apple TV',
        'APPTYPE_SPLUNK_TV': 'Splunk TV',
        'APPTYPE_AR': 'AR+',
        'APPTYPE_DRONE_MODE': 'Drone Mode',
    }
    return app_names[app_type]
