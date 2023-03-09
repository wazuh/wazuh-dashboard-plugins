import copy
import os
import re
import sys
import json
import splunk.rest as sr
from splunk.persistconn.application import PersistentServerConnectionApplication

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from builtins import str
import pura_storage_utils

logging = logger_manager.setup_logging('eura_read_progress')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class ReadProgressHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /read_progress,
    then this class will attempt to run a function named get_read_progress().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /read_progress, then this class will attempt to execute post_read_progress().
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
            self.session_key = args['session']['authtoken']
            self.user = args['session']['user']
            self.host = args['server']['hostname']

            # Get the method
            method = args['method']
            query_params = args['query_parameters']
            # Get the path and the args
            if 'rest_path' in args:
                path = args['rest_path']
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403)

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

                return function_to_call(is_remote)

            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))

    def get_read_progress(self, is_remote):
        """
        Read progress from KV store.

        :return response for read progress REST call
        """

        scan_report = dict()
        scan_report['status'] = PROGRESS_NEW
        scan_report['results'] = {}
        scan_report['message'] = MESSAGE_NO_SCAN_RESULTS
        scan_report['progress'] = 0
        scan_report['host_name'] = str(self.host)

        file_details = pura_storage_utils.create_dirs_if_not_exists(era_get_progress_collection, self.user, self.host)
        content = pura_storage_utils.read(file_details["file_path"])

        file_details = pura_storage_utils.create_dirs_if_not_exists(era_cancel_scan_collection, self.user, self.host)
        cancel_scan_content = pura_storage_utils.read(file_details["file_path"])

        if (content is None) or (cancel_scan_content is None):
            logging.error(MESSAGE_ERROR_READING_PROGRESS.format(self.user, self.host))
            return utils.render_error_json(MESSAGE_ERROR_READING_PROGRESS.format(self.user, self.host))

        else:
            if len(cancel_scan_content) > 0:
                cancel_scan_content = cancel_scan_content[0]

            else:
                cancel_scan_content = {}

            for entry in content:
                if (self.host == entry.get('host')) and (self.user == entry.get('user')) and (not cancel_scan_content.get('cancelled', False)):
                    scan_key = entry['_key']
                    scan_report.update({
                        'status': entry['status'],
                        'message': entry['message'],
                        'progress': entry['progress']
                    })

                    if scan_report['status'] == PROGRESS_COMPLETE:
                        filepath = utils.read_latest_report_filepath(scan_type="emerald", is_remote=is_remote)
                        results = {}
                        if filepath:
                            with open(filepath, 'r') as file_handler:
                                results = json.load(file_handler)
                        scan_type = "manual"
                        if (filepath.endswith(MERGED_FILE_JSON)) or ("splunk-system-user" in filepath):
                            scan_type = "scheduled"
                        results = utils.add_missing_keys_in_report(results)
                        dismiss_app_details = utils.get_dismiss_app_kvstore_details(self.session_key, "emerald")
                        dismiss_file_details = utils.get_dismiss_file_kvstore_details(self.session_key, "emerald")
                        dismiss_check_details = utils.get_dismiss_check_kvstore_details(self.session_key)
                        results_dismissed_apps_copy = copy.deepcopy(results)
                        are_dismissed_apps_filtered = utils.filter_dismissed_apps(results, dismiss_app_details)
                        if not are_dismissed_apps_filtered:
                            logging.error(MESSAGE_SKIP_DISMISS_APPS)
                            results = results_dismissed_apps_copy
                        results_dismissed_files_copy = copy.deepcopy(results)
                        are_dismissed_files_filtered = utils.filter_dismissed_files(results, dismiss_file_details, scan_type="emerald")
                        if not are_dismissed_files_filtered:
                            logging.error(MESSAGE_SKIP_DISMISS_FILES)
                            results = results_dismissed_files_copy
                        results_dismissed_checks_copy = copy.deepcopy(results)
                        are_dismissed_checks_filtered = utils.filter_dismissed_checks(results, dismiss_check_details)
                        if not are_dismissed_checks_filtered:
                            logging.error(MESSAGE_SKIP_DISMISS_SYSTEM_CHECK)
                            results = results_dismissed_checks_copy
                        if results.get("summary", {}):
                            results["summary"]["scan_type"] = scan_type
                        scan_report.update({
                            'results': results
                        })
                    return utils.render_json(scan_report)

            else:
                filepath = utils.read_latest_report_filepath(scan_type="emerald", is_remote=is_remote)
                results = {}
                if filepath:
                    with open(filepath, 'r') as file_handler:
                        results = json.load(file_handler)
                scan_type = "manual"
                if (filepath.endswith(MERGED_FILE_JSON)) or ("splunk-system-user" in filepath):
                    scan_type = "scheduled"
                dismiss_app_details = utils.get_dismiss_app_kvstore_details(self.session_key, "emerald")
                dismiss_file_details = utils.get_dismiss_file_kvstore_details(self.session_key, "emerald")
                dismiss_check_details = utils.get_dismiss_check_kvstore_details(self.session_key)
                results = utils.add_missing_keys_in_report(results)
                results_dismissed_apps_copy = copy.deepcopy(results)
                are_dismissed_apps_filtered = utils.filter_dismissed_apps(results, dismiss_app_details)
                if not are_dismissed_apps_filtered:
                    logging.error(MESSAGE_SKIP_DISMISS_APPS)
                    results = results_dismissed_apps_copy
                results_dismissed_files_copy = copy.deepcopy(results)
                are_dismissed_files_filtered = utils.filter_dismissed_files(results, dismiss_file_details, scan_type="emerald")
                if not are_dismissed_files_filtered:
                    logging.error(MESSAGE_SKIP_DISMISS_FILES)
                    results = results_dismissed_files_copy
                results_dismissed_checks_copy = copy.deepcopy(results)
                are_dismissed_checks_filtered = utils.filter_dismissed_checks(results, dismiss_check_details)
                if not are_dismissed_checks_filtered:
                    logging.error(MESSAGE_SKIP_DISMISS_SYSTEM_CHECK)
                    results = results_dismissed_checks_copy
                if results:
                    scan_report['status'] = PROGRESS_COMPLETE
                    scan_report['progress'] = 100
                    scan_report['message'] = MESSAGE_SCAN_SUCCESS.format(results.get("host"))
                    if results.get("summary", {}):
                        results["summary"]["scan_type"] = scan_type
                scan_report.update({
                    'results': results
                })
                return utils.render_json(scan_report)

