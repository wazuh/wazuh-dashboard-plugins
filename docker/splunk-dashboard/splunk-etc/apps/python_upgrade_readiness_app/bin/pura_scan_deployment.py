import os
import re
import sys
import json
import time
import shlex
import subprocess
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
from pura_libs_utils import six
from builtins import str
import pura_app_list
import pura_storage_utils
from filelock import Timeout, FileLock
if six.PY3:
    from itertools import zip_longest
elif six.PY2:
    from itertools import izip_longest as zip_longest

logging = logger_manager.setup_logging('pura_scan_deployment')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class ScanDeploymentHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /scan_deployment,
    then this class will attempt to run a function named get_scan_deployment().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /scan_deployment, then this class will attempt to execute post_scan_deployment().
    """

    def __init__(self, command_line, command_arg):
        PersistentServerConnectionApplication.__init__(self)

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
            self.args = args
            self.scan_key = None


            # Get the path and the args
            if 'rest_path' in args:
                _ = args['rest_path']
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403)

            # Get the request body
            if 'payload' in args:
                request_body = json.loads(args['payload'])
            else:
                return utils.render_error_json(MESSAGE_NO_REQUEST_BODY, 400)

            if not request_body.get('apps'):
                scan_type = request_body.get('scanType', 'deployment')
                applist_obj = pura_app_list.AppListHandler()
                args = self.args
                args['rest_path'] = "pura_app_list"
                args['query_parameters'] = {'type': scan_type}
                args['method'] = "get"
                args['query'] = [['type', scan_type]]
                applist_response = applist_obj.handle(json.dumps(args))
                if(str(applist_response["status"]) not in success_codes):
                    return applist_response
                applist = json.loads(applist_response["payload"])
                request_body["apps"] = applist
            if not os.path.exists(LOCAL_DIR):
                os.mkdir(LOCAL_DIR)
            pura_entry_lock = FileLock(
                os.path.join(os.path.dirname(__file__), "..", "local", "pura_entry.lock")
            )
            logging.info("Checking if any scans for the user {} are in progress.".format(self.user))
            force_scan = request_body.get("forceScan", False)
            # Acquire lock
            with pura_entry_lock.acquire(timeout=120, poll_intervall=5):
                logging.info("Acquired lock, checking if any scans are in progress.")

                # Check for existing scan
                if not force_scan:
                    existing_status, existing_message = self.check_existing_scan()
                    if existing_status:
                        return utils.render_error_json(existing_message)

                    logging.info(existing_message)

                # Creating new scan report
                scan_report = dict()
                results = dict()
                scan_report['status'] = PROGRESS_INIT
                scan_report['results'] = results
                scan_report['message'] = MESSAGE_NO_SCAN_RESULTS
                scan_report['progress'] = 0
                scan_key_value = "{}_{}".format(str(time.time()), self.user)

                proceed = self.first_progress(scan_report, scan_key_value)
                if not proceed:
                    logging.info(MESSAGE_ERROR_WRITING_PROGRESS.format(self.user, self.host))
                    return utils.render_error_json(MESSAGE_ERROR_WRITING_PROGRESS.format(self.user, self.host))

                logging.info("Starting scan process")

                arg_vars = dict()
                arg_vars["session_key"] = self.session_key
                arg_vars["user"] = self.user
                arg_vars["host"] = self.host
                arg_vars["request_body"] = request_body
                arg_vars["scan_key"] = scan_key_value
                arg_vars["cancel_scan_key"] = scan_key_value

                DEVNULL_PATH = open(os.devnull, 'wb')
                if six.PY2:
                    command = "\"{}\" cmd python \"{}\"".format(SPLUNK_PATH, PROCESS_PATH)
                elif six.PY3:
                    command = "\"{}\" cmd python3 \"{}\"".format(SPLUNK_PATH, PROCESS_PATH)
                if os.name == "nt":
                    scan_process = subprocess.Popen(shlex.split(command), stdin=subprocess.PIPE,
                                                    stdout=DEVNULL_PATH, stderr=DEVNULL_PATH, shell=False,
                                                    creationflags=DETACHED_PROCESS)
                else:
                    scan_process = subprocess.Popen(shlex.split(command), stdin=subprocess.PIPE,
                                                    stdout=DEVNULL_PATH, stderr=DEVNULL_PATH, shell=False)
                scan_process.stdin.write((json.dumps(arg_vars).encode('utf-8')))
                scan_process.stdin.close()
                DEVNULL_PATH.close()
                # Return main thread to acknowledge successful trigger
                return utils.render_msg_json(MESSAGE_SCAN_CALLED)
        
        except Timeout:
            logging.error("Failed to acquire lock in given timeout.")
            pura_entry_lock.release(force=True)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            pura_entry_lock.release(force=True)
            return utils.render_error_json(str(exception))

    def check_existing_scan(self):
        """
        Check if any existing scan is going on for given user on the host.

        :return Status(true/false), Message
        """
        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_get_progress_collection, self.user, self.host)
        if not file_details:
            logging.error(MESSAGE_ERROR_READING_SCAN_STATUS.format(self.user, self.host))
            return True, MESSAGE_ERROR_READING_SCAN_STATUS.format(self.user, self.host)

        content = pura_storage_utils.read(file_details["file_path"])

        if content is None:
            logging.error(MESSAGE_ERROR_READING_SCAN_STATUS.format(self.user, self.host))
            return True, MESSAGE_ERROR_READING_SCAN_STATUS.format(self.user, self.host)

        for entry in content:
            if (self.host == entry.get('host')) and (self.user == entry.get('user')) and (entry.get('status') != PROGRESS_COMPLETE) and (entry.get('status') != PROGRESS_ERROR):
                logging.info(MESSAGE_SCAN_IN_PROGRESS.format(self.user, self.host))
                return True, MESSAGE_SCAN_IN_PROGRESS.format(self.user, self.host)

        return False, MESSAGE_NO_EXISTING_SCAN


    def first_progress(self, scan_report, scan_key_value):
        """
        Write first progress in KV store.

        :param scan_report: current scan report

        :return Proceed(True/False) based on whether scan is cancelled or not
        """

        data = {
            '_key': scan_key_value,
            'process_id': os.getpid(),
            'host': self.host,
            'user': self.user,
            'progress': 0,
            'status': PROGRESS_NEW,
            'message': "Running new scan"
        }

        data.update({
            'progress': scan_report['progress'],
            'status': scan_report['status'],
            'message': scan_report['message']
        })

        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_get_progress_collection, self.user, self.host)
        response = pura_storage_utils.add(file_details["file_path"], data, True)

        if not response:
            logging.error(MESSAGE_ERROR_WRITING_PROGRESS.format(self.user, self.host))
            return False

        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_cancel_scan_collection, self.user, self.host)
        response = pura_storage_utils.add(file_details["file_path"], {"_key": scan_key_value, "host":self.host, "user":self.user, "cancelled":False}, True)

        if not response:
            logging.error(MESSAGE_ERROR_WRITING_PROGRESS.format(self.user, self.host))
            return False

        return True
