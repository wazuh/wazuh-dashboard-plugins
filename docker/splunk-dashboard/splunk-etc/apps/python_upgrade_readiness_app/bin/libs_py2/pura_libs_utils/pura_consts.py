import os

# Upgrade Readiness App Version
UPGRADE_READINESS_APP_VERSION = "4.0.3"

# Windows subprocess argument
DETACHED_PROCESS = 8

# App name
SELF_DIR_NAME = "python_upgrade_readiness_app"

# Splunk Path
SPLUNK_HOME = os.environ["SPLUNK_HOME"]
SPLUNK_PATH = os.path.join(SPLUNK_HOME, 'bin', 'splunk')

# Skipped python scan folders
SKIPPED_PYTHON_SCAN_DIRS = {
    "aob_py3"
}

# Directory paths
OTHER_APPS_DIR = os.path.join(SPLUNK_HOME, 'etc', 'apps')
SLAVE_APPS_DIR = os.path.join(SPLUNK_HOME, 'etc', 'slave-apps')
APP_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
LOCAL_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local')
REMOTE_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'remote')
MERGED_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'merged')
REPORT_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'reports')
SCAN_SUMMARY = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'scan_summary')
PURA_LOG_DIR = os.path.join(SPLUNK_HOME, 'var', 'log', 'python_upgrade_readiness_app')
SKYNET_LOG_DIR = os.path.join(PURA_LOG_DIR, 'scan_summary')
MAKO_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'mako')
SESSION_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'sessions')
CSV_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'bin', 'libs_py2', 'pura_libs_utils')
SYNCED_CSV_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'app_list')
PROCESS_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'bin', 'scan_process.py')
SHA512_HASH_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'sha512_hash.json')
STORAGE_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'storage')
JQUERY_MERGED_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'jquery_merged')
JQUERY_REPORT_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'jquery_reports')
JQUERY_REMOTE_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'jquery_remote')
JQUERY_PROCESS_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'bin', 'jura_scan_process.py')
JQUERY_SHA512_HASH_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'jquery_sha512_hash.json')
JQUERY_SCAN_SUMMARY = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'jquery_scan_summary')
EMERALD_MERGED_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'emerald_merged')
EMERALD_REPORT_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'emerald_reports')
EMERALD_REMOTE_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'emerald_remote')
EMERALD_PROCESS_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'bin', 'eura_scan_process.py')
EMERALD_SHA512_HASH_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'emerald_sha512_hash.json')
EMERALD_SCAN_SUMMARY = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'emerald_scan_summary')
SKYNET_SCAN_SUMMARY_FILE = 'scan_summary.json'
SPLUNK9X_COPY_PATH = os.path.join(APP_DIR, "python_upgrade_readiness_app", "apps")

# Constant
ALL_APPS_NAME = "pura_all_results"
OUTPUT_MODE_JSON = "output_mode=json"
HTML_EXTENSION = ".html"
PERSISTENT_FILE_JSON = "{}_0000000000.json"
EMAIL_ATTACHMENT_NAME = "python_upgrade_readiness_{}_{}.json"
JQUERY_EMAIL_ATTACHMENT_NAME = "upgrade_readiness_app_jQuery_{}_{}.json"
EMERALD_EMAIL_ATTACHMENT_NAME = "upgrade_readiness_app_emerald_{}_{}.json"
SUBJECT = "Python Upgrade Readiness Scan Notification"
JQUERY_SUBJECT = "jQuery Upgrade Readiness Scan Notification"
EMERALD_SUBJECT = "Splunk Platform Upgrade Readiness Scan Notification"

BODY = "Hello Splunk Admin,<br/><br/>"\
    "The Upgrade Readiness App detected <b>{} {} with deprecated {}</b> on the <b><a>{}</a></b> instance. "\
    "The Upgrade Readiness App detects apps with outdated Python or jQuery to help Splunk admins and app developers prepare for new releases of Splunk in which lower versions of Python and jQuery are removed. "\
    "For more details about your outdated apps, see the Upgrade Readiness App on your Splunk instance listed above.<br/><br/>"\
    "To address the issues detected by the Upgrade Readiness App, work with app developers to update their apps to use only Python 3 or higher and jQuery 3.5 or higher.<br/><br/>"\
    "For more information about addressing issues with outdated apps, removing lower versions of Python or jQuery, and how to manage these emails, "\
    "see <br/><i><span>https</span><span>://</span><span>docs.</span><span>splunk.</span>com/Documentation/URA.</i>"

EMERALD_EMAIL_BODY = "Hello Splunk Admin,<br/><br/>"\
    "The Upgrade Readiness App detected <b>{} that may need {} to be compatible with Splunk Enterprise 9.0 </b> on the <b><a>{}</a></b> instance. "\
    "The Upgrade Readiness App detects apps and configurations that require changes to help Splunk admins and app developers prepare to adopt the security enhancements coming in the new releases of Splunk. "\
    "For more details about the upcoming changes in Splunk Enterprise 9.0, see learnmore.security.securitycenter. <br/><br/>"\
    "To address the issues detected by the Upgrade Readiness App, work with app developers to update their apps to be compatible with Splunk 9.0. For more details about your impacted apps, see the Upgrade Readiness App on your Splunk instance listed above.<br/><br/>"\
    "For more information about addressing issues with impacted apps, getting them prepared for Splunk Enterprise 9.0, and how to manage these emails, "\
    "see <br/><i><span>https</span><span>://</span><span>docs.</span><span>splunk.</span>com/Documentation/URA.</i>"

