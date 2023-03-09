import os
import re
import sys
import json
import socket
import smtplib
import sys

import splunk.rest as sr
import splunk.entity as entity
from splunk.util import normalizeBoolean
import splunk.secure_smtplib as secure_smtplib
import splunk.ssl_context as ssl_context
import copy

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from builtins import str
import pura_python_toggle_utils as toggle_utils

logging = logger_manager.setup_logging('eura_send_email')

CHARSET = "UTF-8"

def get_smtp_details(session_key):
    """
    Get the email configurations done by the user
    :param session_key: Session key of the logged in user

    :return Email configurations of the user
    """
    try:
        logging.info("Getting smtp details")
        entity_details = entity.getEntity(alert_actions_endpoint, "email", namespace=None, owner="nobody",
                                          sessionKey=session_key)
        return entity_details
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_GET_EMAIL_CONFIGURATIONS.format(str(e)))
    return None

def send_email(email_configurations, user_credentials, session_key, receiver_list, email_body, email_subject=EMERALD_SUBJECT, email_body_type="plain", is_email_to_be_bcced=False):
    """
    Send the email.
    :param email_configuration: Configurations of the email for eg. use_ssl, use_tls etc
    :param user_credentials: Credentials of the user
    :param session_key: Session key of the logged in user
    :param receiver_list: List of receivers
    :param email_body: Body of the email to be sent
    :param is_email_to_be_bcced: Whether the emails sent are to be sent in bcc to all the receivers

    :return Whether the email was sent or not
    """
    try:
        from email.mime.multipart import MIMEMultipart
        from email.header import Header
        from email.mime.application import MIMEApplication
        from email.mime.text import MIMEText

        logging.info("Sending email")
        use_ssl = email_configurations.get("use_ssl")
        use_ssl = normalizeBoolean(use_ssl)
        use_tls = email_configurations.get("use_tls")
        use_tls = normalizeBoolean(use_tls)
        server = email_configurations.get("mailserver", "localhost")
        username = user_credentials.get("auth_username", "")
        password = user_credentials.get("clear_password", "")
        sender = email_configurations.get("from")

        if username is None:
            username = ""

        email = MIMEMultipart()
        if not is_email_to_be_bcced:
            email["To"] = ", ".join(receiver_list)
        email['Subject'] = Header(email_subject, CHARSET)

        if not sender:
            sender = "splunk"
        # make sure the sender is a valid email address
        if sender.find("@") == -1:
            sender = sender + '@' + socket.gethostname()
            if sender.endswith("@"):
                sender = sender + 'localhost'
        email["From"] = sender

        if use_ssl or use_tls:
            # setup the Open SSL Context
            ssl_helper = ssl_context.SSLHelper()
            server_conf_json = ssl_helper.getServerSettings(session_key)
            ctx = ssl_helper.createSSLContextFromSettings(
                sslConfJSON=email_configurations,
                serverConfJSON=server_conf_json,
                isClientContext=True)

        # send the mail
        if not use_ssl:
            smtp = secure_smtplib.SecureSMTP(host=server)
        else:
            smtp = secure_smtplib.SecureSMTP_SSL(host=server, sslContext=ctx)

        if use_tls:
            smtp.starttls(ctx)
        if len(username) > 0 and password is not None and len(password) > 0:
            smtp.login(username, password)

        body = MIMEText(email_body, email_body_type)
        email.attach(body)
        smtp.sendmail(sender, receiver_list, email.as_string())
        smtp.quit()
        return True
    except smtplib.SMTPAuthenticationError as e:
        logging.error(MESSAGE_EXCEPTION_SEND_EMAIL.format(str(e)))
        return None
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_SEND_EMAIL.format(str(e)))
    return False

def get_credentials(session_key):
    """
    Get the credentials of the user
    :param session_key: Session key of the logged in user

    :return User credentials
    """
    try:
        uri = 'admin/alert_actions/email'
        response, content = sr.simpleRequest(uri, method='POST', postargs={'show_password': True, 'output_mode': 'json'}, sessionKey=session_key)

        # invalid server response status check
        if response['status']!='200':
            logging.error('get_credentials - unable to retrieve credentials; check simpleRequest response')
            return {}
        content_json = json.loads(content)
        return content_json
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_GET_CREDENTIALS.format(str(e)))

    return {}

