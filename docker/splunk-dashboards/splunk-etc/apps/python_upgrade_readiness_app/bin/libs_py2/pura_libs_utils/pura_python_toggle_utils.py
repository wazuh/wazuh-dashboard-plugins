from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from splunk.clilib import cli_common as cli
import json
import pura_logger_manager as logger_manager
from pura_send_email import ( get_credentials, get_smtp_details, send_email, get_clear_password)
import copy

MESSAGE_EXCEPTION_REST_CALL = "Could not make request to Splunk: {}"

logging = logger_manager.setup_logging('pura_python_toggle_utils')

class HostNotFound(Exception):
    pass

def splunk_connect(session_key):
    '''
    Create connection to splunk using session key.
    
    :return service (Connection client) or exception 
    '''
    logging.info("Initiating contact with splunk")

    try:
        service = utils.get_connection_object(session_key, owner="nobody")
        logging.info("Connecting to splunk please wait")
        return service
    except Exception as e:
        logging.error(e)
        return e

def splunk_push(session_key, event, sourcetype):
    '''
    Pushes events to splunk indexer.

    :params: event: Data to be pushed to indexer.
    :params: sourcetype: Source type of the _audit. Value can either be python_upgrade_readiness_app or jQuery_upgrade_readiness_app
    :returns: True/False based on event pushed to indexer successfully or not.
    '''
    service = splunk_connect(session_key)
    target = service.indexes["_audit"]
    sourcetype = sourcetype
    source = "upgrade_readiness_app"
    eventjson = json.dumps(event)
    try:
        target.submit(event=eventjson, source=source, sourcetype=sourcetype)
        logging.info("Pushed event to target")
        return True
    except Exception as e:
        logging.error(e)
        return False

def get_current_python_version():
    try:
        version = cli.getConfKeyValue('server', 'general', 'python.version')
        return version
    except Exception as e:
        logging.critical(e)
    return ""

def get_server_info(session_key):
    """
    Get the Host of the instance
    """
    try:
        service = splunk_connect(session_key)
        # get the host name of local
        server_info = utils.get_local_host_details(service)
        return server_info
    except Exception as e:
        logging.exception(str(e))

    return []

def get_host(session_key):
    """
    Get the Host of the instance
    """
    server_info = get_server_info(session_key)
    host = None
    for item in server_info:
        content = dict(item)
        host = content.get('splunk_server')
    return host

def check_version_contains_four_digits(session_key):
    """
    Check if there are four digits after second dot to verify instance is cloud or not.
    """
    version = None
    server_info = get_server_info(session_key)
    for item in server_info:
        content = dict(item)
        version = content.get("version")
    if not version:
        return False
    version = str(version)
    splitted_version = version.split(".")
    return len(splitted_version) >= 3 and len(splitted_version[2]) == 4


def check_instance_is_cloud_version(session_key):
    """
    Check whether the instance is cloud or not
    """
    server_info = get_server_info(session_key)
    check_version = check_version_contains_four_digits(session_key)
    instance_type = None
    for item in server_info:
        content = dict(item)
        instance_type = content.get('instance_type')
    return (instance_type and instance_type.lower() == "cloud") or check_version


def check_host_is_search_head(session_key):
    """
    Checking the host name whether its Search Head
    """
    if not check_instance_is_cloud_version(session_key):
        return False
    host = get_host(session_key)
    if not host:
        raise HostNotFound("Host not found")
    host = str(host).lower()
    is_host_search_head = SEARCH_HEAD_HOSTNAME in host[:2]
    is_host_search_head = (is_host_search_head) and ((host.endswith(FEDERAL_GOV_HOST) or host.endswith(STG_HOST) or host.endswith(DEV_HOST) or host.endswith(PROD_HOST)))
    return is_host_search_head


def check_host_is_not_shc_member(session_key):
    """
    Check whether host is shc_member or not.
    """
    service = splunk_connect(session_key)
    # get the host name of local
    oneshot_str = "| rest splunk_server=local services/server/roles"
    local_host = utils.one_shot_str_wrapper(oneshot_str, service)
    is_not_shc_member = False
    for item in local_host:
        content = dict(item)
        role_list = content.get("role_list")
        is_not_shc_member = "shc_member" not in role_list
    return is_not_shc_member


