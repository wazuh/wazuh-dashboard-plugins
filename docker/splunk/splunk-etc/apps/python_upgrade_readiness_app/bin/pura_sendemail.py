import os
import re
import sys
import json
import time
import socket
import smtplib
from splunk.persistconn.application import PersistentServerConnectionApplication

import splunk.secure_smtplib as secure_smtplib
import splunk.ssl_context as ssl_context
import splunk.entity as entity
from splunk.util import normalizeBoolean
import splunk.rest as sr
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

CHARSET = "UTF-8"

logging = logger_manager.setup_logging('pura_sendemail')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class SendEmailHandler(PersistentServerConnectionApplication):
    """

    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a POST request is made to the endpoint is executed with the path /sendemail,
    then this class will attempt to run a function named post_sendemail().
    Note that the root path of the REST handler is removed. If a GET request is made to the endpoint
    is executed with the path /sendemail, then this class will attempt to execute get_sendemail().
    """

    def __init__(self, command_line, command_arg):
        PersistentServerConnectionApplication.__init__(self)

    @classmethod
    def get_function_signature(cls, method, path):
        """
        Get the function that should be called based on path and request method.

        :param cls: class
        :param method: type of call (get/post)
        :param path: the rest endpoint for which method is to be called

        :return name of the function to be called
        """

        if len(path) > 0:
            components = path.split("pura")
            path = components[1]
            return method + re.sub(r'[^a-zA-Z0-9_]', '_', path).lower()
        else:
            return method

    def handle(self, in_string):
        """
        Handler function to call when REST endpoint is hit and process the call

        :param in_string: string of arguments

        :return Result of REST call
        """
        try:

            logging.info("Handling a request")

            # Parse the arguments
            args = utils.parse_in_string(in_string)

            # Get the user information
            self.session_key = args['session']['authtoken']
            self.user = args['session']['user']
            self.host = args['server']['hostname']

            # Get the method
            method = args['method']

            # Get the path and the args
            if 'rest_path' in args:
                path = args['rest_path']
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403)

            # Get the request body
            if 'payload' in args:
                request_body = json.loads(args['payload'])
            else:
                return utils.render_error_json(MESSAGE_NO_REQUEST_BODY, 400)

            # default consider all the apps
            self.app_name = request_body.get("app_name", ALL_APPS_NAME)
            self.app_path = request_body.get("app_path", "")
            self.email_subject = request_body.get("subject")

            self.email_receiver_list = request_body.get("receiver")
            self.email_body = request_body.get("body")

            self.email_receiver_list = [str(receiver).strip() for receiver
                                        in self.email_receiver_list if str(receiver).strip()]

            if not self.email_receiver_list:
                return utils.render_error_json(MESSAGE_NO_EMAIL_RECEIVER, 403)
            if not self.email_body:
                return utils.render_error_json(MESSAGE_NO_EMAIL_BODY, 403)
            if not self.email_subject:
                return utils.render_error_json(MESSAGE_NO_EMAIL_SUBJECT, 403)

            # Get the function signature
            function_name = self.get_function_signature(method, path)

            try:
                function_to_call = getattr(self, function_name)
            except AttributeError:
                function_to_call = None

            # Try to run the function
            if function_to_call is not None:
                logging.info("Executing function, name={}".format(function_name))

                # Execute the function
                self.start_time = int(time.time() * 1000)
                return function_to_call()

            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))

    def find_latest_file(self):
        """
        Find the latest report file in the REPORT_PATH

        :return: Name of the latest report file
        """
        try:
            logging.info("Finding the latest filename")
            latest_filename = None
            latest_timestamp = None
            if not os.path.exists(REPORT_PATH):
                logging.error(MESSAGE_ERROR_REPORT_PATH_NOT_PRESENT)
                return None
            for report in os.listdir(REPORT_PATH):
                report_path = os.path.join(REPORT_PATH, report)
                if os.path.exists(report_path) and self.user == report[:-16]:
                    report_timestamp_with_extension = report.split("_")[-1]
                    try:
                        report_timestamp = int(report_timestamp_with_extension.replace(".json", ""))
                    except Exception as e:
                        logging.exception(str(e))
                        continue
                    if latest_timestamp is None or report_timestamp > latest_timestamp:
                        latest_filename = report
                        latest_timestamp = report_timestamp

            return latest_filename
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_GET_REPORT.format(str(e)))
        return None

    def get_credentials(self):
        """
        Get the credentials of the user

        :return User credentials
        """
        try:
            uri = 'admin/alert_actions/email'
            response, content = sr.simpleRequest(uri, method='POST', postargs={'show_password': True, 'output_mode': 'json'}, sessionKey=self.session_key)

            # invalid server response status check
            if response['status']!='200':
                logging.error('get_credentials - unable to retrieve credentials; check simpleRequest response')
                return {}
            content_json = json.loads(content)
            return content_json
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_GET_CREDENTIALS.format(str(e)))

        return {}

    def get_smtp_details(self, session_key):
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

    def get_clear_password(self, user_credentials):
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

    def send_email(self, email_configurations, user_credentials, file_data, file_name):
        """
        Send the email.
        :param email_configuration: Configurations of the email for eg. use_ssl, use_tls etc
        :param user_credentials: Credentials of the user
        :param file_data: The data to be sent in the attachment
        :param file_name: Name of the file as in the attachment

        :return Whether the email was sent or not
        """
        try:
            from email.mime.multipart import MIMEMultipart
            from email.header import Header
            from email.mime.application import MIMEApplication
            from email.mime.text import MIMEText

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
            email["To"] = ", ".join(self.email_receiver_list)
            email['Subject'] = Header(self.email_subject, CHARSET)

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
                server_conf_json = ssl_helper.getServerSettings(self.session_key)
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

            attachment = MIMEApplication(json.dumps(file_data))
            attachment.add_header('content-disposition', 'attachment', filename=file_name)
            email.attach(attachment)
            body = MIMEText(self.email_body, 'plain')
            email.attach(body)
            smtp.sendmail(sender, self.email_receiver_list, email.as_string())
            smtp.quit()
            return True
        except smtplib.SMTPAuthenticationError as e:
            logging.error(MESSAGE_EXCEPTION_SEND_EMAIL.format(str(e)))
            return None
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_SEND_EMAIL.format(str(e)))
        return False

    def filter_report(self, report):
        """
        Filter report by removing additional fields.

        :param report: Report in JSON

        :return Updated report
        """
        for app in report['apps']:
            for check in app['checks']:
                for message in check['messages']:
                    if 'line' in message:
                        del message['line']
                    if 'filename' in message:
                        del message['filename']
        return report

    def filter_app_report(self, report):
        """
        Get report for a specific app.

        :param report: Report in JSON

        :return Updated report
        """
        app_report = dict()
        for app in report['apps']:
            if app["name"] == self.app_name and app["app_path"] == self.app_path:
                app_report["apps"] = list()
                app_report["apps"].append(app)
                app_report["scan_id"] = report["scan_id"]
                break

        return app_report

    def get_server_info(self):
        """
        Get the server information.
        """
        try:
            response, content = sr.simpleRequest(get_host_endpoint_json, sessionKey=self.session_key)
            if str(response["status"]) not in success_codes:
                logging.error(MESSAGE_ERROR_GETTING_SERVER_INFO)
                return {}
            content = json.loads(content)
            return content
        except Exception as e:
            logging.exception(str(e))
            return {}

    def post_sendemail(self):
        """
        Send the email for scan results to the receiver
        """

        report_name = self.find_latest_file()
        if not report_name:
            logging.error(MESSAGE_ERROR_GET_REPORT)
            return utils.render_error_json(MESSAGE_ERROR_GET_REPORT, 404)

        report_file = os.path.join(REPORT_PATH, report_name)
        with open(report_file, 'r') as file_handler:
            report = json.load(file_handler)
        # get the dismiss app and dismiss file details
        dismiss_app_details = utils.get_dismiss_app_file_system(self.host, self.user)
        dismiss_file_details = utils.get_dismiss_file_file_system(self.host, self.user)
        # filter dismissed apps
        # filter dismissed files
        results_dismissed_apps_copy = copy.deepcopy(report)
        are_dismissed_apps_filtered = utils.filter_dismissed_apps(report, dismiss_app_details)
        if not are_dismissed_apps_filtered:
            logging.error(MESSAGE_SKIP_DISMISS_APPS)
            report = results_dismissed_apps_copy
        results_dismissed_files_copy = copy.deepcopy(report)
        are_dismissed_files_filtered = utils.filter_dismissed_files(report, dismiss_file_details, is_remote=False, scan_type="python")
        if not are_dismissed_files_filtered:
            logging.error(MESSAGE_SKIP_DISMISS_FILES)
            report = results_dismissed_files_copy
        report = self.filter_report(report)
        if self.app_name != ALL_APPS_NAME:

            report = self.filter_app_report(report)
            if not report:
                return utils.render_error_json(MESSAGE_EXCEPTION_GET_APP_REPORT.format(self.app_name), 404)

        server_info = self.get_server_info()
        splunk_version = server_info.get("generator", {}).get("version", "")
        email_configurations = self.get_smtp_details(session_key=self.session_key)
        if (not email_configurations) or (not splunk_version):
            return utils.render_error_json(MESSAGE_ERROR_GET_EMAIL_CONFIGURATIONS, 404)
        if splunk_version == "8.1.0":
            user_credentials = self.get_credentials()
            if not user_credentials:
                return utils.render_error_json(MESSAGE_ERROR_GET_EMAIL_CONFIGURATIONS, 404)
            user_credentials = user_credentials["entry"][0]["content"]
        else:
            user_credentials = copy.deepcopy(email_configurations)
        if not user_credentials.get("clear_password"):
            user_credentials["clear_password"] = ""
        actual_clear_password = user_credentials.get("clear_password", "")
        if user_credentials.get("clear_password", ""):
            # If clear_password is present then decrypt it
            clear_password = self.get_clear_password(user_credentials=user_credentials)
            if clear_password:
                # if clear_password is an non empty string
                logging.info("Using decrypted value of clear password")
                user_credentials["clear_password"] = clear_password
            else:
                # if clear_password is empty string or some exception was raised after decryption using the original value
                logging.info("Using original value of clear password")

        attachment_name = EMAIL_ATTACHMENT_NAME.format(self.app_name, str(self.host))
        is_email_sent = self.send_email(email_configurations=email_configurations,
                                    user_credentials=user_credentials, file_data=report, file_name=attachment_name)
        if is_email_sent is None:
            logging.info("Using original value of clear password as got authentication error while using decrypted password.")
            user_credentials["clear_password"] = actual_clear_password
            is_email_sent = self.send_email(email_configurations=email_configurations,
                                    user_credentials=user_credentials, file_data=report, file_name=attachment_name)
        if is_email_sent:
            return utils.render_msg_json(MESSAGE_SEND_EMAIL)
        return utils.render_error_json(MESSAGE_ERROR_SEND_EMAIL)
