from http import HTTPStatus
from cloudgateway.private.messages.send import build_encrypted_payload
from spacebridge_protocol import http_pb2
from cloudgateway.private.asyncio.clients.async_spacebridge_client import SpacebridgeAuthHeader
from cloudgateway.private.exceptions.rest import CloudgatewayServerError


async def send_response(server_response, sender_encryption_info, websocket_protocol, logger):

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

        await websocket_protocol.send_bytes(serialized_envelope)
        logger.info("message=SENT_BACK request_id={0}".format(server_response.request_id))
        return serialized_envelope

    except Exception as e:
        logger.exception("Error sending message back, request_id={0}".format(server_response.request_id))


async def send_response_https(server_response,
                              sender_encryption_info,
                              encryption_context,
                              async_spacebridge_client,
                              logger):

    # Take server payload and wrap in an envelope
    try:

        send_message_request = http_pb2.SendMessageRequest()
        build_encrypted_payload(recipient_info=sender_encryption_info,
                                encryption_context=encryption_context,
                                payload=server_response.payload,
                                request_id=server_response.request_id,
                                logger=logger,
                                signed_envelope=send_message_request.signedEnvelope)

        logger.info(f"Signed Envelope size_bytes={send_message_request.ByteSize()}, "
                    f"request_id={server_response.request_id}")

        sender_id = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)
        sender_id_hex = sender_id.hex()
        headers = {'Content-Type': 'application/x-protobuf', 'Authorization': sender_id_hex}
        response = await async_spacebridge_client.async_send_message_request(
            auth_header=SpacebridgeAuthHeader(sender_id),
            data=send_message_request.SerializeToString(),
            headers=headers)

        if response.code != HTTPStatus.OK:
            message = await response.text()
            raise CloudgatewayServerError(message=message, status=response.code)

        logger.info(f"message=SENT_BACK request_id={server_response.request_id}")
        return send_message_request

    except CloudgatewayServerError as e:
        logger.exception(f"Error sending message back, request_id={server_response.request_id}")

