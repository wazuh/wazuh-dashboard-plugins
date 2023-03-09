"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
from splapp_protocol import envelope_pb2
from spacebridgeapp.messages.util import fetch_device_info as device_info_helper
from spacebridgeapp.messages.message_processor import process_message, post_process_message, handle_spacebridge_message
from spacebridgeapp.request.legacy_request import transform_legacy_client_message, transform_generic_response_to_legacy
from spacebridgeapp.util.guid_generator import get_guid
from cloudgateway.websocket import AbstractMessageHandler, ServerResponse


class CloudgatewayMessageHandler(AbstractMessageHandler):
    """
    Message handler which determines how to handle application and spacebridge level messages
    """

    def __init__(self, system_auth_header, logger, encryption_context, async_client_factory,
                 guid_generator=get_guid, shard_id=None):
        self.system_auth_header = system_auth_header
        self.logger = logger
        self.async_client_factory = async_client_factory
        self.async_kvstore_client = async_client_factory.kvstore_client()
        self.async_splunk_client = async_client_factory.splunk_client()
        self.encryption_context = encryption_context
        self.guid_generator = guid_generator
        self.shard_id = shard_id
        super(CloudgatewayMessageHandler, self).__init__(encryption_context)

    async def handle_application_message(self, msg, sender, request_id):
        """
        Business logic for how to handle an application level message from a client device
        :param msg: decrypted payload of message
        :param sender: id of the sender sending the message
        :param request_id: id of the request message
        :return: ServerResponse object containing payload to be sent back to client
        """
        self.logger.info("Incoming message size=%s, request_id=%s", len(msg), request_id)

        try:
            # Parse message to proto
            server_application_message = envelope_pb2.ServerApplicationMessage()
            client_application_message = envelope_pb2.ClientApplicationMessage()
            client_application_message.ParseFromString(msg)
            server_response_id = self.guid_generator()

            # Transform legacy requests into a generic message requests
            # TODO: Remove when client devices migrate to generic message api
            transform_legacy_client_message(client_application_message)

            # process message
            request_context = await process_message(sender,
                                                    client_application_message,
                                                    server_application_message,
                                                    self.async_client_factory,
                                                    self.encryption_context,
                                                    server_response_id,
                                                    self.system_auth_header,
                                                    self.shard_id)

            # Transform generic message to legacy protobuf format
            # TODO: Remove when client devices migrate to generic message api
            transform_generic_response_to_legacy(server_application_message)
            payload = server_application_message.SerializeToString()

            # Construct response to send back to client
            server_response = ServerResponse(payload, request_context.request_id)
            responses = [server_response] if payload else []

            # Do post processing for managing subscriptions
            subscription_update = await post_process_message(request_context,
                                                             server_application_message,
                                                             self.async_client_factory,
                                                             get_guid
                                                             )

            if subscription_update:
                subscription_response = ServerResponse(subscription_update)
                responses.append(subscription_response)

            return responses

        except Exception as e:
            self.logger.exception("Exception handling application message={0}".format(e))

    async def handle_cloudgateway_message(self, msg):
        """
        Specifies behavior when a message is received from spacebridge. Here we just call the handle spacebridge
        message function
        :param msg: Spacebridge Message protobuf object
        :return:
        """
        await handle_spacebridge_message(self.system_auth_header, msg, self.async_client_factory, self.encryption_context)

    async def fetch_device_info(self, device_id):
        """
        Given a device id, fetch the corresponding information for that device from KV Store
        :param device_id:
        :return: DeviceInfo object
        """
        device_info = await device_info_helper(device_id, self.async_kvstore_client, self.system_auth_header)
        return device_info

