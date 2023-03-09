"""
Twisted based implementation of handler for mdm authentication request
"""
import base64
import json
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib'))

from cloudgateway.private.registration import mdm
from cloudgateway.private.util.tokens_util import calculate_token_info
from cloudgateway.device import DeviceInfo, make_device_id
from cloudgateway.private.encryption.encryption_handler import sign_verify, decrypt_session_token
from cloudgateway.mdm import MDM_REGISTRATION_VERSION, CloudgatewayMdmRegistrationError
from twisted.internet import defer
from spacebridge_protocol import http_pb2, sb_common_pb2
from splapp_protocol import request_pb2
from cloudgateway.private.twisted.clients.async_spacebridge_client import AsyncSpacebridgeClient
from cloudgateway.private.util.twisted_utils import add_error_back
from cloudgateway.private.util import constants
from cloudgateway.private.util.time_utils import get_current_timestamp


@defer.inlineCallbacks
def handle_mdm_authentication_request(mdm_auth_request_proto, encryption_context,
                                      server_context, logger, config, request_id):
    """
    Takes a MDM Auth Request proto, decrypts the encrypted credentials bundle, validates the credentials, persists
    device information to the server and sends cloudgateway a confirmation result message
    Args:
        mdm_auth_request_proto (MdmAuthenticationRequest proto): request from the client to perform MDM registration
        encryption_context (EncryptionContext):
        server_context (ServerContext): object which specifies how mdm registration should be validated and how
            credentials should be persisted to the server
        logger (Logger): logger class to handle logging

    Returns:

    """

    logger.info("Parsing MDM Authentication Request, request_id={}".format(request_id))
    client_credentials = sb_common_pb2.MdmAuthenticationRequest.ClientCredentials()
    client_credentials.ParseFromString(mdm_auth_request_proto.clientCredentials)
    mdm_signature = mdm_auth_request_proto.mdmSignature
    client_signature = mdm_auth_request_proto.clientSignature

    try:
        logger.debug("Validating MDM signature MDM request message, request_id={}".format(request_id))
        mdm_signing_key = yield add_error_back(defer.maybeDeferred(server_context.get_mdm_signing_key),
                                               logger=logger)
        if not sign_verify(encryption_context.sodium_client, mdm_signing_key,
                           mdm_auth_request_proto.clientCredentials, mdm_signature):
            raise CloudgatewayMdmRegistrationError(CloudgatewayMdmRegistrationError.errortype.unknown_error,
                                                   "mdm signature validation failed")

        logger.debug("Validating registration version={}, request_id={}"
                     .format(client_credentials.registrationVersion, request_id))
        if client_credentials.registrationVersion != MDM_REGISTRATION_VERSION:
            raise CloudgatewayMdmRegistrationError(CloudgatewayMdmRegistrationError.ErrorType.UNKNOWN_ERROR,
                                                   "Incompatible Mdm Registration Version. Expected={}"
                                                   .format(MDM_REGISTRATION_VERSION))

        encrypted_credentials_bundle = client_credentials.encryptedCredentialsBundle

        credentials_bundle = mdm.parse_mdm_encrypted_credentials_bundle(encrypted_credentials_bundle,
                                                                        encryption_context)
        client_id = credentials_bundle.registeringAppId
        username = credentials_bundle.username
        password = credentials_bundle.password
        encrypt_public_key = credentials_bundle.publicKeyForEncryption
        sign_public_key = credentials_bundle.publicKeyForSigning
        login_type = credentials_bundle.loginType
        user_session_token = credentials_bundle.sessionToken # JWT session token sent by the client after MDM SAML
        friendly_name = credentials_bundle.registeringAppFriendlyName
        platform = credentials_bundle.registeringAppPlatform
        device_registered_timestamp = get_current_timestamp()

        logger.debug("Validating publicKey signature of MDM request message, request_id={}".format(request_id))

        if not sign_verify(encryption_context.sodium_client, sign_public_key, mdm_auth_request_proto.clientCredentials,
                           client_signature):
            raise CloudgatewayMdmRegistrationError(CloudgatewayMdmRegistrationError.ErrorType.UNKNOWN_ERROR,
                                                   "client signature validation failed")

        device_info = DeviceInfo(encrypt_public_key, sign_public_key,
                                 device_id=make_device_id(encryption_context, sign_public_key),
                                 app_id=client_id, client_version="", app_name=friendly_name, platform=platform,
                                 registration_method=constants.MDM, device_management_method=constants.MDM,
                                 device_registered_timestamp=device_registered_timestamp)

        registration_info = {
            "registration_method": request_pb2.VersionGetResponse.MDM
        }

        if login_type == constants.SAML:
            device_info.auth_method = constants.SAML
            encrypted_session_token = user_session_token
            raw_token = base64.b64decode(encrypted_session_token)
            decrypted_session_token = decrypt_session_token(encryption_context.sodium_client,
                                                            raw_token,
                                                            encryption_context.encrypt_public_key(),
                                                            encryption_context.encrypt_private_key())
            session_jsn = json.loads(decrypted_session_token)
            token_type = http_pb2.TokenType.Value('JWT')
            token_expires_at = calculate_token_info(session_jsn['token'])['exp']

            registration_info["registration_type"] = request_pb2.VersionGetResponse.SAML
        else:
            device_info.auth_method = constants.LOCAL_LDAP
            yield add_error_back(defer.maybeDeferred(server_context.validate, username, password, device_info),
                                 logger=logger)

            logger.debug("Server validated mdm registration request. request_id={}".format(request_id))

            session_token = yield add_error_back(
                defer.maybeDeferred(server_context.create_session_token, username, password),
                logger=logger)

            encrypted_session_token = encryption_context.secure_session_token(session_token)
            token_type = http_pb2.TokenType.Value('SESSION')
            token_expires_at = 0

            registration_info["registration_type"] = request_pb2.VersionGetResponse.LOCAL_LDAP

        server_version = yield add_error_back(defer.maybeDeferred(server_context.get_server_version),
                                              logger=logger)

        logger.debug("Server returned server_version={}, request_id={}".format(server_version, request_id))

        deployment_name = yield add_error_back(defer.maybeDeferred(server_context.get_deployment_name),
                                               logger=logger)

        logger.debug("Server returned deployment_name={}, request_id={}".format(deployment_name, request_id))

        server_type_id = yield add_error_back(defer.maybeDeferred(server_context.get_server_type),
                                              logger=logger)
        env_metadata = yield add_error_back(defer.maybeDeferred(server_context.get_environment_meta, device_info,
                                                                username, registration_info),
                                              logger=logger)

        pairing_info = mdm.build_pairing_info(encrypted_session_token, credentials_bundle.username, server_version,
                                              deployment_name, server_type_id, token_type, token_expires_at,
                                              env_metadata=env_metadata)
        confirmation_result = mdm.build_successful_confirmation_result(pairing_info)

        yield add_error_back(defer.maybeDeferred(server_context.persist_device_info, device_info, username),
                             logger=logger)

        logger.info("Successfully persisted device registration information, request_id={}".format(request_id))

    except CloudgatewayMdmRegistrationError as e:
        logger.exception("MDM registration error occurred={}, request_id={}".format(e, request_id))
        confirmation_result = mdm.build_error_confirmation_result(e.to_proto())
    except Exception as e:
        logger.exception("Unexpected error occurred during MDM registration={}, request_id={}".format(e, request_id))
        error = http_pb2.HttpError()
        error.code = http_pb2.HttpError.ERROR_UNKNOWN
        error.message = str(e)
        confirmation_result = mdm.build_error_confirmation_result(error)

    mdm_authentication_confirmation_request = mdm.build_mdm_authentication_confirmation_request(confirmation_result,
                                                                                                encryption_context,
                                                                                                device_info)

    r = yield mdm.async_send_confirmation_result(mdm_authentication_confirmation_request, encryption_context,
                                                 server_context.async_spacebridge_client)
    resp = yield r.content()

    logger.info("Completed MDM Authentication Request with response={}, code={}, request_id={}"
                .format(resp, r.code, request_id))

    defer.returnValue(mdm_authentication_confirmation_request)