FILE_LOCK = "{}.lock"
PATH_DOES_NOT_EXISTS_MESSAGE = "{} does not exist so creating it."
MERGED_FILE_JSON = "merged_report.json"
JQUERY_REQUIRED_ACTION_APP_UPDATE_AVAILABLE = "Update this app to the latest version on Splunkbase."
JQUERY_REQUIRED_ACTION_SPLUNKBASE_OTHERS = "Do one of the following:Petition the developer to update the app.;" \
                                                "Uninstall the app from the app listing page.;" \
                                                "Take ownership of the app " \
                                                "and override existing code (not recommended)."
JQUERY_DETAILS_APP_UPDATE_AVAILABLE = "This app is not compatible with jQuery 3.5. " \
                                            "A jQuery 3.5 compatible version of this app is available on Splunkbase."
JQUERY_DETAILS_SPLUNKBASE_OTHERS = "This app is not compatible with jQuery 3.5."
JQUERY_DETAILS_PRIVATE = "This app is not compatible with jQuery 3.5."
JQUERY_REQUIRED_ACTION_PRIVATE = "Update this app or request to uninstall it. If you do nothing, the app will fail in future Splunk upgrades that use jQuery 3.5."
NOAH_PATH = os.path.join(SPLUNK_HOME, "var", "run", "splunk", "noah_tmp")
EMERALD_REQUIRED_ACTION_PRIVATE = "Update this app, request to uninstall it, or work with the developer to determine if it is a false positive result. Dismiss false positives. If you do nothing, this app might not work as expected with Splunk platform versions 9.0 and higher."
EMERALD_REQUIRED_ACTION_SPLUNKBASE = "Do one of the following:"\
                                     "Confirm on the app's Splunkbase listing if this alert should be dismissed for this app version.;"\
                                     "Petition the developer to update the app.;"\
                                     "Uninstall the app from the app listing page.;"\
                                     "Take ownership of the app and override existing code (not recommended)."
EMERALD_DETAILS_COMPATIBLE = 'This {} is compatible with Splunk platform versions 9.0 and higher.'
EMERALD_DETAILS_NOT_COMPATIBLE = 'This {} is not compatible with Splunk platform versions 9.0 and higher.'
EMERALD_PYTHON_TLS_CHECK_REMEDIATION_MESSAGE = "If you are using {0} to connect to your own infrastructure with non-public PKI, "\
    "you must bundle your own CA certificates as part of your "\
    "app and pass the certificate path into {0} as an argument."
EMERALD_SYSTEM_CONFIG_REQUIRED_ACTION = "Secure your deployment with TLS certificates."
PYTHON_REQUIRED_ACTION_SPLUNKBASE = "Do one of the following:"\
                                    "Confirm on the app's Splunkbase listing if this alert should be dismissed for this app version.;"\
                                    "Petition the developer to update the app.;"\
                                    "Uninstall the app from the app listing page.;"\
                                    "Take ownership of the app and override existing code (not recommended)."

# JQUERY VERSIONS
JQUERY_VERSIONS = ['3.6.0', '3.5.1', '3.5.0', '3.4.1', '3.4.0', '3.3.1', '3.3.0', '3.2.1', '3.2.0', '3.1.1', '3.1.0', '3.0.0', '2.2.4', '2.2.3', '2.2.2', '2.2.1', '2.2.0', '2.1.4', '2.1.3', '2.1.2', '2.1.1', '2.1.0', '2.0.3', '2.0.2', '2.0.1', '2.0.0', '1.12.4', '1.12.3', '1.12.2', '1.12.1', '1.12.0', '1.11.3', '1.11.2', '1.11.1', '1.11.0', '1.10.2', '1.10.1', '1.10.0', '1.9.1', '1.9.0', '1.8.3', '1.8.2', '1.8.1', '1.8.0', '1.7.2', '1.7.1', '1.7.0', '1.7.0', '1.6.4', '1.6.3', '1.6.2', '1.6.1', '1.6.0', '1.5.2', '1.5.1', '1.5.0', '1.4.4', '1.4.3', '1.4.2', '1.4.1', '1.4.0', '1.3.2', '1.3.1', '1.3.0', '1.2.6', '1.2.5', '1.2.4', '1.2.3', '1.2.2', '1.2.1', '1.2.0', '1.1.4', '1.1.3', '1.1.2', '1.1.1', '1.1.0', '1.0.4', '1.0.3', '1.0.2', '1.0.1', '1.0.0']

# REST endpoints
instance_apps_endpoint = "/services/apps/local"
user_role_endpoint = "/services/authentication/users"
telemetry_endpoint = "/servicesNS/nobody/search/telemetry-metric"
pra_get_progress_collection = "pra_get_progress"
pra_cancel_scan_collection = "pra_cancel_scan"
pra_dismiss_file_collection = "pra_dismiss_file"
pra_dismiss_app_collection = "pra_dismiss_app"
pra_dismiss_remote_app_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_remote_dismiss_app"
pra_dismiss_remote_file_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_remote_dismiss_file"
user_records_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_user_records?output_mode=json"
schedule_scan_collection = "pra_schedule_scan"
alert_actions_endpoint = "admin/alert_actions"
schedule_scan_interval_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/data/inputs/script/{}"
send_email_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/data/inputs/script/{}"
get_host_endpoint = "/services/server/info"
get_host_endpoint_json = "{}?output_mode=json".format(get_host_endpoint)
pra_remote_scan_collection = "pra_remote_scan"
pra_remote_schedule_scan_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_remote_schedule_scan"

jra_dismiss_remote_app_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/jra_remote_dismiss_app"
jra_dismiss_remote_file_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/jra_remote_dismiss_file"
jra_remote_schedule_scan_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/jra_remote_schedule_scan"
jra_get_progress_collection = "jra_get_progress"
jra_cancel_scan_collection = "jra_cancel_scan"

