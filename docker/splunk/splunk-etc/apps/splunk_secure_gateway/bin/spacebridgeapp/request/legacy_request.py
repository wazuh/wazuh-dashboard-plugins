"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
Module to handle transformation of legacy protobuf requests to and from generic messages
"""
from spacebridgeapp.util import constants
from splapp_protocol import request_pb2
from splapp_protocol import subscription_pb2

## Legacy Configurations
LEGACY_AR_APP_ID = "com.splunk.app.ar.legacy"
LEGACY_TV_APP_ID = "com.splunk.app.tv.legacy"

LEGACY_APP_IDS = {LEGACY_AR_APP_ID, LEGACY_TV_APP_ID}

LEGACY_REQUEST_MAPPING = {
    (constants.CLIENT_SINGLE_REQUEST, "tvGetRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvConfigSetRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvConfigBulkSetRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvConfigDeleteRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvBookmarkSetRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvBookmarkGetRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvBookmarkDeleteRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvBookmarkActivateRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "startMPCBroadcastRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvInteractionRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "tvCaptainUrlRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "groupGetRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "groupSetRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SINGLE_REQUEST, "groupDeleteRequest"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SUBSCRIBE_REQUEST, "droneModeTVSubscribe"): LEGACY_TV_APP_ID,
    (constants.CLIENT_SUBSCRIBE_REQUEST, "droneModeiPadSubscribe"): LEGACY_TV_APP_ID
}
NAMESPACE_TO_CLASS_MAPPING = {
    "TVGetResponse": (request_pb2, "TVGetResponse", "tvGetResponse"),
    "TVConfigSetResponse": (request_pb2, "TVConfigSetResponse", "tvConfigSetResponse"),
    "TVConfigBulkSetResponse": (request_pb2, "TVConfigBulkSetResponse", "tvConfigBulkSetResponse" ),
    "TVConfigDeleteResponse": (request_pb2, "TVConfigDeleteResponse","tvConfigDeleteResponse" ),
    "TVBookmarkSetResponse": (request_pb2, "TVBookmarkSetResponse", "tvBookmarkSetResponse"),
    "TVBookmarkGetResponse": (request_pb2, "TVBookmarkGetResponse", "tvBookmarkGetResponse"),
    "TVBookmarkDeleteResponse": (request_pb2, "TVBookmarkDeleteResponse", "tvBookmarkDeleteResponse"),
    "TVBookmarkActivateResponse": (request_pb2, "TVBookmarkActivateResponse", "tvBookmarkActivateResponse"),
    "StartMPCBroadcastResponse": (request_pb2, "StartMPCBroadcastResponse", "startMPCBroadcastResponse"),
    "TVInteractionResponse": (request_pb2, "TVInteractionResponse", "tvInteractionResponse"),
    "TVCaptainUrlResponse": (request_pb2, "TVCaptainUrlResponse", "tvCaptainUrlResponse"),
    "GroupGetResponse": (request_pb2, "GroupGetResponse", "groupGetResponse"),
    "GroupSetResponse": (request_pb2, "GroupSetResponse", "groupSetResponse"),
    "GroupDeleteResponse": (request_pb2, "GroupDeleteResponse", "groupDeleteResponse"),
    "DroneModeTVSubscribe":  (subscription_pb2, "DroneModeTVSubscribe", "droneModeTVSubscribe"),
    "DroneModeiPadSubscribe": (subscription_pb2, "DroneModeiPadSubscribe", "droneModeiPadSubscribe"),
}


def build_app_id(high_level_request_type, request_type):
    """
    given a legacy request type, map it corresponding app id namespace
    E.g. tvGetRequest ->  com.splunk.app.tv.legacy.tvGetRequest

    if request type is not a legacy request, raise an exception.
    """
    if (high_level_request_type, request_type) not in LEGACY_REQUEST_MAPPING:
        raise NotALegacyRequestTypeException()

    return LEGACY_REQUEST_MAPPING[(high_level_request_type, request_type)] + "." + request_type


class NotALegacyRequestTypeException(Exception):
    pass


def _transform_legacy_request(client_request, client_request_type):
    """ helper method to to convert legacy field to generic message field at the same proto level """
    for high_level_request_type, request_type in LEGACY_REQUEST_MAPPING:
        if client_request_type == high_level_request_type and client_request.HasField(request_type):
            # Serialize the legacy request to bytes and store in generic message
            message = getattr(client_request, request_type).SerializeToString()
            client_request.ClearField(request_type)
            client_request.genericMessage.message = message
            client_request.genericMessage.namespace = build_app_id(high_level_request_type, request_type)

def transform_legacy_client_message(client_application_message):
    """ Take a client application message, if it has a legacy field, convert the field to a generic message"""
    if client_application_message.HasField(constants.CLIENT_SINGLE_REQUEST):
        _transform_legacy_request(client_application_message.clientSingleRequest, constants.CLIENT_SINGLE_REQUEST)
    elif client_application_message.HasField(constants.CLIENT_SUBSCRIPTION_MESSAGE):
        client_subscription_message = client_application_message.clientSubscriptionMessage
        if client_subscription_message.HasField(constants.CLIENT_SUBSCRIBE_REQUEST):
            _transform_legacy_request(client_subscription_message.clientSubscribeRequest, constants.CLIENT_SUBSCRIBE_REQUEST)
        if client_subscription_message.HasField(constants.CLIENT_SUBSCRIPTION_UPDATE):
            _transform_legacy_request(client_subscription_message.clientSubscriptionUpdate, constants.CLIENT_SUBSCRIPTION_UPDATE)

def transform_generic_response_to_legacy(server_application_message):
    """
    Take a server application message  object containing a generic message. If the namespace in the message is associated to
    a legacy request type (e.g. com.splunk.app.tv.legacy), convert the generic message into the legacy message format
    (e.g. serverSingleResponse.TvGetResponse).

    Noop if namespace does not match legacy app id.
    """

    if server_application_message.HasField(constants.SERVER_SINGLE_RESPONSE):
        server_response = server_application_message.serverSingleResponse
    elif server_application_message.HasField(constants.SERVER_SUBSCRIPTION_RESPONSE):
        server_response = server_application_message.serverSubscriptionResponse.serverSubscribeResponse
    else:
        return

    namespace = server_response.genericMessage.namespace
    message = server_response.genericMessage.message

    # Extract response type string from namespace
    # e.g. com.splunk.app.tv.legacy.tvGetRequest -> tvGetRequest
    # Next extracts the first element matching the criterion. We don't expect collisons in app_id prefixes so this
    # should always be unique. Next is also faster than using a for loop.
    response = next((namespace.replace(app_id + ".", "") for app_id in LEGACY_APP_IDS if namespace.startswith(app_id)),
                    None)

    # If above iterator found a match, it means namespace corresponds to a legacy message type and we try to convert it
    if response:
        # Given a string representing response type we need to actually instantiate the corresponding protobuf response
        # object. e.g. envelop_pb2.TvGetResponse()
        module, class_name, field_name = NAMESPACE_TO_CLASS_MAPPING[response]
        proto = getattr(module, class_name)()
        proto.ParseFromString(message)

        # Once we have constructed the response object we need to plug it back into the server single response
        # message and get rid of the generic message field.
        proto_request_attr = getattr(server_response, field_name)
        server_response.ClearField("genericMessage")
        proto_request_attr.CopyFrom(proto)

    # If iterator did not find match, noop.
