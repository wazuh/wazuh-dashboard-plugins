import os
import io
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
from pura_libs_utils import six
from builtins import str
from builtins import range

logging = logger_manager.setup_logging('pura_remote_export_report')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class RemoteExportReportHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /remote_export_report,
    then this class will attempt to run a function named get_remote_export_report().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /remote_export_report, then this class will attempt to execute get_remote_export_report().
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
            self.file_format = FILE_FORMAT_JSON
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
            # If no format is provided, the endpoint will set JSON as default
            if query_params.get('format'):
                self.file_format = query_params['format']
                if self.file_format != FILE_FORMAT_JSON:
                    return utils.render_error_json(MESSAGE_INVALID_FILE_FORMAT, 500)

            if query_params.get("host"):
                self.remote_host = query_params["host"]
            else:
                return utils.render_error_json("Remote hostname not provided", 404)

            if query_params.get("app_name"):
                self.app_name = query_params["app_name"]
                if query_params.get("app_path"):
                    self.app_path = query_params["app_path"]
            else:
                self.app_name = ALL_APPS_NAME

            # Get the function signature
            function_name = self.get_function_signature(method, path)

            try:
                function_to_call = getattr(self, function_name)
            except AttributeError:
                function_to_call = None

            # Try to run the function
            if function_to_call is not None:
                logging.info("Executing function, name={}".format(function_name))

                return function_to_call(is_remote)

            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))


    def get_remote_export_report(self, is_remote):
        """
        Get report of scan results and export as JSON.

        :return scan results for given id
        """

        # Check for reports in /local/reports directory
        results = dict()
        report_file = utils.read_latest_report_filepath(scan_type="python", is_remote=is_remote)
        if not report_file:
            return utils.render_error_json(FILEPATH_NOT_FOUND.format(report_file), 404)
        with open(report_file, 'r') as file_handler:
            results = json.load(file_handler)
        results = utils.add_missing_keys_in_report(results)
        dismiss_app_details = utils.get_dismiss_app_kvstore_details(self.session_key, "python")
        dismiss_file_details = utils.get_dismiss_file_kvstore_details(self.session_key, "python")
        results_dismissed_apps_copy = copy.deepcopy(results)
        are_dismissed_apps_filtered = utils.filter_dismissed_apps(results, dismiss_app_details)
        if not are_dismissed_apps_filtered:
            logging.error(MESSAGE_SKIP_DISMISS_APPS)
            results = results_dismissed_apps_copy
        results_dismissed_files_copy = copy.deepcopy(results)
        are_dismissed_files_filtered = utils.filter_dismissed_files(results, dismiss_file_details, scan_type="python")
        if not are_dismissed_files_filtered:
            logging.error(MESSAGE_SKIP_DISMISS_FILES)
            results = results_dismissed_files_copy
        results = self.filter_report(results)
        if self.app_name != ALL_APPS_NAME:
            results = self.filter_app_report(report=results)
            if not results:
                return utils.render_error_json(MESSAGE_ERROR_REMOTE_EXPORT_APP_REPORT_.format(self.app_name, self.remote_host), 404)
        report = copy.deepcopy(results)
        try:
            utils.convert_filepath_to_relative(report)
            results = report
        except Exception as e:
            logging.exception("Could not convert to relative filepath: {}".format(str(e)))
        return utils.render_json(results)

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