era_dismiss_remote_app_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/era_remote_dismiss_app"
era_dismiss_remote_file_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/era_remote_dismiss_file"
era_remote_schedule_scan_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/era_remote_schedule_scan"
era_get_progress_collection = "era_get_progress"
era_cancel_scan_collection = "era_cancel_scan"
era_dismiss_remote_system_check_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/era_remote_dismiss_system_check"

pra_email_switch_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_jra_email_notification_switch"
era_email_switch_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/era_email_notification_switch"

oneshot_local_host_details = "| rest splunk_server=local services/server/info"
oneshot_all_hosts_details = "| rest services/server/info | sort splunk_server"

# REST success codes
success_codes = ['200', '201', '204']

# Acceptable actions in python settings tab
acceptable_actions = ["python2", "python3", "force python3"]

# Python versions
python_versions = ["python2", "python3", "force_python3"]

# Exclude email address
EXCLUDE_EMAILS = ["support@splunk.com", "changeme@example.com"]

# System default apps
SYSTEM_APPS = ['search', 'splunk_archiver', 'splunk_instrumentation', 'splunk_monitoring_console', 'learned',
               'splunk_gdi', 'splunk_metrics_workspace', 'splunk_httpinput', 'SplunkLightForwarder',
               'SplunkForwarder', 'sample_app', 'legacy', 'launcher', 'user-prefs', 'introspection_generator_addon',
               'gettingstarted', 'appsbrowser', 'default', 'alert_webhook', 'alert_logevent', 'python_upgrade_readiness_app',
               'framework', 'splunk_rapid_diag', 'splunk_secure_gateway', 'splunk_internal_metrics', 'journald_input', 'upgrade_readiness_app',
               '_cluster', 'splunk_essentials_8_2', 'splunk-dashboard-studio', '075-cloudworks', '100-cloudworks-wlm',
               '100-whisper', '100-whisper-common', '100-whisper-searchhead', 'prometheus', 'splunk_datasets_addon',
               'splunkclouduf', '100-s2-config', '100-whisper-clusterapp', '100-whisper-indexer', '_cluster_admin',
               'cloud_administration', 'dmc', 'dynamic-data-self-storage-app', 'splunk_instance_monitoring', 'tos', 'data_manager',
               'splunk_product_guidance', 'splunk_assist']


# Whitelisted apps
PREMIUM_APPS = ['DA-ITSI-APPSERVER', 'DA-ITSI-DATABASE', 'DA-ITSI-EUEM', 'DA-ITSI-LB', 'DA-ITSI-OS', 'DA-ITSI-STORAGE',
                'DA-ITSI-VIRTUALIZATION', 'DA-ITSI-WEBSERVER', 'SA-IndexCreation', 'SA-ITOA', 'SA-ITSI-ATAD',
                'SA-ITSI-CustomModuleViz', 'SA-ITSI-Licensechecker', 'SA-ITSI-MetricAD', 'SA-UserAccess', 'itsi',
                'Splunk_TA_mint', 'splunk_app_mint', 'Splunk_SA_Scientific_Python_linux_x86',
                'Splunk_SA_Scientific_Python_windows_x86_64', 'Splunk_SA_Scientific_Python_darwin_x86_64',
                'Splunk_SA_Scientific_Python_linux_x86_64', 'SplunkEnterpriseSecuritySuite', 'DA-ESS-AccessProtection',
                'DA-ESS-EndpointProtection', 'DA-ESS-IdentityManagement', 'DA-ESS-NetworkProtection',
                'DA-ESS-ThreatIntelligence', 'SA-AccessProtection', 'SA-AuditAndDataProtection',
                'SA-EndpointProtection', 'SA-IdentityManagement', 'SA-NetworkProtection', 'SA-ThreatIntelligence',
                'SA-UEBA', 'SA-Utils', 'splunk-business-flow', 'splunk_for_vmware', 'SA-VMW-Performance',
                'SA-VMW-LogEventTask', 'SA-VMW-HierarchyInventory', 'SA-Threshold', 'Splunk_DA-ESS_PCICompliance',
                'splunk_app_cloudgateway', 'splunk_app_infrastructure', 'Splunk_TA_opc', 'splunk_app_addon-builder',
                'Splunk_TA_ueba', 'SA-Hydra', 'Splunk_TA_vmware', 'DA-ITSI-CP-aws-dashboards', 'DA-ITSI-CP-unix-dashboards',
                'DA-ITSI-CP-microsoft-exchange', 'DA-ITSI-CP-vmware-dashboards', "timeline_app", "calendar_heatmap_app", "Splunk_TA_cisco-ucs"]

# Scan type constants
TYPE_DEPLOYMENT = "deployment"
TYPE_PARTIAL = "partial"
TYPE_SPLUNKBASE = "splunkbase"
TYPE_PRIVATE = "private"

# App type constants
CONST_SPLUNKBASE = "Splunkbase App"
CONST_SPLUNKSUPPORTED = "Splunk Supported App"
CONST_PRIVATE = "Private App"
CONST_SPLUNKBASE_QUAKE = "Splunkbase-Quake"
CONST_SPLUNKBASE_DUAL = "Splunkbase-Dual"
CONST_SPLUNKBASE_UPDATE = "Splunkbase-Update"
CONST_SPLUNKBASE_NONE = "Splunkbase-None"
CONST_PUBLIC = "Public App"
CONST_SPLUNKBASE_WARN = "Splunkbase-Warning"
CONST_SPLUNKBASE_9_X = "Splunkbase-9-X"

# Compatibility types
CONST_QUAKE = "Quake"
CONST_DUAL = "Dual"
CONST_UPDATE = "Update"
CONST_NONE = "None"
CONST_WARN = "Warn"
CONST_9_X = "9_X"

# Export file formats
FILE_FORMAT_JSON = 'json'
FILE_FORMAT_CSV = 'csv'

