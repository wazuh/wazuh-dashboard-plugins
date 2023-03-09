"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Constants file for constants referenced throughout project
"""

# App Name
SPACEBRIDGE_APP_NAME = "splunk_secure_gateway"
CLOUDGATEWAY_APP_NAME = "splunk_app_cloudgateway"
SPLAPP_APP_ID = "com.splunk.app.securegateway"
CLOUDGATEWAY = "cloudgateway"
SECUREGATEWAY = "securegateway"

# Other Apps
SPLUNK_DASHBOARD_STUDIO = "splunk-dashboard-studio"
SPLUNK_DASHBOARD_APP = "splunk-dashboard-app"
UDF_IMAGE_RESOURCE_COLLECTION = "splunk-dashboard-images"
UDF_ICON_RESOURCE_COLLECTION = "splunk-dashboard-icons"
SSG_ENABLE_MODULAR_INPUT = "ssg_enable_modular_input"

# Splunk
NOBODY = "nobody"
ADMIN = 'admin'
VALUE = 'value'
LABEL = 'label'
MATCH = 'match'

# storage/passwords constants
NAME = 'name'
PASSWORD = 'password'
CONTENT_TYPE_FORM_ENCODED = 'application/x-www-form-urlencoded'
AUTHTOKEN = 'authtoken'
SESSION = 'session'
USER = 'user'
USERNAME = 'username'
SYSTEM_AUTHTOKEN = 'system_authtoken'
JWT_TOKEN_TYPE = 'splunk.jwt.token'
SPLUNK_SESSION_TOKEN_TYPE = 'splunk.session.token'
COOKIES = 'cookies'
HTTP_PORT = 'httpport'
CONTENT = 'content'
BODY = 'body'
ENTRY = 'entry'
SAML = 'SAML'
JWT = 'JWT'
TRUE = "true"
FALSE = "false"
DISABLED = 'disabled'
PROTOCOL_ENDPOINTS = 'protocol_endpoints'

# spacebridge message events
UNREGISTER_EVENT = "unregisterEvent"
MDM_REGISTRATION_REQUEST = "mdmRegistrationRequest"

# conf file constants
KVSTORE = 'kvstore'
MAX_DOCUMENTS_PER_BATCH_SAVE = 'max_documents_per_batch_save'
SPACEBRIDGE_SERVER = 'spacebridge_server'
HTTP_DOMAIN = 'http_domain'
GRPC_DOMAIN = 'grpc_domain'
INSTANCE_ID = 'instance_id'
REGION = 'region'
REGION_DESCRIPTION = 'description'
ID = 'id'

MTLS_CERT = 'mtls_cert'
MTLS_KEY = 'mtls_key'

# KV Store Constants
REGISTERED_DEVICES_COLLECTION_NAME = "registered_devices"
REGISTERED_DEVICES_META_COLLECTION_NAME = "registered_devices_meta"
UNCONFIRMED_DEVICES_COLLECTION_NAME = "unconfirmed_devices"
APPLICATION_TYPES_COLLECTION_NAME = "application_types"
FEATURES_COLLECTION_NAME = "features"
MOBILE_ALERTS_COLLECTION_NAME = "mobile_alerts"
REGISTERED_USERS_COLLECTION_NAME = "registered_users"
ALERTS_RECIPIENT_DEVICES_COLLECTION_NAME = "alert_recipient_devices"
AR_DASHBOARDS_COLLECTION_NAME = "ar_dashboards"
AR_PERMISSIONS_COLLECTION_NAME = "ar_permissions"
AR_BEACONS_COLLECTION_NAME = "ar_beacons"
AR_BEACON_REGIONS_COLLECTION_NAME = "ar_beacon_regions"
AR_GEOFENCES_COLLECTION_NAME = "ar_geofences"
AR_WORKSPACES_COLLECTION_NAME = "ar_workspaces"
AR_CAPABILITIES_COLLECTION_NAME = "ar_capabilities"
ASSETS_COLLECTION_NAME = "assets"
ASSET_GROUPS_COLLECTION_NAME = "asset_groups"
META_COLLECTION_NAME = "meta"
SUBSCRIPTIONS_COLLECTION_NAME = "subscriptions"
SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME = "subscription_credentials"
SEARCHES_COLLECTION_NAME = "searches"
SEARCH_UPDATES_COLLECTION_NAME = "search_updates"
DASHBOARD_META_COLLECTION_NAME = "dashboard_meta"
DEVICE_PUBLIC_KEYS_COLLECTION_NAME = "device_public_keys"
USER_META_COLLECTION_NAME = "user_meta"
DEVICE_ROLES_COLLECTION_NAME = "device_role_mapping"
GROUPS_COLLECTION_NAME = "groups"
DRONE_MODE_TVS_COLLECTION_NAME = "drone_mode_tvs"
DRONE_MODE_IPADS_COLLECTION_NAME = "drone_mode_ipads"
TV_BOOKMARK_COLLECTION_NAME = "tv_bookmark"
INSTANCE_CONFIG_COLLECTION_NAME = "instance_config"
TAGGING_CONFIG_COLLECTION_NAME = "tagging_config"
DELETE_TOKENS_COLLECTION_NAME = "delete_tokens"
DASHBOARD_APP_LIST = "dashboard_app_list"
ORIGINAL_WORKSPACE_FIELD = "original_workspace"
LAST_MODIFIED = "last_modified"
WORKSPACE_DATA = "workspace_data"
USER_KEY = "_user"
TIMESTAMP = "timestamp"
ROLE = "role"
CAPABILITIES = "capabilities"
SEARCH_KEY = "search_key"
SUBSCRIPTION_KEY = "subscription_key"
SUBSCRIPTION_TYPE = "subscription_type"
PARENT_SEARCH_KEY = "parent_search_key"
SHARD_ID = "shard_id"
ID_HASH = "id_hash"
BASE = "base"
DASHBOARD_ID = "dashboard_id"
DASHBOARD_IDS = "dashboard_ids"
NEARBY_ENTITY = "nearby_entity"
APP_LIST = 'app_list'
APP_NAMES = 'app_names'
DISPLAY_APP_NAME = 'display_app_name'
SEARCH = 'search'
DRONE_MODE_KEY = 'drone_mode'
RESOURCE_TYPE = 'resource_type'
MINIMAL_LIST = 'minimal_list'
MAX_RESULTS = 'max_results'
OFFSET = 'offset'
DEVICE_ID = 'device_id'
VERSION = 'version'
LAST_UPDATE_TIME = 'last_update_time'
BATCH_SAVE = 'batch_save'
TTL_SECONDS = 'ttl_seconds'
EXPIRED_TIME = 'expired_time'
DRONE_MODE_TV = 'drone_mode_tv'
DRONE_MODE_IPAD = 'drone_mode_ipad'
SUBSCRIPTION_CREDENTIAL_GLOBAL = "*"
MIGRATION_DONE = 'migration_done'
PLATFORM = 'platform'
APP_ID = 'app_id'
AUTHOR = 'author'
DASHBOARDS_VISIBLE = 'dashboards_visible'
REGISTRATION_V1 = "registration_v1"
REGISTRATION_V2 = "registration_v2"

# Form inputs constants
TIMEPICKER = 'timepicker'
DROPDOWN = 'dropdown'
RADIO = 'radio'
CHECKBOX = 'checkbox'
TEXTBOX = 'textbox'
MULTISELECT = 'multiselect'
TOKEN_NAME = 'tokenName'
DEFAULT_VALUE = 'defaultValue'
DEPENDS = 'depends'
REJECTS = 'rejects'
INPUT_TOKENS = 'input_tokens'

# Splunk roles
ADMIN_ALL_OBJECTS = 'admin_all_objects'

# Module Level Constants
CLIENT_SINGLE_REQUEST = "clientSingleRequest"
SERVER_SINGLE_RESPONSE = "serverSingleResponse"
CLIENT_SUBSCRIPTION_MESSAGE = "clientSubscriptionMessage"
VERSION_GET_RESPONSE = "VersionGetResponse"

# Server Subscription Constants
CLIENT_SUBSCRIBE_REQUEST = "clientSubscribeRequest"
CLIENT_SUBSCRIPTION_UPDATE = "clientSubscriptionUpdate"
SERVER_SUBSCRIPTION_RESPONSE = "serverSubscriptionResponse"
SERVER_SUBSCRIBE_RESPONSE = "serverSubscribeResponse"
SERVER_SUBSCRIBE_UPDATE_RESPONSE = "serverSubscribeUpdateResponse"
DRONE_MODE_TV_SUBSCRIBE = "droneModeTVSubscribe"
DRONE_MODE_IPAD_SUBSCRIBE = "droneModeiPadSubscribe"

# Client Subscribe Subscription Constants
CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_REQUEST = "dashboardVisualizationSubscribe"
CLIENT_SUBSCRIBE_DASHBOARD_INPUT_SEARCH_REQUEST = "dashboardInputSearchSubscribe"
CLIENT_SUBSCRIBE_SAVED_SEARCH_REQUEST = "clientSavedSearchSubscribe"
CLIENT_SUBSCRIBE_UDF_DATASOURCE = "udfDataSourceSubscribe"
CLIENT_SUBSCRIBE_DRONE_MODE_TV = "droneModeTVSubscribe"
CLIENT_SUBSCRIBE_DRONE_MODE_IPAD = "droneModeiPadSubscribe"
CLIENT_SUBSCRIBE_GENERIC_MESSAGE = "genericMessage"

# Client Subscribe Subscription Update Constants
CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CLUSTER_MAP = "dashboardVisualizationClusterMap"
CLIENT_SUBSCRIBE_DASHBOARD_VISUALIZATION_CHOROPLETH_MAP = "dashboardVisualizationChoroplethMap"
TRELLISSPLITBY = "trellisSplitBy"
TRELLISENABLED = "trellisEnabled"

# Search Job Constants
EXEC_MODE_ONESHOT = 'oneshot'
EXEC_MODE_NORMAL = 'normal'

# Subscription Search Constants
ROOT = 'root'
SAVED_SEARCH_ARGS_PREFIX = "args."
SUBSCRIPTION_VERSION_2 = 2

# Deployment Info Constants
DEPLOYMENT_INFO = "deployment_info"
DEPLOYMENT_FRIENDLY_NAME = "friendly_name"
DEPLOYMENT_ID = "deployment_id"
INSTANCEID = "instanceId"
ENFORCE_MDM = "enforce_mdm"
AUTH_TYPE = "auth_type"
IS_CLOUD_INSTANCE = "is_cloud_instance"

# Registered Devices KV STORE Field Names
DEVICE_NAME = "device_name"
DEVICE_ID = "device_id"
DEVICE_TYPE = "device_type"
APP_ID = "app_id"
APP_NAME = "app_name"
PLATFORM = "platform"
DEVICE_REGISTERED_TIMESTAMP = "device_registered_timestamp"
REGISTRATION_METHOD = "registration_method"
AUTH_METHOD = "auth_method"
DEVICE_MANAGEMENT_METHOD = "device_management_method"

# Registration Constants
ENCRYPTION_KEYS = "encryption_keys"
MDM_SIGN_PUBLIC_KEY = "mdm_sign_public_key"
MDM_SIGN_PRIVATE_KEY = "mdm_sign_private_key"
PUBLIC_KEY = "public_key"
SIGN_PUBLIC_KEY = "sign_public_key"
SIGN_PRIVATE_KEY = "sign_private_key"
ENCRYPT_PUBLIC_KEY = "encrypt_public_key"
ENCRYPT_PRIVATE_KEY = "encrypt_private_key"
SERVER_VERSION = "server_version"
MDM_KEYPAIR_GENERATION_TIME = "mdm_keypair_generation_time"
LAST_SEEN_TIMESTAMP = "last_seen_timestamp"
MDM_SIGNATURE = "mdm_signature"
CUSTOM_ENDPOINT_ID = "custom_endpoint_id"
CUSTOM_ENDPOINT_HOSTNAME = "custom_endpoint_hostname"
CUSTOM_ENDPOINT_GRPC_HOSTNAME = "custom_endpoint_grpc_hostname"
CLIENT_CERT_REQUIRED = "client_cert_required"
CREATED = "created"
REGISTRATION_VERSION = "registration_version"
REGISTRATION_TYPE = "registraton_type"
SELF_REGISTER = "self_register"
AUTH_CODE = "auth_code"
TEMP_KEY = "temp_key"
MESSAGES = "messages"
TYPE = "type"
TEXT = "text"
ERROR = "ERROR"
CODE = "code"

# KV STORE OPERATORS
AND_OPERATOR = "$and"
OR_OPERATOR = "$or"
LESS_THAN_OPERATOR = "$lt"
GREATER_THAN_OPERATOR = "$gt"
GREATER_THAN_OR_EQUAL_TO_OPERATOR = "$gte"
NOT_EQUAL = "$ne"
SORT = "sort"
LIMIT = "limit"
FIELDS = "fields"
QUERY = "query"
POST_SEARCH = "post_search"
KEY = "_key"
SKIP = 'skip'

# TELEMETRY
TELEMETRY_INSTANCE_ID = "telemetry_instance_id"
SPLUNK_VERSION = "serverVersion"
ON_CLOUD_INSTANCE = "on_cloud_instance"
INSTALLATION_ENVIRONMENT = "installationEnvironment"
ENTERPRISE = "enterprise"
CLOUD = "cloud"

# App Name
ALERTS_IOS = "Splunk Mobile"
ALERTS_IOS_LEGACY = "Alerts iOS"
APPLE_TV = "Apple TV"
SPLUNK_TV = "Splunk TV"
AR_PLUS = "Splunk AR"
SPLUNK_VR = "Splunk VR"
VR = "VR"
DRONE_MODE = "Drone Mode"
DRONE_IPAD = "Drone Mode iPad"
SPLUNK_TV_COMPANION = "Splunk TV Companion"
SPLUNK_IPAD = "Splunk iPad"
SPLUNK_IPAD_DEV = "Splunk iPad Dev"

# Device Platform
IOS = "iOS"
ANDROID = "Android"
ANDROID_TV = "Android TV"
FIRE_TV = "Fire TV"
IPAD_OS = 'iPadOS'

# Environment Variables
ENV_E2E_ENCRYPTION = "MOBILE_E2E_ENCRYPTION"
ENV_OPTION_ON = "1"

# Performance Constants
MAX_PAYLOAD_SIZE_BYTES = 1000000.0  # 1mb
TIMEOUT_SECONDS = 10
SPACEBRIDGE_SERVER_UPDATE_INTERVAL = 7
SERVER = 'server'
RT = 'response_time'

HEADERS = 'headers'
HEADER_AUTHORIZATION = 'Authorization'
HEADER_CONTENT_TYPE = 'Content-Type'
HEADER_USER_AGENT = 'User-Agent'
OUTPUT_MODE = 'output_mode'
JSON = 'json'
COUNT = 'count'

APPLICATION_JSON = 'application/json; charset=utf-8'

# Form Dashboards
MAX_TOKEN_CHARACTERS = 200

# Default ports
DEFAULT_HTTP_PORT = 80
DEFAULT_HTTPS_PORT = 443

# Alerts constants
SERVER_URI = "server_uri"
SUBJECT = "alert_subject"
DESCRIPTION = "alert_description"
SEVERITY = "alert_severity"
CALL_TO_ACTION_URL = "alert_call_to_action_url"
CALL_TO_ACTION_LABEL = "alert_call_to_action_label"
ALERT_TIMESTAMP_FIELD = "alert_time"
ALERT_DASHBOARD_ID = "alert_dashboard_id"
ALERT_DASHBOARD_DATA = "alert_dashboard_data"
DASHBOARD_TOGGLE = "dashboard_toggle"
ALERT_RECIPIENTS = "alert_recipients"
ALERT_ID = "alert_id"
ALERT_MESSAGE = "alert_message"
ALERT_SUBJECT = "alert_subject"
CONFIGURATION = "configuration"
SAVED_SEARCH_RESULT = "result"
MESSAGE = "message"
SESSION_KEY = "session_key"
RESULTS_LINK = "results_link"
SEARCH_ID = "sid"
OWNER = "owner"
APP = "app"
SEARCH_NAME = "search_name"
ATTACH_DASHBOARD_TOGGLE = "1"
ATTACH_TABLE_TOGGLE = "2"
TOKEN = "token_name"
FIELDNAME = "result_fieldname"
RESULT = "result"
ALL_USERS = "all"

# AR Constants
VALID_TOKEN_NAME = "ar.assetID"
VALID_CHART_TYPES = ('fillerGauge', 'radialGauge', 'markerGauge')
PAYLOAD = 'payload'
STATUS = 'status'

ACTION = 'action'
CREATE = 'create'
UPDATE = 'update'
DELETE = 'delete'
POST = 'post'
GET = 'get'
POST_OR_UPDATE = 'post_or_update'


# MISC
REQUEST_CONTEXT = 'request_context'

# Request Types
SINGLE_REQUEST = "single_request"
SUBSCRIPTION = "subscription"

# Snooze constants
SNOOZE_REQUEST_TYPE = 'requestType'
SNOOZE_ALL_REQUEST_TYPE = 'snoozeAll'
SNOOZE_TYPE = 'snoozeType'
SNOOZE_ALL_SCOPE = 'ALL'

SNOOZED_SCOPES_COLLECTION_NAME = 'snoozed_scopes'
SCOPE = 'scope'
START_TIME = 'start_time'
END_TIME = 'end_time'

# TRELLIS constants
SOURCES = "sources"
AGGREGATION = "_aggregation"
TIME_FIELD = "_time"
BY_CLAUSE = "by"

# ITSI constants
ITSI_GLASS_TABLE = 'itsi_glass_table'
ITSI_GLASS_TABLES_DISPLAY_APP_NAME = 'ITSI Glass Tables'
ITSI_DISPLAY_APP_NAME = 'ITSI Dashboards'
ITSI = 'itsi'
SA_ITOA = 'SA-ITOA'
ITSI_FILES_COLLECTION = 'SA-ITOA_files'
ITSI_ICON_COLLECTION = 'SA-ITOA_icon_collection'
