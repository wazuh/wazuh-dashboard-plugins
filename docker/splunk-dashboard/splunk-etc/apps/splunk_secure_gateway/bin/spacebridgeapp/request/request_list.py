"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Map of processing requests
"""
from spacebridgeapp.request.request_type import RequestType
from spacebridgeapp.request.alerts_request_processor import \
    process_alerts_list_request, process_alert_get_request, process_alerts_delete_request, \
    process_alerts_clear_request, process_snooze_request, process_get_snooze_request, process_unsnooze_request
from spacebridgeapp.request.app_list_request_processor import \
    process_app_list_request, process_dashboard_app_list_get_request, process_dashboard_app_list_set_request
from spacebridgeapp.request.dashboard_request_processor import \
    process_dashboard_list_request, process_dashboard_get_request, process_dashboard_set_request, \
    process_dashboard_data_request
from spacebridgeapp.request.version_request_processor import process_get_version_request
from spacebridgeapp.request.client_config_request_processor import process_client_config_request
from spacebridgeapp.request.subscription_request_processor import \
    process_subscribe_request, process_unsubscribe_request, process_ping_request, process_subscribe_update_request
from spacebridgeapp.request.request_processor import process_device_credentials_validate_request
from spacebridgeapp.rest.clients.async_client_factory import FACTORY, KVSTORE, SPLUNK, SPACEBRIDGE
from spacebridgeapp.udf.udf_request_processor import process_udf_hosted_resource_get
from spacebridgeapp.request.request_processor import process_complete_device_registration_request
from spacebridgeapp.request.generic_request_processor import process_generic_message_request
from spacebridgeapp.request.token_refresh_request_processor import process_token_refresh_request

ENCRYPTION_CONTEXT = 'encryption_context'
# Add New Requests Here in format (request_type, process_function, async_client args to process_function)
REQUESTS = [
    (RequestType.ALERTS_LIST_REQUEST, process_alerts_list_request, [KVSTORE]),
    (RequestType.ALERTS_CLEAR_REQUEST, process_alerts_clear_request, [KVSTORE]),
    (RequestType.ALERT_GET_REQUEST, process_alert_get_request, [KVSTORE]),
    (RequestType.ALERT_DELETE_REQUEST, process_alerts_delete_request, [KVSTORE]),
    (RequestType.APP_LIST_REQUEST, process_app_list_request, [FACTORY]),
    (RequestType.DASHBOARD_APP_LIST_SET_REQUEST, process_dashboard_app_list_set_request, [FACTORY]),
    (RequestType.DASHBOARD_APP_LIST_GET_REQUEST, process_dashboard_app_list_get_request, [FACTORY]),
    (RequestType.DASHBOARD_LIST_REQUEST, process_dashboard_list_request, [FACTORY]),
    (RequestType.DASHBOARD_GET_REQUEST, process_dashboard_get_request, [FACTORY]),
    (RequestType.DASHBOARD_SET_REQUEST, process_dashboard_set_request, [KVSTORE]),
    (RequestType.DASHBOARD_DATA_REQUEST, process_dashboard_data_request, [FACTORY]),
    (RequestType.VERSION_GET_REQUEST, process_get_version_request, [FACTORY]),
    (RequestType.GENERIC_MESSAGE_REQUEST, process_generic_message_request, [FACTORY]),
    (RequestType.CLIENT_CONFIG_REQUEST, process_client_config_request, []),
    (RequestType.UDF_HOSTED_RESOURCE_REQUEST, process_udf_hosted_resource_get,
     [KVSTORE, SPACEBRIDGE, ENCRYPTION_CONTEXT]),
    (RequestType.DEVICE_CREDENTIALS_VALIDATE_REQUEST, process_device_credentials_validate_request, [FACTORY]),
    (RequestType.COMPLETE_DEVICE_REGISTRATION_REQUEST, process_complete_device_registration_request, [FACTORY]),
    (RequestType.TOKEN_REFRESH_REQUEST, process_token_refresh_request, [SPLUNK, ENCRYPTION_CONTEXT, KVSTORE]),
    (RequestType.SNOOZE_REQUEST, process_snooze_request, [KVSTORE]),
    (RequestType.UNSNOOZE_REQUEST, process_unsnooze_request, [KVSTORE]),
    (RequestType.GET_SNOOZE_REQUEST, process_get_snooze_request, [KVSTORE]),
]

# Add New Subscription Requests Here in format (request_type, process_function, async_client args to process_function)
SUBSCRIPTION_REQUESTS = [
    (RequestType.CLIENT_SUBSCRIBE_REQUEST, process_subscribe_request, [FACTORY]),
    (RequestType.CLIENT_UNSUBSCRIBE_REQUEST, process_unsubscribe_request, [KVSTORE]),
    (RequestType.CLIENT_SUBSCRIPTION_PING, process_ping_request, [FACTORY]),
    (RequestType.CLIENT_SUBSCRIPTION_UPDATE, process_subscribe_update_request, [FACTORY]),
]
