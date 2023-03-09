from functools import partial
from cloudgateway.private.encryption.encryption_handler import (
    encrypt_for_send, sign_detached)
from spacebridge_protocol import http_pb2, sb_common_pb2, websocket_pb2


def build_encrypted_payload(recipient_info, encryption_context, payload, request_id=None, logger=None, signed_envelope=None):
    """Build encrypted message to send to spacebridge

    Args:
        recipient_info ([DeviceInfo]): DeviceInfo object corresponding to recipient
        encryption_context ([EncryptionContext]):
        payload ([binary]): Payload to be encrypted. Can be binary or string
        request_id ([String], optional): [description]. Defaults to None.
        logger ([Logger], optional): [description]. Defaults to None.
        signed_envelope ([sb_common_pb2.SignedEnvelope], optional): SignedEnvelope proto which can be passed by reference

    Returns:
        [SignedEnvelope]: returns signed envelope object containing encrypted credentials. If signed envelope if passed as an argument,
        the same container object is returned.
    """
    sodium_client = encryption_context.sodium_client
    encrypt_func = partial(encrypt_for_send, sodium_client, recipient_info.encrypt_public_key)
    encrypted_payload = encrypt_func(payload)
    sign_func = partial(sign_detached, sodium_client, encryption_context.sign_private_key())

    if not signed_envelope:
        signed_envelope = sb_common_pb2.SignedEnvelope()

    build_envelope(signed_envelope,
                   encrypted_payload,
                   recipient_info.device_id,
                   encryption_context,
                   request_id,
                   sign_func,
                   encryption_context.generichash_raw,
                   logger)

    logger.info("Signed Envelope size_bytes={0}, request_id={1}".format(signed_envelope.ByteSize(), request_id))
    return signed_envelope


def send_response(server_response, sender_encryption_info, websocket_protocol, logger):

    # Take server payload and wrap in an envelope
    try:

        signed_envelope = build_encrypted_payload(sender_encryption_info,
                                                  websocket_protocol.encryption_context,
                                                  server_response.payload,
                                                  server_response.request_id,
                                                  logger)

        serialized_envelope = signed_envelope.SerializeToString()

        logger.info("Signed Envelope size_bytes={0}, request_id={1}".format(signed_envelope.ByteSize(),
                                                                            server_response.request_id))

        websocket_protocol.sendMessage(serialized_envelope, isBinary=True)
        logger.info("message=SENT_BACK request_id={0}".format(server_response.request_id))
        return serialized_envelope

    except Exception as e:
        logger.exception("Error sending message back, request_id={0}".format(server_response.request_id))





def build_envelope(signed_response, message, recipient, encryption_context, request_id, sign, generichash, logger):
    """Takes the Server Application Response, encrypts it and constructs
    top level Signed Envelope which is sent back to Spacebridge.

    Arguments:
        :param message: Encrypted and processed message
        :param recipient: Who the message will be sent to
        :param encryption_context: Encryption context object
        :param request_id: The id we associate with the request on the server side
        :param sign: A function that takes in a message and returns a digital signature
        :param generichash: hash function for encryption
        :param logger: Logger object for logging purposes
    Returns:
        SignedEnvelope Proto
    """

    # First construct application level message
    application_message = websocket_pb2.ApplicationMessage()
    application_message.version = websocket_pb2.ApplicationMessage.MAJOR_VERSION_V1
    application_message.id = request_id
    application_message.to = recipient
    application_message.sender = encryption_context.sign_public_key(transform=generichash)
    application_message.payload = message


    serialized = application_message.SerializeToString()

    # Construct Signed Envelope
    signed_response.serialized = serialized
    signed_response.messageType = sb_common_pb2.SignedEnvelope.MESSAGE_TYPE_APPLICATION_MESSAGE
    signed_response.signature = sign(serialized)

    logger.info("Finished Signing envelope request_id={}".format(request_id))
    return signed_response
