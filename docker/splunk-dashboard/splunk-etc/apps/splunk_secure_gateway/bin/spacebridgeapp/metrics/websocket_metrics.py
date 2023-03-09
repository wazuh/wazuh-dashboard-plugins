"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Methods for per message instrumentation beacons from the websocket side of things
"""


def send_websocket_metrics_to_telemetry(message_type,
                                        request_context,
                                        async_telemetry_client,
                                        logger,
                                        useragent=None,
                                        params=None):
    """
    Take a message type string and useragent string and log that information to telemetry
    :param message_type: String (e.g. DASHBOARD_LIST_REQUEST)
    :param request_context:
    :param async_telemetry_client:
    :param logger:
    :param useragent: String representing the user's device meta information
    :return:
    """
    payload = {
        "messageType": message_type,
        "deviceId": request_context.device_id,
        "useragent": useragent
    }
    if params:
        payload.update(params)

    return async_telemetry_client.post_metrics(payload, request_context.system_auth_header, logger)