# App visibility constants
CONST_ENABLED = "ENABLED"
CONST_PREMIUM = "PREMIUM"
CONST_DISABLED = "DISABLED"
CONST_USER_PERM = "USER_PERM"
CONST_ALL_PERM = "ALL_PERM"

# Scan type constants for Telemetry
TELEMETRY_ALL = "All"
TELEMETRY_CUSTOM = "Custom"
TELEMETRY_SPLUNKBASE = "Splunkbase"
TELEMETRY_PRIVATE = "Private"
TELEMETRY_MANUAL = "Manual"

# Mapping of check name to user-display names
CHECK_NAME_MAPPING = {
    'check_for_existence_of_python_code_block_in_mako_template': 'Python in custom Mako templates',
    'check_for_python_script_existence': 'Python scripts'
}
JQUERY_CHECK_NAME_MAPPING = {
    'check_for_xml_version_existance': 'Splunk dashboard jQuery version check',
    'check_for_jquery_version_existance': 'Splunk jQuery version check',
    'check_for_splunk_web_core_existance': 'Splunk web core check',
    'check_for_splunk_internal_library_existance': 'Splunk internal library check',
    'check_for_hotlinkling_splunk_web_library_existance': 'Splunk hotlinking web library check',
    'check_for_deprecated_html_dashboards': 'Splunk deprecated html dashboards check'
}

# Mapping of check name to required action
CHECK_ACTION_MAPPING = {
    'Python in custom Mako templates': 'Check to ensure that Mako templates are upgraded to be compatible with '
                                       'Python 3.',
    'Python scripts': 'Update these Python scripts to be dual-compatible with Python 2 and 3.'
}

PRIVATE_DETAILS = "This app is not compatible with jQuery 3.5."
PRIVATE_REMEDIATION_MESSAGE = "Update this app or request to uninstall it. If you do nothing, the app will fail in future Splunk upgrades that use jQuery 3.5."
SPLUNKBASE_DETAILS = "This app is not compatible with jQuery 3.5."
SPLUNKBASE_REMEDIATION_MESSAGE = "Do one of the following:Petition the developer to update the app.;"\
                                 "Uninstall the app from the app listing page.;" \
                                 "Take ownership of the app " \
                                 "and override existing code (not recommended)."
SPLUNKBASE_UPDATE_DETAILS = "This app is not compatible with jQuery 3.5. " \
                            "A jQuery 3.5 compatible version of this app is available on Splunkbase."
SPLUNKBASE_UPDATE_DETAILS = "Update this app to the latest version on Splunkbase."

# Column headers for CSV report
CSV_REPORT_HEADERS = ["App Name", "App Status", "Source", "Advanced XML Filepath", "CherryPy Endpoint Filepath",
                      "CherryPy Endpoint Syntax", "Python in Mako Templates Filepath",
                      "Python in Mako Templates Syntax", "Removed Libraries Filepath", "Files Named test.py Filepath",
                      "Splunk Web Legacy Mode Filepath", "Other Python Scripts Filepath",
                      "Other Python Scripts Syntax"]

# Python Toggle API Responses
pt_invalid_python_version = "INVALID_PYTHON_VERSION"
pt_python_version_not_found = "PYTHON_VERSION_NOT_FOUND"
pt_invalid_instance = "INVALID_INSTANCE"
pt_invalid_transition = "INVALID_TRANSITION"
pt_other = "OTHER"

# Python Toogle API Responses Dictionary
PT_API_RESPONSES = {
    pt_invalid_python_version : "Could not get Python Version. Please try after sometime.",
    pt_python_version_not_found : "Python Version is invalid. Please try after sometime.",
    pt_invalid_instance : "Setting the default Python version in the UI is only supported on Splunk Cloud. To change the default Python version, edit each instance's server.conf file.",
    pt_invalid_transition : "This Transition is not allowed.",
    pt_other : "Something went wrong. Please try after sometime."
}

# App Inspect checks result
AI_RESULT_SUCCESS = "success"
AI_RESULT_FAILURE = "failure"
AI_RESULT_ERROR = "error"
AI_RESULT_SKIPPED = "skipped"
AI_RESULT_NA = "not_applicable"
AI_RESULT_MANUAL = "manual_check"
AI_RESULT_WARNING = "warning"

# Constant values for checks
CHECK_CONST_NAME = "check_for_python_script_existence"
CHECK_CONST_PASSED = "PASSED"
CHECK_CONST_BLOCKER = "BLOCKER"
CHECK_CONST_WARNING = "WARNING"
CHECK_CONST_SKIPPED = "SKIPPED"
CHECK_CONST_UNKNOWN = "UNKNOWN"
CHECK_CONST_DISMISSED = "DISMISSED"

CHECK_CONST_DESCRIPTION = "Check for the existence of Python scripts, which must be upgraded to be "\
                          "cross-compatible with Python 2 and 3 for the upcoming Splunk Enterprise Python 3 release. "
CHECK_CONST_NOT_APPLICABLE = "N/A"
CHECK_CONST_PYCHECK_MESSAGE = "The file at path {} needs to be checked for Splunk Python 3 migration"

CHECK_CONST_PASSED_MSG = "None"
CHECK_CONST_SKIPPED_MSG = "The Splunk Platform Upgrade Readiness App could not run this check. "\
                          "See the documentation for instructions on how to check the app manually."

# Progress values
PROGRESS_INIT = "INIT"
PROGRESS_NEW = "NEW"
PROGRESS_INPROGRESS = "IN_PROGRESS"
PROGRESS_COMPLETE = "COMPLETE"
PROGRESS_ERROR = "ERROR"
PROGRESS_CANCELLED = "CANCELLED"

