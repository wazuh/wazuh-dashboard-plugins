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

logging = logger_manager.setup_logging("jura_remote_schedule_scan")

if sys.platform == "win32":
    import msvcrt

    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class RemoteScheduleScanHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /remote_schedule_scan,
    then this class will attempt to run a function named get_remote_schedule_scan().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /remote_schedule_scan, then this class will attempt to execute post_remote_schedule_scan().
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
                disabled = int(str(request_body.get("disabled", "0")))
                schedule_scan_type = request_body.get("schedule_scan_type", "default").lower()
                if schedule_scan_type == "default":
                    day = 1
                    hours = 4
                    minutes = 0
                    am_pm = "AM"
                    self.timezone_offset = request_body.get("time_offset", "")
                elif schedule_scan_type == "custom":
                    day = str(request_body.get("day", ""))
                    hours = str(request_body.get("hours", ""))
                    minutes = str(request_body.get("minutes", ""))
                    am_pm = request_body.get("am_pm", "").strip().upper()
                    self.timezone_offset = request_body.get("time_offset", "")

                    if not (day.isdigit() and 1 <= int(day) <= 30):
                        return utils.render_error_json(MESSAGE_INVALID_DAY, 400, False)
                    if not (hours.isdigit() and 1 <= int(hours) <= 12):
                        return utils.render_error_json(MESSAGE_INVALID_HOURS, 400, False)
                    if not (minutes.isdigit() and 0 <= int(minutes) <= 59):
                        return utils.render_error_json(MESSAGE_INVALID_MINUTES, 400, False)
                    if not (am_pm == "AM" or am_pm == "PM"):
                        return utils.render_error_json(MESSAGE_INVALID_AM_PM, 400, False)
                    if not self.timezone_offset:
                        return utils.render_error_json(MESSAGE_INVALID_TIMEZONE_OFFSET, 400, False)
                else:
                    return utils.render_error_json(MESSAGE_INVALID_SCHEDULE_SCAN_TYPE, 400, False)

                schedule_scan_details = dict()
                schedule_scan_details["user"] = self.user
                schedule_scan_details["host"] = self.host
                schedule_scan_details["day"] = day
                schedule_scan_details["hours"] = hours
                schedule_scan_details["minutes"] = minutes
                schedule_scan_details["am_pm"] = am_pm
                schedule_scan_details["schedule_scan_type"] = schedule_scan_type
                schedule_scan_details["timestamp"] = int(time.time())
                schedule_scan_details["disabled"] = disabled
                schedule_scan_details["time_offset"] = self.timezone_offset


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
                    return function_to_call(schedule_scan_details)
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

    def add_scan_details_kvstore(self, endpoint, scan_details):
        """
        Add the scan details to kvstore.
        :param endpoint: Kvstore endpoint to which details are to be added.
        :param scan_details: Scan details which are to be saved in kvstore.
        :returns Whether scan details were saved or not.
        """
        try:
            response, _ = sr.simpleRequest(
                    endpoint,
                    sessionKey=self.session_key,
                    jsonargs=json.dumps(scan_details),
                    method="POST",
                    raiseAllErrors=True,
                )
            if response["status"] not in success_codes:
                logging.error(
                    MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_UPDATE.format(self.user, self.host)
                )
                return None
            return True
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_REMOTE_SCHEDULE_SCAN_UPDATE.format(self.user, self.host , str(e)))
            return None

    def post_remote_schedule_scan(self, request_body):
        """
        Store the scan scheduling details in kv store

        :param request_body: The scan details to be updated.

        :return Whether the scan scheduling details were stored.
        """
        scan_details = self.get_remote_scan_details()
        if scan_details is None:
            return utils.render_error_json(MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_READ.format(self.user, self.host))
        if scan_details:
            # entry already exists in kvstore so update that
            endpoint = "{}/{}".format(jra_remote_schedule_scan_endpoint, scan_details['_key'])
        else:
            # there is no entry in kvstore so add new entry
            endpoint = jra_remote_schedule_scan_endpoint
        if request_body["disabled"] and scan_details:
            scan_details["disabled"] = 1
        else:
            scan_details = request_body
        scan_details['is_updated'] = True
        is_scan_details_added = self.add_scan_details_kvstore(endpoint, scan_details)
        if not is_scan_details_added:
            return utils.render_error_json(MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_UPDATE.format(self.user, self.host))
        else:
            return utils.render_msg_json(MESSAGE_SUCCESS_REMOTE_SCHEDULE_SCAN_UPDATE.format(self.user, self.host))

    def get_remote_scan_details(self):
        """
        Get the saved remote schedule scan details from kvstore.
        :returns Details of remote schedule scan details.
        """
        try:
            try:
                response, content = sr.simpleRequest(
                    jra_remote_schedule_scan_endpoint,
                    sessionKey=self.session_key,
                )
            except Exception as e:
                logging.exception(
                    MESSAGE_EXCEPTION_REMOTE_SCHEDULE_SCAN_READ.format(self.user, self.host, str(e))
                )
                return None
            if response["status"] not in success_codes:
                logging.error(MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_READ.format(self.user, self.host))
                return None
            schedule_scan_details = dict()
            for schedule_scan_detail in json.loads(content):
                schedule_scan_details = schedule_scan_detail
            return schedule_scan_details
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_REMOTE_SCHEDULE_SCAN_READ.format(self.user, self.host, str(e)))
            return None

    def get_remote_schedule_scan(self):
        """
        Get the scan schedule details from kv store

        :return Scan schedule details
        """
        scan_details = self.get_remote_scan_details()
        if scan_details is None:
            return utils.render_error_json(MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_READ.format(self.user, self.host))
        return utils.render_json(scan_details)
