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

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from builtins import str

logging = logger_manager.setup_logging('jura_latest_report')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class LatestReportHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /latest_report,
    then this class will attempt to run a function named get_latest_report().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /latest_report, then this class will attempt to execute post_latest_report().
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
            query_params = args['query_parameters']
            app_names = query_params["jura_apps"]
            self.app_names = app_names.split(",")
            logging.info("Getting report for apps: {}".format(self.app_names))
            # Get the path and the args
            if 'rest_path' in args:
                path = args['rest_path']
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403, False)

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
                return function_to_call()

            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404, False)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception), include_headers=False)

    def get_latest_report(self):
        """
        Fetch the latest report

        :return JSON data of the latest report
        """

        if not os.path.exists(JQUERY_REPORT_PATH):
            return utils.render_error_json(MESSAGE_ERROR_REPORT_PATH_NOT_PRESENT, 404, False)

        list_reports = os.listdir(JQUERY_REPORT_PATH)
        latest_report = None
        latest_timestamp = None
        persistent_file_ending = PERSISTENT_FILE_JSON.replace("{}", "")
        for report in list_reports:
            if (not report.endswith(persistent_file_ending)) and (report[:-16] == "splunk-system-user"):
                report_timestamp = report.split("_")[-1].replace(".json", "")
                if (latest_timestamp is None) or (int(report_timestamp) > latest_timestamp):
                    latest_timestamp = int(report_timestamp)
                    latest_report = report
        if not latest_report:
            return utils.render_error_json(MESSAGE_ERROR_LATEST_REPORT_NOT_FOUND, 404, False)

        latest_report_path = os.path.join(JQUERY_REPORT_PATH, latest_report)
        latest_report_data = {}
        with open(latest_report_path, "r") as f:
            latest_report_data = json.load(f)
        apps_report = {
            "apps": [],
            "summary": latest_report_data.get("summary", {}),
            "scan_id": latest_report_data.get("scan_id"),
            "host": latest_report_data.get("host")
        }
        for app in self.app_names:
            for app_report in latest_report_data.get("apps", []):
                if app == app_report["name"]:
                    apps_report["apps"].append(app_report)
                    break
        return utils.render_json(apps_report, include_headers=False)