# Messages for response
MESSAGE_EXCEPTION_READ_USER_RECORD = "Exception occurred while fetching user records for {} on {}"
MESSAGE_USER_RECORD_REQUEST_TYPE = "Request type not found in body of request."
MESSAGE_EXCEPTION_WRITE_USER_RECORD= "Exception occurred while inserting user record for {} on {}"
MESSAGE_ERROR_WRITE_USER_RECORD = "Error occurred while inserting user record for {} on {}"
MESSAGE_ERROR_READ_USER_RECORD = "Error occurred while fetching user record for {} on {}"
PYTHON2 = "Python2"
PYTHON3 = "Python3"
FORCE_PYTHON3 = "Force Python3"
PYTHON2_DESCRIPTION = "Request to retract back to Python 2."
PYTHON3_DESCRIPTION = "Request to upgrade to Python 3."
FORCE_PYTHON3_DESCRIPTION = "Request to force Python 3."
SEARCH_HEAD_HOSTNAME = "sh"
FEDERAL_GOV_HOST = "splunkcloudgc.com"
STG_HOST = "stg.splunkcloud.com"
DEV_HOST = "splunkworks.lol"
PROD_HOST = "splunkcloud.com"
CLUSTER_MASTER_HOSTNAME = "c0m1"        
MESSAGE_NO_PATH_PROVIDED = "No path was provided"
MESSAGE_PATH_NOT_FOUND = "Path was not found"
MESSAGE_FAILED_HANDLE_REQUEST = "Failed to handle request due to an unhandled exception"
MESSAGE_NO_ENTRY_FOUND = "No entry found"
MESSAGE_NO_REQUEST_BODY = "No request body found"
MESSAGE_NO_EMAIL_SUBJECT = "No email subject found"
MESSAGE_EMPTY_ACTION = "Action is empty."
MESSAGE_INVALID_ACTION = "Invalid action."
MESSAGE_NOT_ALLOWED_OPERATION = "Operation is not allowed."
MESSAGE_NOT_VALID_VERSION = "Python version is not proper."
MESSAGE_FAILED_TO_GET_PYTHON_VERSION = "Failed to get python version from server.conf file"
MESSAGE_NO_EMAIL_RECEIVER = "No email receipient found"
MESSAGE_NO_EMAIL_BODY = "No email body found"
MESSAGE_SEND_EMAIL = "Email sent"
MESSAGE_NO_REMOTE_HOST = "No remote host found"
MESSAGE_POST_SCHEDULE_SCAN = "Schedule scan details saved for user: {} on host: {}. It will be reflected after 2 hours."
MESSAGE_SCAN_CALLED = "Scan Called"
MESSAGE_CHECK_EXISTING_SCAN = "Checking for existing scan"
MESSAGE_NO_EXISTING_SCAN = "No existing scan"
MESSAGE_RETRIEVING_REMOVAL_KEY = "Retrieving key to remove entry"
MESSAGE_FOUND_COMPLETED_KEY = "Found key for completed entry: {}"
MESSAGE_REMOVING_ENTRIES = "Removing existing entries before starting new scan"
MESSAGE_ENTRY_REMOVED = "Entry with key: {} removed"
MESSAGE_ALL_ENTRIES_REMOVED = "All Entries removed"
MESSAGE_SCAN_SUCCESS = "Deployment scanned successfully for user: {}"
MESSAGE_CANCEL_SCAN_SUCCESS = "Scan for user: {} on host: {} cancelled successfully"
MESSAGE_SCAN_CANCELLED = "Cancelled scan for user: {} on host: {}. Please refresh and start again."
MESSAGE_PREVIOUS_RESULTS = "Scan for user: {} on host: {} has been cancelled. Showing last scan results."
MESSAGE_SCANNING_APP = "{} apps out of {} scanned. Scanning App: {}"
MESSAGE_DISMISS_ENTRY_SUCCESS = "File: {} for check: {} for app: {} successfully registered for dismissing for "\
                                "user: {} on host: {}. The fresh scan results would skip this file."
