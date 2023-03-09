"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process connectivity tests for Client debugging
"""

from base64 import b64decode
from functools import partial
from http import HTTPStatus
from splapp_protocol import envelope_pb2
from spacebridge_protocol import http_pb2, websocket_pb2, sb_common_pb2
from cloudgateway.private.encryption.encryption_handler import encrypt_for_send, sign_detached
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.devices.user_devices import public_keys_for_device
from spacebridgeapp.request.request_processor import SpacebridgeAuthHeader
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_connectivity_test_request_processor.log",
                       "connectivity_test_request_processor")


async def process_connectivity_test_request(request_context,
                                            encryption_context,
                                            client_single_request,
                                            server_single_response,
                                            async_spacebridge_client,
                                            async_kvstore_client):
    """
    This method processes a connectivity get request and sends a message back to the client via https

    :param request_context:
    :param encryption_context:
    :param client_single_request: reference client request object
    :param server_single_response:
    :param async_spacebridge_client:
    :param async_kvstore_client:
    """

    # Client sends a request ID which is sent back by Splapp via https response
    request_id = client_single_request.connectivityTestRequest.requestId

    sender_id = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)
    headers = {'Content-Type': 'application/x-protobuf', 'Authorization': sender_id.hex()}

    # Create signer using private key
    signer = partial(sign_detached, encryption_context.sodium_client, encryption_context.sign_private_key())

    # Get device_id
    device_id_raw = b64decode(request_context.device_id)
    _, receiver_encrypt_public_key = await public_keys_for_device(device_id_raw,
                                                                  request_context.auth_header,
                                                                  async_kvstore_client)

    # create encryptor based on receiver public key
    encryptor = partial(encrypt_for_send, encryption_context.sodium_client, receiver_encrypt_public_key)

    # build message to send through spacebridge send_message api
    send_message_request = build_connectivity_test_response(server_single_response, device_id_raw, sender_id,
                                                            request_id, encryptor, signer)

    response = await async_spacebridge_client.async_send_message_request(auth_header=SpacebridgeAuthHeader(sender_id),
                                                                         data=send_message_request.SerializeToString(),
                                                                         headers=headers)

    message = await response.text()
    if response.code != HTTPStatus.OK:
        raise SpacebridgeApiRequestError(
            "Connectivity test via https failed with code={} message={}".format(response.code, message),
            status_code=response.code)

    LOGGER.info("Connectivity test via https succeeded with code={} message={}".format(response.code, message))

    return server_single_response


def build_connectivity_test_response(server_single_response, recipient, sender_id, request_id, encrypt, signer):
    """
    Build connectivity test response to send to spacebridge send_message api
    :param server_single_response:
    :param recipient:
    :param sender_id:
    :param request_id:
    :param encrypt:
    :param signer:
    :return:
    """
    send_connectivity_message = http_pb2.SendMessageRequest()
    server_single_response.connectivityTestResponse.requestId = request_id

    # Package in ServerApplicationMessage
    server_application_message = envelope_pb2.ServerApplicationMessage()
    server_application_message.serverSingleResponse.CopyFrom(server_single_response)

    encrypted_payload = encrypt(server_application_message.SerializeToString())
    build_signed_envelope(send_connectivity_message.signedEnvelope, recipient,
                          sender_id, request_id, encrypted_payload, signer)
    return send_connectivity_message


def build_signed_envelope(signed_envelope, recipient, sender_id, request_id, encrypted_payload, signer):
    """
    Build signed envelope application message
    :param signed_envelope:
    :param recipient:
    :param sender_id:
    :param request_id:
    :param encrypted_payload:
    :param signer:
    :return:
    """
    application_message = websocket_pb2.ApplicationMessage()
    application_message.version = websocket_pb2.ApplicationMessage.MAJOR_VERSION_V1
    application_message.id = request_id
    application_message.to = recipient
    application_message.sender = sender_id
    application_message.payload = encrypted_payload

    serialized = application_message.SerializeToString()
    signature = signer(serialized)

    signed_envelope.messageType = sb_common_pb2.SignedEnvelope.MESSAGE_TYPE_APPLICATION_MESSAGE
    signed_envelope.signature = signature
    signed_envelope.serialized = serialized
