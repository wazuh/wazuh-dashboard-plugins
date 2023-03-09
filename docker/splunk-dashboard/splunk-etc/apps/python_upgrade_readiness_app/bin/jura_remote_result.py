import os
import re
import sys
import json
import time
import splunk.rest as sr
from splunk.persistconn.application import PersistentServerConnectionApplication
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

logging = logger_manager.setup_logging('jura_remote_result')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class RemoteResultHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /remote_result,
    then this class will attempt to run a function named get_remote_result().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /latest_report, then this class will attempt to execute post_remote_result().
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
            components = path.split("jura")
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

            query_params = args['query_parameters']
            is_remote = str(query_params.get("is_remote", "false"))

            if is_remote.lower() == "false":
                is_remote = False
            else:
                is_remote = True

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
                self.start_time = int(time.time()*1000)
                return function_to_call(is_remote)

            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))

    def get_remote_result(self, is_remote):
        """
        Fetch the report from the remote folder

        :return JSON data of the report
        """

        scan_report = dict()
        scan_report['status'] = PROGRESS_NEW
        scan_report['results'] = {}
        scan_report['message'] = MESSAGE_NO_SCAN_RESULTS
        scan_report['progress'] = 0
        filepath = utils.read_latest_report_filepath(scan_type="jquery", is_remote=is_remote)
        if not filepath:
            return utils.render_json(scan_report)
        dismiss_app_details = utils.get_dismiss_app_kvstore_details(self.session_key, "jquery")
        dismiss_file_details = utils.get_dismiss_file_kvstore_details(self.session_key, "jquery")
        latest_report_data = {}
        with open(filepath, "r") as f:
            latest_report_data = json.load(f)
        latest_report_data = utils.add_missing_keys_in_report(latest_report_data)
        results_dismissed_apps_copy = copy.deepcopy(latest_report_data)
        are_dismissed_apps_filtered = utils.filter_dismissed_apps(latest_report_data, dismiss_app_details)
        if not are_dismissed_apps_filtered:
            logging.error(MESSAGE_SKIP_DISMISS_APPS)
            latest_report_data = results_dismissed_apps_copy
        results_dismissed_files_copy = copy.deepcopy(latest_report_data)
        are_dismissed_files_filtered = utils.filter_dismissed_files(latest_report_data, dismiss_file_details, scan_type="jquery")
        if not are_dismissed_files_filtered:
            logging.error(MESSAGE_SKIP_DISMISS_FILES)
            latest_report_data = results_dismissed_files_copy
        scan_report.update({
            "results": latest_report_data,
            "status": PROGRESS_COMPLETE,
            "progress": 100,
            'message': MESSAGE_REMOTE_SCAN_SUCCESS.format(self.user)
        })

        return utils.render_json(scan_report)