MESSAGE_NO_SCAN_RESULTS = "Starting a new scan"
MESSAGE_SCAN_IN_PROGRESS = "An existing scan is already in progress for user: {} on host:{}"
MESSAGE_TOTAL_APPS_FOUND = "Total {} apps found for user: {}"
MESSAGE_NO_APPS_FOUND = "No apps found for user: {}"
MESSAGE_REMOTE_NOT_FOUND = "Remote directory not found."
MESSAGE_REMOTE_REPORT_NOT_FOUND = "Remote host report not found."
MESSAGE_NO_SPLUNKBASE_APPS_FOUND = "No splunkbase apps found for user: {}"
MESSAGE_NO_PRIVATE_APPS_FOUND = "No private apps found for user: {}"
MESSAGE_EXCEPTION_REST_CALL = "Could not make request to Splunk: {}"
MESSAGE_ERROR_REMOVE_ENTRY = "Error while removing entry for user: {} on host: {}"
MESSAGE_ERROR_EXPORT_REPORT = "Error retrieving scan results for id: {}"
MESSAGE_ERROR_NO_SCAN_ID = "No scan id found. Please select a valid scan report to get results."
MESSAGE_INVALID_FILE_FORMAT = "Invalid file format. Please provide json or csv."
MESSAGE_ERROR_NO_SCAN_TYPE = "No scan type found. Please select a valid scan type."
MESSAGE_INVALID_SCAN_TYPE = "Invalid scan type. Please provide a valid scan type."
MESSAGE_ERROR_FETCHING_APPS = "Error fetching apps for user: {}"
MESSAGE_ERROR_FETCHING_ROLES = "Error fetching roles for user: {}"
MESSAGE_ERROR_READING_PROGRESS = "Error reading progress for user: {} on host: {}"
MESSAGE_ERROR_WRITING_PROGRESS = "Error writing progress for user: {} on host: {}"
MESSAGE_ERROR_CANCEL_SCAN = "Error while cancelling scan for user: {} on host: {}"
MESSAGE_EXCEPTION_THREAD = "Exception while starting the scan process. Please refresh the page and restart the scan."
MESSAGE_ERROR_THREAD = "Error while starting the scan process. Please refresh the page and restart the scan."
MESSAGE_ERROR_READING_SCAN_STATUS = "Error while reading existing scan for user: {} on host:{}"
MESSAGE_EXCEPTION_SCAN_STATUS = "Exception while checking scan status for user: {} on host:{}"
MESSAGE_EXCEPTION_APPLIST = "Exception while loading app list for user: {}"
MESSAGE_EXCEPTION_SCAN_DEPLOYMENT = "Exception while scanning the deployment"
MESSAGE_EXCEPTION_ROLELIST = "Exception while loading role list for user: {}"
MESSAGE_EXCEPTION_WRITE_FILE_STORE = "Could not fetch file store details while writing progress for user: {} on host: {}"
MESSAGE_EXCEPTION_READ_FILE_STORE = "Could not fetch file store details while reading progress for user: {} on host: {}"
MESSAGE_EXCEPTION_DELETE_FILE_STORE = "Could not fetch file store details while cancelling scan for user: {} on host: {}"
MESSAGE_DISMISS_APP_READ_ERROR = "Unable to get app name from request. Please try again."
MESSAGE_DISMISS_CHECK_READ_ERROR = "Unable to get check name from request. Please try again."
MESSAGE_DISMISS_FILEPATH_READ_ERROR = "Unable to get file path from request. Please try again."
MESSAGE_DISMISS_ERROR_FILE_READ = "Unable to fetch existing scan results. Given file entry might reflect in results."
MESSAGE_DISMISS_ERROR_FILE_WRITE = "Cannot update results. Given file entry might reflect in results."
MESSAGE_ERROR_WRITING_DISMISS_ENTRY = "Error writing dismiss file entry for user: {} on host: {}"
MESSAGE_EXCEPTION_WRITING_DISMISS_ENTRY = "Exception while writing dismiss file entry for user: {} on host: {}"
MESSAGE_ERROR_FETCHING_DISMISS_ENTRY = "Error fetching dismiss file entry for user: {} on host: {} for app: {}"
MESSAGE_EXCEPTION_FETCHING_DISMISS_ENTRY = "Exception while fetching dismiss file entry for user: {} on host: {} "\
                                           "for app: {}"
MESSAGE_EXCEPTION_MAKO_FILE_CREATION = "Exception parsing files for Mako templates"
MESSAGE_EXCEPTION_MAKO_FILE_WRITE = "Exception while updating results for Mako templates"
MESSAGE_EXCEPTION_MAKO_FILE_DELETE = "Exception while fetching Mako templates"
MESSAGE_UNAUTHORIZED_SCAN_TERMINATION = "The scan terminated unexpectedly. Please verify the session timeout value "\
                                        "for the user and increase it or rerun the scan with fewer apps."
MESSAGE_UNAUTHORIZED_FILE_STORE = "Exception occurred due to invalid permission in reaching file store. Please verify "\
                                "the session timeout value for the user and increase it or rerun the scan with "\
                                "fewer apps."
MESSAGE_ERROR_CREATING_SESSION_FILE = "Failed to create file for the terminated scan for user: {} on host: {}"
MESSAGE_MAKO_FILE_LINE_NO = "Line number should be a natural number and not conflicting."
MESSAGE_SESSION_FILE_EXISTS = "File at path: {} exists. Exiting scan and returning results"
MESSAGE_ERROR_REMOVING_SESSION_FILE = "Encountered error while removing session file: {}"

MESSAGE_DISMISS_APP_PATH_READ_ERROR = "Unable to get app path from request. Please try again."
MESSAGE_DISMISS_APP_ERROR_APP_READ = "Unable to fetch existing scan results. Given app entry might reflect in results."
MESSAGE_DISMISS_APP_ERROR_FILE_WRITE = "Cannot update results. Given application dismiss app entry might reflect in results."
MESSAGE_EXCEPTION_WRITING_DISMISS_APP_ENTRY = "Exception while writing application dismiss app entry for user: {} on host: {}"
MESSAGE_ERROR_WRITING_DISMISS_APP_ENTRY = "Error writing application dismiss app entry for user: {} on host: {}"

MESSAGE_ERROR_FETCHING_DISMISS_APP_ENTRY = "Error fetching application dismiss app entry for user: {} on host: {} for app: {}"
MESSAGE_CHECKSUM_ERROR_FILE_READ = "Unable to fetch existing scan results. The {} app folder will be rescanned."
MESSAGE_DISMISS_APP_ENTRY_SUCCESS = "App: {} successfully registered for dismissing the app for "\
                                "user: {} on host: {}. The periodic notification would skip this dismissed app."
