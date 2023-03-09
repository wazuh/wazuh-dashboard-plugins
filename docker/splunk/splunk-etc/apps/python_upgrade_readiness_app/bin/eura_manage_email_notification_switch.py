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

logging = logger_manager.setup_logging("pura_manage_email_notification_switch")

if sys.platform == "win32":
    import msvcrt

    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class ManageEmailSwitchHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /manage_email_switch,
    then this class will attempt to run a function named get_manage_email_switch().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /schedule_scan, then this class will attempt to execute post_manage_email_switch().
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

        return "manage_email_notification_switch"

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
            # Get the path and the args
            if "rest_path" in args:
                path = args["rest_path"]
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403, False)

            if method.lower() == "get":
                is_era_email_enabled = int(str(query_params.get("is_era_email_enabled", "1")))

                email_switch_details = dict()
                email_switch_details["is_era_email_enabled"] = is_era_email_enabled

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
                    return function_to_call(email_switch_details)

            else:
                logging.warn(
                    "A request could not be executed since the associated function is missing, name={}".format(
                        function_name
                    )
                )
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404, False)
        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception), include_headers=False)

    def manage_email_notification_switch(self, email_switch_details):
        """
        Store the scan scheduling details in kv store

        :param scan_details: The scan details to be stored in kv store

        :return Whether the scan scheduling details were stored in kv store
        """
        is_email_switch_details_saved = utils.save_email_switch_details_in_local(email_switch_details, self.session_key, self.user, self.host)
        if not is_email_switch_details_saved:
            return utils.render_error_json(MESSAGE_ERROR_POST_SCHEDULE_SCAN, include_headers=False)
        return utils.render_json(MESSAGE_POST_MANAGE_SCAN_SCHEDULE.format(self.user, self.host), include_headers=False)
