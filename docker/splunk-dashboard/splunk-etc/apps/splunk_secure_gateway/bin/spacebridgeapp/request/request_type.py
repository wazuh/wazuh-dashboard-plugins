"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Constants file for request constants
"""

from enum import Enum


class RequestType(Enum):

    # Client Requests
    DASHBOARD_LIST_REQUEST = "dashboardListRequest"
    ALERTS_LIST_REQUEST = "alertsListRequest"
    APP_LIST_REQUEST = "appListRequest"
    DASHBOARD_APP_LIST_SET_REQUEST = "dashboardAppListSetRequest"
    DASHBOARD_APP_LIST_GET_REQUEST = "dashboardAppListGetRequest"
    DASHBOARD_GET_REQUEST = "dashboardGetRequest"
    DASHBOARD_SET_REQUEST = "dashboardSetRequest"
    BEACON_REGION_GET_REQUEST = "beaconRegionGetRequest"
    BEACON_REGION_SET_REQUEST = "beaconRegionSetRequest"
    BEACON_REGION_DELETE_REQUEST = "beaconRegionDeleteRequest"
    GEOFENCE_DASHBOARD_MAPPING_GET_REQUEST = "geofenceDashboardMappingGetRequest"
    GEOFENCE_DASHBOARD_MAPPING_GET_ALL_REQUEST = "geofenceDashboardMappingGetAllRequest"
    NEARBY_DASHBOARD_MAPPING_GET_REQUEST = "nearbyDashboardMappingGetRequest"
    NEARBY_DASHBOARD_MAPPING_SET_REQUEST = "nearbyDashboardMappingSetRequest"
    NEARBY_DASHBOARD_MAPPING_DELETE_REQUEST = "nearbyDashboardMappingDeleteRequest"
    ALERT_DELETE_REQUEST = "alertsDeleteRequest"
    ALERT_GET_REQUEST = "alertGetRequest"
    DASHBOARD_DATA_REQUEST = "dashboardDataRequest"
    ASSET_GET_REQUEST = "assetGetRequest"
    ASSET_SET_REQUEST = "assetSetRequest"
    ASSET_DELETE_REQUEST = "assetDeleteRequest"
    AR_WORKSPACE_SET_REQUEST = "arWorkspaceSetRequest"
    AR_WORKSPACE_SET_REQUEST_V2 = "arWorkspaceSetRequestV2"
    AR_WORKSPACE_GET_REQUEST = "arWorkspaceGetRequest"
    AR_WORKSPACE_GET_REQUEST_V2 = "arWorkspaceGetRequestV2"
    AR_WORKSPACE_DELETE_REQUEST_V2 = "arWorkspaceDeleteRequestV2"
    JUBILEE_CONNECTION_INFO_REQUEST = "jubileeConnectionInfoRequest"
    UNREGISTER_EVENT = "unregisterEvent"
    ALERTS_CLEAR_REQUEST = "alertsClearRequest"
    AR_WORKSPACE_LIST_REQUEST = "arWorkspaceListRequest"
    AR_WORKSPACE_IMAGE_SET_REQUEST = "arWorkspaceImageSetRequest"
    VERSION_GET_REQUEST = "versionGetRequest"
    CONNECTIVITY_TEST_REQUEST = "connectivityTestRequest"
    CLIENT_CONFIG_REQUEST = 'clientConfigRequest'
    GROUP_GET_REQUEST = "groupGetRequest"
    GROUP_SET_REQUEST = "groupSetRequest"
    GROUP_DELETE_REQUEST = "groupDeleteRequest"
    DEVICE_CREDENTIALS_VALIDATE_REQUEST = "deviceCredentialsValidateRequest"
    UDF_HOSTED_RESOURCE_REQUEST = "udfHostedResourceRequest"
    COMPLETE_DEVICE_REGISTRATION_REQUEST = "completeDeviceRegistrationRequest"
    AR_WORKSPACE_FORMAT_REQUEST = "arWorkspaceFormatRequest"
    CREATE_PHANTOM_REGISTRATION_REQUEST = 'createPhantomRegistrationRequest'
    GET_PHANTOM_REGISTRATION_INFO_REQUEST = 'getPhantomRegistrationInfoRequest'
    TV_GET_REQUEST = "tvGetRequest"
    TV_CONFIG_SET_REQUEST = "tvConfigSetRequest"
    TV_CONFIG_BULK_SET_REQUEST = "tvConfigBulkSetRequest"
    TV_CONFIG_DELETE_REQUEST = "tvConfigDeleteRequest"
    TV_BOOKMARK_SET_REQUEST = "tvBookmarkSetRequest"
    TV_BOOKMARK_GET_REQUEST = "tvBookmarkGetRequest"
    TV_BOOKMARK_DELETE_REQUEST = "tvBookmarkDeleteRequest"
    TV_BOOKMARK_ACTIVATE_REQUEST = "tvBookmarkActivateRequest"
    START_MPC_BROADCAST_REQUEST = "startMPCBroadcastRequest"
    TV_INTERACTION_REQUEST = "tvInteractionRequest"
    TV_CAPTAIN_URL_REQUEST = "tvCaptainUrlRequest"
    GENERIC_MESSAGE_REQUEST = "genericMessage"
    TOKEN_REFRESH_REQUEST = "tokenRefreshRequest"
    SNOOZE_REQUEST = "snoozeRequest"
    UNSNOOZE_REQUEST = "unsnoozeRequest"
    GET_SNOOZE_REQUEST = "getSnoozeRequest"

    # Client Subscription Requests
    CLIENT_SUBSCRIBE_REQUEST = "clientSubscribeRequest"
    CLIENT_UNSUBSCRIBE_REQUEST = "clientUnsubscribeRequest"
    CLIENT_SUBSCRIPTION_PING = "clientSubscriptionPing"
    CLIENT_SUBSCRIPTION_UPDATE = "clientSubscriptionUpdate"
    GENERIC_MESSAGE_SUBSCRIPTION_UPDATE = "genericMessage"