MESSAGE_EXCEPTION_SEND_EMAIL = "Unable to send email: {}"
MESSAGE_ERROR_SEND_EMAIL = "Unable to send email"
MESSAGE_ERROR_GET_REPORT = "Unable to find the latest scan report"
MESSAGE_EXCEPTION_GET_REPORT = "Exception while fetching the latest scan report: {}"
MESSAGE_EXCEPTION_GET_EMAIL_CONFIGURATIONS = "Exception while fetching the email configurations: {}"
MESSAGE_EXCEPTION_GET_APP_REPORT = "Unable to find app: {} in latest report"
MESSAGE_ERROR_GET_EMAIL_CONFIGURATIONS = "Unable to get email configurations"
MESSAGE_ERROR_GET_SCHEDULE_SCAN = "Unable to get schedule scan details"
MESSAGE_ERROR_POST_SCHEDULE_SCAN = "Unable to save schedule scan details"
MESSAGE_EXCEPTION_GET_SCHEDULE_SCAN = "Exception while getting schedule scan details: {}"
MESSAGE_EXCEPTION_READ_SCHEDULE_SCAN_DETAILS = "Could not fetch file store details while reading schedule scan deatils for user: {} on host: {}"
MESSAGE_EXCEPTION_WRITE_SCHEDULE_SCAN_DETAILS = "Could not fetch file store details while writing schedule scan deatils for user: {} on host: {}"
MESSAGE_ERROR_WRITE_SCHEDULE_SCAN_DETAILS = "Error writing schedule scan details for user: {} on host: {}"
MESSAGE_ERROR_READ_SCHEDULE_SCAN_DETAILS = "Error reading schedule scan details for user: {} on host: {}"
MESSAGE_INVALID_DAY = "Invalid day value"
MESSAGE_INVALID_HOURS = "Invalid hours value"
MESSAGE_INVALID_MINUTES = "Invalid minutes value"
MESSAGE_INVALID_AM_PM = "Invalid value for am_pm"
MESSAGE_INVALID_SCHEDULE_SCAN_TYPE = "Invalid value for schedule scan type"
MESSAGE_EXCEPTION_CRON_TIME_FORMAT = "Exception while creating cron time format: {}"
MESSAGE_EXCEPTION_SCHEDULE_SCAN_INTERVAL = "Exception while saving schedule scan interval for user: {} on host: {}"
MESSAGE_ERROR_SCHEDULE_SCAN_INTERVAL = "Unable to save schedule scan interval for user: {} on host: {}"
MESSAGE_ERROR_REPORT_PATH_NOT_PRESENT = "Report path is not present"
MESSAGE_EXCEPTION_CLEAR_PASSWORD = "Exception while getting the clear password: {}"
MESSAGE_INVALID_TIMEZONE_OFFSET = "Invalid time zone offset"

MESSAGE_EXCEPTION_FETCHING_DISMISS_APP_ENTRY = 'Exception fetching application dismiss app entry for user: {} on host: {} for app: {}'
MESSAGE_EXCEPTION_GET_CREDENTIALS = "Exception while getting credentials: {}"
MESSAGE_ERROR_VERSION_INFO_NOT_FOUND = "Did not find version information"
MESSAGE_ERROR_LATEST_REPORT_NOT_FOUND = "Unable to find the latest report."
MESSAGE_ERROR_LATEST_REPORT = "Exception while fetching the latest scan report."
MESSAGE_ERROR_FETCHING_LATEST_REPORT = "Exception while fetching the latest scan report status code: {} content: {}"
FILEPATH_NOT_FOUND = "Filepath {} not present."
MESSAGE_ERROR_REMOTE_EXPORT_APP_REPORT_= "App {} not found for host {}"
MESSAGE_ERROR_REMOTE_EXPORT_REPORT = "Cannot export results for host {}"
MESSAGE_EXCEPTION_SCAN_OPERATIONS = "Exception in scan operations: {}"
MESSAGE_ERROR_SCAN_OPERATIONS = "Unable to perform scan operations."
MESSAGE_ERROR_REMOTE_SCAN = "Unable to trigger remote scan."
MESSAGE_EXCEPTION_REMOTE_SCAN = "Exception in remote scan: {}"
MESSAGE_ERROR_REMOTE_SCAN_READ_PROGRESS = "Unable to read progress for remote."
MESSAGE_EXCEPTION_REMOTE_SCAN_READ_PROGRESS = "Exception while reading progress on remote: {}"
MESSAGE_ERROR_REMOTE_SCAN_CANCEL_SCAN = "Unable to cancel scan for remote."
MESSAGE_EXCEPTION_REMOTE_SCAN_CANCEL_SCAN = "Exception while cancel scan on remote: {}"
MESSAGE_EXCEPTION_REMOTE_SCAN_STORE = "Exception occurred in fetching remote scan list on host {} by user {}"
MESSAGE_ERROR_REMOTE_SCAN_STORE = "Remote scan list was not fetched successfully on host {} by user {}"
MESSAGE_SCAN_ALREADY_CANCELLED = "Scan is already cancelled."
MESSAGE_EXCEPTION_WRITING_REMOTE_DISMISS_APP_ENTRY = "Exception while writing application dismiss app entry on host: {}"
MESSAGE_ERROR_WRITING_REMOTE_DISMISS_APP_ENTRY = "Error writing application dismiss app entry on host: {}"
MESSAGE_REMOTE_DISMISS_APP_ENTRY_SUCCESS = "App: {} successfully registered for dismissing the app "\
                                "on host: {}. The periodic notification would skip this dismissed app."
MESSAGE_DISMISS_REMOTE_HOST_READ_ERROR = "Unable to get remote host from request. Please try again."
MESSAGE_EXCEPTION_WRITING_REMOTE_DISMISS_ENTRY = "Exception while writing dismiss file entry on host: {}"
MESSAGE_ERROR_WRITING_REMOTE_DISMISS_ENTRY = "Error writing dismiss file entry on host: {}"
MESSAGE_REMOTE_DISMISS_ENTRY_SUCCESS = "File: {} for check: {} for app: {} successfully registered for dismissing "\
                                "on host: {}. The fresh scan results would skip this file."
MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_READ = "Error while reading remote schedule scan details for user {} on host {}"
MESSAGE_EXCEPTION_REMOTE_SCHEDULE_SCAN_READ = "Exception occurred while reading remote schedule scan details for user {} on host {} exception {}"
MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_UPDATE = "Error while updating remote schedule scan details for remote for user {} on host {}"
MESSAGE_EXCEPTION_REMOTE_SCHEDULE_SCAN_UPDATE = "Exception occurred while reading remote schedule scan details for user {} on host {} exception {}"
MESSAGE_SUCCESS_REMOTE_SCHEDULE_SCAN_UPDATE = "Successfully updated the remote schedule scan details for user {} on host {}. It will be reflected after 2 hours."
MESSAGE_EXCEPTION_KVSTORE_DETAILS_WRITE = "Exception occurred while writing to kvstore on host {} exception {}"
MESSAGE_ERROR_KVSTORE_DETAILS_WRITE = "Error occurred while writing to kvstore on host {}"
MESSAGE_REMOTE_SCAN_SUCCESS = "Remote scan details successfully for user: {}"
MESSAGE_DISMISS_INSTANCE_READ_ERROR = "Unable to get instance from request. Please try again."
MESSAGE_SKIP_DISMISS_APPS = "Skipping to filter the dismissed apps as some error occurred while filtering them."
MESSAGE_SKIP_DISMISS_FILES = "Skipping to filter the dismissed file as some error occurred while filtering them."
MESSAGE_POST_MANAGE_SCAN_SCHEDULE = "Schedule scan details saved for user: {} on host: {}"
MESSAGE_VERSION_NOT_SET = "Add a version attribute in the root node of your Simple XML dashboard {} inside the default folder to '<dashboard version=\"1.1\">' OR '<form version=\"1.1\">'. "\
                          "Lower dashboard versions introduce vulnerabilities into your apps and are not permitted in Splunk Cloud Platform."\
                          "Note: The above mentioned changes must happen in the default folder, and those changes must come by uploading a new TARBAL."
MESSAGE_VERSION_LESS = "Version attribute of the dashboard {} is set to {}. Change the version attribute in the root node of your Simple XML dashboard inside the default folder to '<dashboard version=\"1.1\">' OR '<form version=\"1.1\">'. "\
                       "Other dashboard versions introduce vulnerabilities into your apps and are not permitted in Splunk Cloud Platform."\
                       "Note: The above mentioned changes must happen in the default folder, and those changes must come by uploading a new TARBAL."
MESSAGE_JQUERY_VERSION_LESS = "The jQuery {} shipped along with your application introduces vulnerabilities into your application. "\
                              " Splunk apps must use jQuery version 3.5 or higher. Lower versions are no longer permitted in Splunk Cloud Platform."
MESSAGE_INTERNAL_LIBARY_REMEDIATION = "This {} is importing the following dependencies which are not supported or "\
                                      "externally documented by Splunk. {}"
MESSAGE_ERROR_GETTING_SERVER_INFO = "Error occurred while getting server info"
MESSAGE_ERROR_KVSTORE_WRITE = "Error occurred while writing to kvstore for endpoint: {} for user: {} on host: {}"
MESSAGE_EXCEPTION_KVSTORE_WRITE = "Exception occurred while writing to kvstore for endpoint: {} for user: {} on host: {} exception: {}"
MESSAGE_ERROR_KVSTORE_READ = "Error occurred while reading from kvstore for endpoint: {} for user: {} on host: {}"
MESSAGE_EXCEPTION_KVSTORE_READ = "Exception occurred while reading from kvstore for endpoint: {} for user: {} on host: {} exception: {}"
MESSAGE_SUCCESS_EMAIL_SWITCH_UPDATE = "Successfully updated the email notification preferences for user: {} on host {}."
MESSAGE_ERROR_EMAIL_SWITCH_READ = "Error occurred while fetching email switch details from kvstore for user: {} on host: {}."
MESSAGE_ERROR_EMAIL_SWITCH_UPDATE = "Error occurred while updating email switch details to kvstore for user: {} on host: {}."
MESSAGE_ERROR_SCRIPTED_INPUT_WRITE = "Error occurred while writing to scripted input for endpoint: {} for user: {} on host: {}"
MESSAGE_EXCEPTION_SCRIPTED_INPUT_WRITE = "Exception occurred while writing to scripted input for endpoint: {} for user: {} on host: {} exception: {}"
MESSAGE_HOTLINKING_WEB_LIBRARY_REMEDIATION = "This {} is importing the following dependencies which are not supported or "\
                                      "externally documented by Splunk. {}"
FAIL_HTML_DASHBOARD_MESSAGE = (
        "Your app includes HTML dashboard files in the data/ui/html directory, "
        "which must be removed. For more information about updating dashboards, see "
        "https://dev.splunk.com/enterprise/docs/developapps/visualizedata/updatejquery/"
    )
MESSAGE_EXCEPTION_FETCHING_CLOUD_INSTANCE_TYPE = "Exception occured while fetching the cloud"\
                                                 " instance type. {}"
MESSAGE_DISMISS_SYSTEM_CHECK_READ_ERROR = "Unable to get check name from request. Please try again."
MESSAGE_EXCEPTION_WRITING_REMOTE_DISMISS_SYSTEM_CHECK_ENTRY = "Exception while writing dimiss system check entry on host: {}"
MESSAGE_ERROR_WRITING_REMOTE_DISMISS_SYSTEM_CHECK_ENTRY = "Error writing writing dimiss system check entry on host: {}"
MESSAGE_REMOTE_DISMISS_SYSTEM_CHECK_ENTRY_SUCCESS = "Check: {} successfully registered for dismissing "\
                                "on host: {}. The periodic notification would skip this dismissed system check."
MESSAGE_SKIP_DISMISS_SYSTEM_CHECK = "Skipping to filter the system checks as some error occurred while filtering them."
MESSAGE_CANNOT_START_SCAN_CLOUD = "Skipping to start scan as the instance is a cloud instance."

