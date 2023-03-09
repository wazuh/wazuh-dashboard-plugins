import os
import re
import sys
import json
import time
import datetime
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
from builtins import str
from pura_libs_utils import pura_storage_utils

logging = logger_manager.setup_logging("eura_email_notification_switch")

if sys.platform == "win32":
    import msvcrt

    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class EmailNotificationSwitchHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /email_notification_switch,
    then this class will attempt to run a function named get_remote_schedule_scan().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /remote_schedule_scan, then this class will attempt to execute post_email_notification_switch().
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
            components = path.split("eura")
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
            self.session_key = args["session"]["authtoken"]
            self.user = args["session"]["user"]
            self.host = args["server"]["hostname"]

            # Get the method
            method = args["method"]
            query_params = args['query_parameters']
            logging.info("params {}".format(query_params))
            # Get the path and the args
            if "rest_path" in args:
                path = args["rest_path"]
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403)

            if method.lower() == "post":
                if "payload" in args:
                    request_body = json.loads(args["payload"])
                else:
                    return utils.render_error_json(MESSAGE_NO_REQUEST_BODY, 400)

            if method.lower() == "post":
                is_enabled = request_body.get("is_era_email_enabled", 1)

                email_notification_switch_data = dict()
                email_notification_switch_data["is_era_email_enabled"] = is_enabled

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
                if method.lower() == "post":
                    return function_to_call(email_notification_switch_data)
                elif method.lower() == "get":
                    return function_to_call()

            else:
                logging.warn(
                    "A request could not be executed since the associated function is missing, name={}".format(
                        function_name
                    )
                )
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)
        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))

    def post_email_notification_switch(self, request_body):
        """
        Store the email notification switch details in kv store

        :param request_body: The email notification details which are to be stored in kv store.

        :return Whether the email notification switch details were stored successfully or not.
        """
        email_notification_switch_details = utils.get_details_from_kvstore(
            era_email_switch_endpoint,
            self.session_key,
            self.user,
            self.host
        )
        if email_notification_switch_details is None:
            return utils.render_error_json(MESSAGE_ERROR_EMAIL_SWITCH_READ.format(self.user, self.host))
        if email_notification_switch_details:
            # entry already exists in kvstore so update that
            endpoint = "{}/{}".format(era_email_switch_endpoint, email_notification_switch_details['_key'])
        else:
            # there is no entry in kvstore so add new entry
            endpoint = era_email_switch_endpoint
        email_notification_switch_details["is_era_email_enabled"] = int(str(request_body["is_era_email_enabled"]))
        email_notification_switch_details['is_updated'] = True
        is_email_notification_details_added = utils.add_details_to_kvstore(
            endpoint,
            email_notification_switch_details,
            self.session_key,
            self.user,
            self.host
        )
        if not is_email_notification_details_added:
            return utils.render_error_json(MESSAGE_ERROR_EMAIL_SWITCH_UPDATE.format(self.user, self.host))
        else:
            return utils.render_msg_json(MESSAGE_SUCCESS_EMAIL_SWITCH_UPDATE.format(self.user, self.host))

    def get_email_notification_switch(self):
        """
        Get the email notification switch details from kv store

        :return Email notification switch details
        """
        email_switch_details = utils.get_details_from_kvstore(
            era_email_switch_endpoint,
            self.session_key,
            self.user,
            self.host
        )
        if email_switch_details is None:
            return utils.render_error_json(MESSAGE_ERROR_EMAIL_SWITCH_READ.format(self.user, self.host))
        return utils.render_json(email_switch_details)
