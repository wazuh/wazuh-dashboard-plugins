import os
import re
import sys
import json
import time
import splunk.rest as sr
from splunk.persistconn.application import PersistentServerConnectionApplication

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

import splunklib.client as client
from splunk.clilib import cli_common as cli
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from pura_libs_utils import six
from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils import pura_python_toggle_utils as python_toggle_utils
from builtins import str
import splunklib.results as results

logging = logger_manager.setup_logging('pura_check_python_version')

if sys.platform == "win32":
    import msvcrt

    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class CheckPythonVersion(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /check_python_version,
    then this class will attempt to run a function named get_python_version().
    Note that the root path of the REST handler is removed. 
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
        return 'get_disabled_python_versions'


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
                return function_to_call()
            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))


    def get_disabled_python_versions(self):
        """
        Check python version on stack and request for changing python version on kv store.

        :return flag representing which request_action_type to disable.
        """
        try:
            if not python_toggle_utils.check_host_is_search_head(self.session_key):
                return python_toggle_utils.render_error_json_with_type(error_type=pt_invalid_instance)
            python_version = python_toggle_utils.get_current_python_version().lower()
    
            if not python_version or len(python_version.strip()) == 0:
                return python_toggle_utils.render_error_json_with_type(error_type=pt_python_version_not_found,message="Unable to detect python version or instance type.")
            
            if python_version not in python_versions:
                return python_toggle_utils.render_error_json_with_type(error_type=pt_invalid_python_version,message="Unable to detect python version or instance type.")           
            
            if python_version== "python2":
                user_records = python_toggle_utils.fetch_user_records_from_collection(self.session_key, self.user, self.host)
                if user_records:
                    latest_request_type = user_records[-1].get("action", "").lower()
                    if len(latest_request_type.strip()) > 0 and latest_request_type != "python2":
                        return utils.render_json(1)
                return utils.render_json(0)
            return utils.render_json(2)
        except Exception as e:
            logging.exception(e)
            return python_toggle_utils.render_error_json_with_type(error_type=pt_other,message="Unable to detect python version or instance type.")
     