def fetch_user_records_from_collection(session_key, user, host):
    """
    Fetch user records from kvstore collection and return.

    :returns: user_records if api call is successful otherwise error message.
    """
    try:
        response, records = sr.simpleRequest(user_records_endpoint, sessionKey=session_key, method='GET',raiseAllErrors=True)
        records = records.decode('utf-8')
        records = json.loads(records)
        
    except Exception:
        logging.exception(MESSAGE_EXCEPTION_READ_USER_RECORD.format(user, host))
        return None

    if response.get('status') not in success_codes:
        logging.error(MESSAGE_ERROR_READ_USER_RECORD.format(user, host))
        return None
    return records


def render_error_json_with_type(error_type=pt_other, message=None, response_code=500, include_headers=True):
    """
    Render an error to be returned to the client.

    :param message: Error message to be displayed
    :param response_code: Status code for response

    :return JSON response containing payload and status
    """

    data = {
        'success': False,
        'error_type' : error_type,
        'message': message if message and len(message.strip()) > 0 else PT_API_RESPONSES[error_type]
    }
    return_value = {
        'payload': json.dumps(data),
        'status': response_code
        }
    if include_headers:
        return_value['headers']= {
            'Content-Type': 'application/json'
        }
    return return_value


def get_all_sc_admins(session_key):
    """
    Get All SC_ADMINS
    :param session_key: Session key of the logged in user

    :return sc_admin list
    """
    try:
        logging.info("Getting all sc_admins")
        try:
            response, content = sr.simpleRequest('{}?output_mode=json&count=0'.format(user_role_endpoint), sessionKey=session_key)
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_REST_CALL.format(str(e)))
            return []

        if response['status'] not in success_codes:
            logging.error("Error fetching sc_admins {}".format(response))
            return []
        content_json = json.loads(content)
        sc_admin_list = []
        for user in content_json.get("entry", []):
            user_content = user.get("content", {})
            user_roles = user_content.get("roles", [])
            if "sc_admin" in user_roles:
                sc_admin_list.append(user_content["email"])
        return sc_admin_list
    except Exception as e:
        logging.exception("Exception while fetching the sc_admin list {}".format(str(e)))
        return []


def send_mail_to_all_sc_admins(session_key, email_body_text, email_subject, email_body_type = "plain"):
    """
    Send mail to all sc_admins

    :param session_key: Session Key of the logged in user
    """
    sc_admins = get_all_sc_admins(session_key)
    if not sc_admins:
        return False, "Not found any sc_admin"

    logging.info("Sending mail to all sc_admins")
    server_info = get_server_info(session_key)
    splunk_version = ""
    for item in server_info:
        content = dict(item)
        splunk_version = content.get("generator", {}).get("version", "")

    email_configurations = get_smtp_details(session_key=session_key)
    if not email_configurations:
        return False, "Email configurations not found."

    if not email_configurations.get("clear_password"):
        email_configurations["clear_password"] = ""
    user_credentials = {}
    if splunk_version == "8.1.0":
        user_credentials = get_credentials(session_key=session_key)
        if not user_credentials:
            return False, "User Credentials not found."
        user_credentials = user_credentials["entry"][0]["content"]
    else:
        user_credentials = copy.deepcopy(email_configurations)

    actual_clear_password = user_credentials.get("clear_password", "")
    if (user_credentials.get("clear_password", "")):
        # If clear_password is present then decrypt it
        clear_password = get_clear_password(user_credentials=user_credentials)
        if clear_password:
            # if clear_password is an non empty string
            logging.info("Using decrypted value of clear password")
            user_credentials["clear_password"] = clear_password
        else:
            # if clear_password is empty string or some exception was raised after decryption using the original value
            logging.info("Using original value of clear password")

    is_email = send_email(email_configurations=email_configurations, user_credentials=user_credentials, session_key=session_key, receiver_list=sc_admins, email_body=email_body_text, email_subject=email_subject, email_body_type=email_body_type)
    if is_email is None or not is_email:
        logging.info("Using original value of clear password as got authentication error while using decrypted password.")
        user_credentials["clear_password"] = actual_clear_password
        is_email_sent = send_email(email_configurations=email_configurations, user_credentials=user_credentials,
            session_key=session_key, receiver_list=sc_admins, email_body=email_body_text, email_subject=email_subject, email_body_type=email_body_type)
        if not is_email_sent: 
            return False, "Unknown Reason"
    
    return True, "Mail sent to all sc_admins"