def get_clear_password(user_credentials):
    """
    Decrypt the clear_password field in email configurations

    :param user_credentials: Configurations of the email

    :return Decrypted clear_password
    """
    try:
        encrypted_password = user_credentials.get("clear_password", "")
        splunkhome = os.environ.get('SPLUNK_HOME')
        if splunkhome == None:
            logging.error('get_clear_password - unable to retrieve credentials; SPLUNK_HOME not set')
            return None
        #if splunk home has white spaces in path
        splunkhome='\"' + splunkhome + '\"'
        if sys.platform == "win32":
            encr_passwd_env = "\"set \"ENCRYPTED_PASSWORD=" + encrypted_password + "\" "
            commandparams = ["cmd", "/C", encr_passwd_env, "&&", os.path.join(splunkhome, "bin", "splunk"), "show-decrypted", "--value", "\"\"\""]
        else:
            encr_passwd_env = "ENCRYPTED_PASSWORD='" + encrypted_password + "'"
            commandparams = [encr_passwd_env, os.path.join(splunkhome, "bin", "splunk"), "show-decrypted", "--value", "''"]
        command = ' '.join(commandparams)
        stream = os.popen(command)
        clear_password = stream.read()
        #the decrypted password is appended with a '\n'
        if len(clear_password) >= 1:
            clear_password = clear_password[:-1]
        return clear_password
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_CLEAR_PASSWORD.format(str(e)))
        return None

def get_failed_apps_count(report):
    """
    Get the count of failed apps
    :param report: report data

    :return number of failed apps
    """
    try:
        logging.info("Getting the failed apps count")
        failed_apps = 0
        failed_checks = 0
        for app in report.get("apps", []):
            summary = app["summary"]
            if summary["Status"].lower() != "passed" and not summary["dismiss_app"]:
                failed_apps = failed_apps + 1
        for check in report.get("system", []):
            summary = check["summary"]
            if (summary["Status"].lower() != "passed") and (not summary["dismiss"]):
                failed_checks = failed_checks + 1
        return {"failed_apps": failed_apps, "failed_checks": failed_checks}
    except Exception as e:
        logging.exception("Exception while getting failed apps count {}".format(str(e)))
        return {"failed_apps": 0, "failed_checks": 0}

def get_server_info(session_key):
    """
    Get the server information.
    """
    try:
        response, content = sr.simpleRequest(get_host_endpoint_json, sessionKey=session_key)
        if str(response["status"]) not in success_codes:
            logging.error(MESSAGE_ERROR_GETTING_SERVER_INFO)
            return {}
        content = json.loads(content)
        return content
    except Exception as e:
        logging.exception(str(e))
        return {}

def send_email_wrapper(session_key, email_body_details):
    """
    Send email wrapper.
    :param session_key: Session key of the logged in user
    :param email_body_details: Receiver list and host
    """
    receiver_list = email_body_details["receiver_list"]
    host = email_body_details["host"]
    report_file = os.path.join(EMERALD_MERGED_DIR, MERGED_FILE_JSON)
    if not os.path.exists(report_file):
        logging.error(MESSAGE_ERROR_GET_REPORT)
        return
    report = {}
    with open(report_file, 'r') as file_handler:
        report = json.load(file_handler)

    dismiss_app_details = utils.get_dismiss_app_kvstore_details(session_key, "emerald")
    dismiss_file_details = utils.get_dismiss_file_kvstore_details(session_key, "emerald")
    dismiss_check_details = utils.get_dismiss_check_kvstore_details(session_key)
    if (dismiss_app_details is None) or (dismiss_file_details is None) or (dismiss_check_details is None):
        logging.error("all_dismissed_apps or all_dismissed_files or dismiss_check_details is None so returning")
        return
    # filter dismissed apps
    # filter dismissed files
    utils.filter_dismissed_apps(report, dismiss_app_details)
    utils.filter_dismissed_files(report, dismiss_file_details, scan_type="emerald")
    utils.filter_dismissed_checks(report, dismiss_check_details)
    failed_count = get_failed_apps_count(report=report)
    failed_apps = failed_count["failed_apps"]
    failed_checks = failed_count["failed_checks"]

    if (failed_apps == 0) and (failed_checks == 0):
        logging.info("0 apps are failed so skipping to send email.")
        return
    server_info = get_server_info(session_key)
    splunk_version = server_info.get("generator", {}).get("version", "")
    email_configurations = get_smtp_details(session_key=session_key)
    if (not email_configurations) or (not splunk_version):
        return

    if not email_configurations.get("clear_password"):
        email_configurations["clear_password"] = ""

    stack_name = email_configurations.get("hostname")
    if not stack_name:
        stack_name = host

    failed_apps_text = ""
    failed_checks_text = ""
    if (failed_apps == 1):
        failed_apps_text = "{} {}".format(1, "app")
    elif (failed_apps > 1):
        failed_apps_text = "{} {}".format(failed_apps, "apps")
    if (failed_checks == 1):
        failed_checks_text = "{} {}".format(1, "check")
    elif (failed_checks > 1):
        failed_checks_text = "{} {}".format(failed_checks, "checks")

    text = ""
    if failed_apps_text and failed_checks_text:
        text = "{} and {}".format(failed_apps_text, failed_checks_text)
    elif failed_apps_text:
        text = failed_apps_text
    elif failed_checks_text:
        text = failed_checks_text

    if (failed_apps + failed_checks) > 1:
        email_body_text = EMERALD_EMAIL_BODY.format(text, "updates", stack_name)
    elif (failed_apps + failed_checks) == 1:
        email_body_text = EMERALD_EMAIL_BODY.format(text, "update", stack_name)

    if splunk_version == "8.1.0":
        user_credentials = get_credentials(session_key=session_key)
        if not user_credentials:
            return
        user_credentials = user_credentials["entry"][0]["content"]
    else:
        user_credentials = copy.deepcopy(email_configurations)
    if not user_credentials.get("clear_password"):
        user_credentials["clear_password"] = ""
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

    is_email_sent = send_email(
        email_configurations=email_configurations, user_credentials=user_credentials,
        session_key=session_key, receiver_list=receiver_list, email_body=email_body_text,
        email_body_type="html", is_email_to_be_bcced=True
    )
    if is_email_sent is None:
        logging.info("Using original value of clear password as got authentication error while using decrypted password.")
        user_credentials["clear_password"] = actual_clear_password
        send_email(
            email_configurations=email_configurations, user_credentials=user_credentials,
            session_key=session_key, receiver_list=receiver_list, email_body=email_body_text,
            email_body_type="html", is_email_to_be_bcced=True
        )

