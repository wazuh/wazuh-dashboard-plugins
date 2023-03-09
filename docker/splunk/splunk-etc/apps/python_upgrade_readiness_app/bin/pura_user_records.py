import os
import re
import sys
import json
import time
from datetime import (datetime, timezone)
import splunk.rest as sr
from splunk.persistconn.application import PersistentServerConnectionApplication

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import * 
from pura_libs_utils import pura_utils as utils
from splunk.clilib import cli_common as cli
from pura_libs_utils import six
from pura_libs_utils import pura_python_toggle_utils as python_toggle_utils
from pura_libs_utils import pura_index_log_manager as indexer_logger_manager

from builtins import str

EMAIL_SUBJECT = "Default Python Version Change Requested in Splunk"

EMAIL_BODY = """\
<html>
  <head></head>
  <body>
    <p>Hello,</p>
    <p>On {}, {} made a request to have the Splunk default Python version set to {}. If this was made in error, please visit the Upgrade Readiness App in your Splunk instance to request a different Python option or to remain on the current Python version.</p>
    <p>- Upgrade Readiness App</p>
  </body>
</html>
"""

logging = logger_manager.setup_logging('pura_user_records')
indexer_logging = indexer_logger_manager.setup_logging("pura_py_version_upgrade_request")

if sys.platform == "win32":
    import msvcrt

    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class UserRecords(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /user_records,
    then this class will attempt to run a function named get_user_records().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /user_records, then this class will attempt to execute post_user_records().
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
                request_body = json.loads(str(args['payload']))
            elif method.lower() == "post":
                return utils.render_error_json(MESSAGE_NO_REQUEST_BODY, 400)

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
                if method.lower() == "get":
                    return function_to_call()
                else:
                    return function_to_call(request_body)
            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))


    def get_user_records(self):
        """
        Fetch user records from kv store.

        :return user records sorted according to date time with most recent first.
        """
        current_timezone_offset = self.get_user_current_timezone_offset()
        if current_timezone_offset:
            current_timezone_offset = str(current_timezone_offset)
            current_timezone_offset = current_timezone_offset[:3] + ":" + current_timezone_offset[3:]
        try:
            response, content = sr.simpleRequest(user_records_endpoint,
                                                 sessionKey=self.session_key, method='GET',raiseAllErrors=True)
            if response['status'] not in success_codes:
                logging.error(MESSAGE_ERROR_READ_USER_RECORD.format(self.user,self.host))
                return utils.render_error_json(MESSAGE_ERROR_READ_USER_RECORD.format(self.user, self.host), 404)
            content = json.loads(content)
            if not content:
                return utils.render_json({"current_timezone_offset" : current_timezone_offset, "records" : []})
            content.reverse()

        except Exception:
            logging.exception(MESSAGE_EXCEPTION_READ_USER_RECORD.format(self.user, self.host))
            return utils.render_error_json(MESSAGE_EXCEPTION_READ_USER_RECORD.format(self.user, self.host), 404)

        return utils.render_json({"current_timezone_offset" : current_timezone_offset, "records" : content})

    def post_user_records(self, query_params):
        """
         Write user records entry in KV store for given parameters.

        :param query_params: Dict of parameters

        :return JSON response for to represent record inserted successfully or not.
       
        """
        try:
            if 'action' not in query_params or not query_params['action']:
                logging.error(MESSAGE_USER_RECORD_REQUEST_TYPE)
                return python_toggle_utils.render_error_json_with_type(error_type=pt_other, message=MESSAGE_USER_RECORD_REQUEST_TYPE, response_code=404)
            python_action = query_params["action"] 
            if (not (python_action and python_action.strip())):
                logging.error(MESSAGE_EMPTY_ACTION)
                return python_toggle_utils.render_error_json_with_type(error_type=pt_other, message=MESSAGE_EMPTY_ACTION, response_code=404)
                    
            if(python_action.lower() not in acceptable_actions):
                logging.error(MESSAGE_INVALID_ACTION)
                return python_toggle_utils.render_error_json_with_type(error_type=pt_other, message=MESSAGE_INVALID_ACTION, response_code=404)
            
            is_valid = self.check_is_valid(query_params['action'])
            if not is_valid:
                return python_toggle_utils.render_error_json_with_type(error_type=pt_invalid_transition)

            query_params['user_name'] = self.user
            query_params['host_name'] = ""
            try:
                query_params['host_name'] = python_toggle_utils.get_host(self.session_key)
            except Exception as e:
                logging.exception(e)
            query_params['user_role'] = "|".join(self.get_user_roles())
            
            description = ""
            if python_action == PYTHON2:
                description = PYTHON2_DESCRIPTION
            elif python_action == PYTHON3:
                description = PYTHON3_DESCRIPTION
            elif python_action == FORCE_PYTHON3:
                description = FORCE_PYTHON3_DESCRIPTION

            query_params['description'] = description
            self.add_event_to_log(query_params)
            query_params['stack_id'] = self.get_stack_id()
        
            utc_date_time = datetime.utcnow()
            current_time = str(utc_date_time.replace(tzinfo=timezone.utc))
            query_params['request_timestamp'] = current_time
            mail_date_time = datetime.strftime(utc_date_time,'%d %b %Y %H:%M:%S') + " +UTC" 
            status, message = self.write_entry(query_params)
            if not status:
                logging.error(message)
                return python_toggle_utils.render_error_json_with_type(error_type=pt_other, message="Request has been logged, but unable to update KV Store. "+message)
            logging.info(message)
            is_email_sent, email_status = python_toggle_utils.send_mail_to_all_sc_admins(self.session_key, EMAIL_BODY.format(mail_date_time, self.user, python_action), EMAIL_SUBJECT, "html")
            if not is_email_sent:
                logging.error(email_status)
                return utils.render_msg_json(message+" But Email is not sent.")
            logging.info(email_status)
            return utils.render_msg_json(message)
        except Exception as e:
            logging.exception(e)
            return python_toggle_utils.render_error_json_with_type(error_type=pt_other)

    def add_event_to_log(self, event):
        """
        Method to add event in log file.

        :event: User record.
        """
        event = self.format_event(event)
        indexer_logging.info(event)

    def format_event(self, event_dict):
        """
        Format event for logging.

        :event_dict: User record.
        """
        event_string = ""
        for key, value in event_dict.items():
            event_string += '{}="{}", '.format(key, value)
        event_string = event_string[:-2]
        return event_string


    def get_user_roles(self):
        """
            Returns the user roles of current logged in user.
        """
        user_roles = []
        try:
            service = python_toggle_utils.splunk_connect(self.session_key)
            one_shot_str = "| rest splunk_server=local services/authentication/users"
            server_info = utils.one_shot_str_wrapper(
                one_shot_str,
                service
            )
            for item in server_info:
                content = dict(item)
                user = content.get("title")
                if user and user == self.user:
                    roles = content.get("roles", "")
                    if isinstance(roles, str):
                        user_roles.append(roles)
                    elif isinstance(roles, list):
                        user_roles.extend(roles)
                    break
        except Exception as e:
            logging.exception(e)
        return user_roles


    def get_user_current_timezone_offset(self):
        """
        Returns the current timezone of splnk
        """
        current_timezone_offset = None
        try:
            service = python_toggle_utils.splunk_connect(self.session_key)
            one_shot_str = '| makeresults | eval user_current_timezone_offset=strftime(now(), "%z")'
            zone_info = utils.one_shot_str_wrapper(
                one_shot_str,
                service
            )
            for item in zone_info:
                content = dict(item)
                current_timezone_offset = content.get("user_current_timezone_offset")
        except Exception as e:
            logging.exception(e)
        return current_timezone_offset


    def get_stack_id(self):
        """
         Used to get the Stack ID from splunk instance
        """
        stack_id = ""
        try:
            service = python_toggle_utils.splunk_connect(self.session_key)
            server_info = utils.get_local_host_details(service)
            for item in server_info:
                content = dict(item)
                cluster_label = content.get("cluster_label")
                if cluster_label:
                    label_splited = cluster_label.split("-")
                    if len(label_splited) >= 2:
                        label_splited.pop()
                        stack_id = "-".join(label_splited)
        except Exception as e:
            logging.exception(e)
        return stack_id
            
    def check_is_valid(self, action):
        """
        Checks whether the given request be inserted in KV store.
        
        :param action: User action (python2/python3/force_python3)

        :returns: True/False based on is valid or not.
        """
        try:
            python_version = python_toggle_utils.get_current_python_version().lower()
            action = action.lower()

            if (python_version not in python_versions):
                return False

            if (not (python_version or python_version== "python3")):
                return False           
            else:
                user_records = python_toggle_utils.fetch_user_records_from_collection(self.session_key, self.user, self.host)
                if not user_records:
                    return action != "python2"
                else:
                    latest_request_type = user_records[-1].get("action").lower()
                    if (latest_request_type != "python2" and action != "python2") or (latest_request_type == "python2" and action == "python2") :
                        return False
        except Exception as e:
            logging.exception(e)
        return True

    
    def write_entry(self, entry):
        """
        Write entry in KV store for given parameters.

        :param entry: Dict of parameters

        :return status (True/False), message
        """
        try:
            response, _ = sr.simpleRequest(user_records_endpoint,
                                           sessionKey=self.session_key, jsonargs=json.dumps(entry), method='POST',
                                           raiseAllErrors=True)
        except Exception:
            logging.exception(MESSAGE_EXCEPTION_WRITE_USER_RECORD.format(self.user, self.host))
            return False, MESSAGE_EXCEPTION_WRITE_USER_RECORD.format(self.user, self.host)
        if response['status'] not in success_codes:
            logging.error(MESSAGE_ERROR_WRITE_USER_RECORD.format(self.user, self.host))
            return False, MESSAGE_ERROR_WRITE_USER_RECORD.format(self.user, self.host)

        return True, "User record inserted successfully."
