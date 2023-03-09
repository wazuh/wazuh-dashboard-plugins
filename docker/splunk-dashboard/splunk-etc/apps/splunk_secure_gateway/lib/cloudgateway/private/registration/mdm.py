from spacebridge_protocol import http_pb2, sb_common_pb2
from cloudgateway.device import make_device_id
from cloudgateway.private.encryption.encryption_handler import decrypt_for_receive, encrypt_for_send, sign_detached
from cloudgateway.private.registration.util import sb_auth_header
from functools import partial


def parse_mdm_encrypted_credentials_bundle(encrypted_credentials_bundle, encryption_context):
    """

    Args:
        encrypted_credentials_bundle (Serialized ClientCredentials proto)
        encryption_context (EncryptionContext)

    Returns: (sb_common_pb2.MdmAuthenticationRequest.CredentialsBundle)

    """

    decrypted_bundle = decrypt_for_receive(encryption_context.sodium_client, encryption_context.encrypt_public_key(),
                                           encryption_context.encrypt_private_key(), encrypted_credentials_bundle)

    credentials_bundle = sb_common_pb2.MdmAuthenticationRequest.CredentialsBundle()
    credentials_bundle.ParseFromString(decrypted_bundle)

    return credentials_bundle

def build_pairing_info(session_token, username, server_version, deployment_name, server_type_id,
                       token_type=http_pb2.TokenType.Value('SESSION'), token_expires_at=0, env_metadata=None):
    """
    Args:
        session_token (String): encrypted session token
        username (String):
        server_version (String):

    Returns (http_pb2.MdmAuthenticationConfirmationRequest.PairingInformation())

    """

    pairing_info = http_pb2.MdmAuthenticationConfirmationRequest.PairingInformation()
    pairing_info.sessionToken = session_token
    pairing_info.userName = username
    pairing_info.serverVersion = server_version
    pairing_info.registrationVersion = sb_common_pb2.REGISTRATION_VERSION_1
    pairing_info.deploymentName = deployment_name
    pairing_info.serverTypeId = server_type_id
    pairing_info.tokenType = token_type
    pairing_info.tokenExpiresAt = token_expires_at

    if env_metadata and env_metadata.serialized_metadata:
        pairing_info.environmentMetadata.serializedMetadata = env_metadata.serialized_metadata
    if env_metadata and env_metadata.id:
        pairing_info.environmentMetadata.id = env_metadata.id

    return pairing_info


def build_successful_confirmation_result(pairing_info):
    """
    Build confirmation result proto in the case where MDM registration was successful
    Args:
        pairing_info(http_pb2.MdmAuthenticationConfirmationRequest.PairingInformation()):

    Returns (http_pb2.MdmAuthenticationConfirmationRequest.ConfirmationResult)
    """
    confirmation_result = http_pb2.MdmAuthenticationConfirmationRequest.ConfirmationResult()
    confirmation_result.pairingInformation.CopyFrom(pairing_info)
    return confirmation_result


def build_error_confirmation_result(http_error_proto):
    """
    Build confirmation result proto in the case where MDM registration was not successful
    Args:
        http_error_proto (http_pb2.MdmAuthenticationConfirmationRequest.ConfirmationResult)

    Returns (http_pb2.MdmAuthenticationConfirmationRequest.ConfirmationResult)

    """
    confirmation_result = http_pb2.MdmAuthenticationConfirmationRequest.ConfirmationResult()
    confirmation_result.error.CopyFrom(http_error_proto)
    return confirmation_result


def build_mdm_authentication_confirmation_request(confirmation_result, encryption_context, recipient_device_info):
    """
    Build final MDM authentication confirmation request to be sent to cloud gateway
    Args:
        confirmation_result(http_pb2.MdmAuthenticationConfirmationRequest.ConfirmationResult):
        encryption_context (EncryptionContext):
        recipient_device_info (DeviceInfo):

    Returns (http_pb2.MdmAuthenticationConfirmationRequest):

    """
    confirmation_request = http_pb2.MdmAuthenticationConfirmationRequest()

    encrypt_func = partial(encrypt_for_send, encryption_context.sodium_client, recipient_device_info.encrypt_public_key)
    sign_func = partial(sign_detached, encryption_context.sodium_client, encryption_context.sign_private_key())

    confirmation_result_bytes = confirmation_result.SerializeToString()
    encrypted_confirmation_result = encrypt_func(confirmation_result_bytes)

    confirmation = http_pb2.MdmAuthenticationConfirmationRequest.Confirmation()

    confirmation.encryptedConfirmationResult = encrypted_confirmation_result
    confirmation.requestorId = make_device_id(encryption_context, recipient_device_info.sign_public_key)

    confirmation_request.confirmation = confirmation.SerializeToString()
    confirmation_request.signature = sign_func(confirmation.SerializeToString())
    return confirmation_request


def async_send_confirmation_result(confirmation_result, encryption_context, async_sb_client):
    """

    Send an async http request to spacebridge to complete MDM registration

    Args:
        confirmation_result (MdmAuthenticationConfirmationResult)
        encryption_context (EncryptionContext)
        async_sb_client (AsyncSpacebridgeClient):
    """

    return async_sb_client.async_send_request(
      api='/api/mdm/confirm',
      auth_header=None,
      data=confirmation_result.SerializeToString(),
      headers={'Content-Type': 'application/x-protobuf', 'Authorization': sb_auth_header(encryption_context)}
    )