def find_receivers(session_key):
    """
    Find the receivers to whom email is to be sent
    :param session_key: Session key of the logged in user

    :return receiver list
    """
    try:
        logging.info("Finding the receiver list")
        try:
            response, content = sr.simpleRequest('{}?output_mode=json&count=0'.format(user_role_endpoint),
                                                            sessionKey=session_key)
        except Exception as e:
            logging.exception(str(e))
            return []

        if response['status'] not in success_codes:
            logging.error("Error fetching receivers {}".format(response))
            return []
        content_json = json.loads(content)
        receiver_list = []
        for user in content_json.get("entry", []):
            user_content = user.get("content", {})
            user_roles = user_content.get("roles", [])
            is_user_locked_out = user_content.get("locked-out", False)
            if (
                (("admin" in user_roles) or ("sc_admin" in user_roles)) and
                (not is_user_locked_out) and (user_content.get("email", "")) and
                (user_content.get("email") not in EXCLUDE_EMAILS)
            ):
                receiver_list.append(user_content["email"])
        return receiver_list
    except Exception as e:
        logging.exception("Exception while fetching the receiver list {}".format(str(e)))
        return []

def find_host(session_key):
    """
    Find the host
    :param session_key: Session key of the logged in user

    :return host
    """
    try:
        logging.info("Finding the host")
        try:
            response, content = sr.simpleRequest('{}?output_mode=json'.format(get_host_endpoint),
                                                            sessionKey=session_key)
        except Exception as e:
            logging.exception(str(e))
            return None

        if response['status'] not in success_codes:
            logging.error("Error fetching host {}".format(response))
            return None
        content_json = json.loads(content)
        host = content_json["entry"][0]["content"]["host"]
        return host
    except Exception as e:
        logging.exception("Exception while fetching the host {}".format(str(e)))
        return None

def is_email_to_be_sent(session_key):
    try:
        service = utils.get_connection_object(session_key)
        local_host = utils.get_local_host_details(service)
        roles = []
        for item in local_host:
            content = dict(item)
            roles = content['server_roles']
        if "search_head" in roles:
            if "shc_member" not in roles:
                return True
            return False
        elif "indexer" in roles:
            if "search_peer" not in roles:
                return True
            return False
        else:
            return False
    except Exception as e:
        logging.exception("Exception occurred while fetching roles: {}".format(str(e)))
    return False

if __name__ == "__main__":
    try:
        sessionKey = sys.stdin.readline().strip()
        if not is_email_to_be_sent(sessionKey):
            sys.exit()
        receiver_list = find_receivers(session_key=sessionKey)
        if receiver_list:
            host = find_host(session_key=sessionKey)
            if host:
                receiver_host = {"receiver_list": receiver_list, "host": host}
                send_email_wrapper(sessionKey, receiver_host)
            else:
                logging.error("Skipping sending email as host is not found.")
        else:
            logging.error("Skipping sending email as receiver_list is not found.")
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_SEND_EMAIL.format(str(e)))
