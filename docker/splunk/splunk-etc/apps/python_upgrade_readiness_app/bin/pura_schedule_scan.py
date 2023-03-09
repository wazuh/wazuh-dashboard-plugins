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

logging = logger_manager.setup_logging("pura_schedule_scan")

if sys.platform == "win32":
    import msvcrt

    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class ScheduleScanHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /schedule_scan,
    then this class will attempt to run a function named get_schedule_scan().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /schedule_scan, then this class will attempt to execute post_schedule_scan().
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
            return method + re.sub(r"[^a-zA-Z0-9_]", "_", path).lower()
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
            self.server_name = args["server"]["servername"]

            # Get the method
            method = args["method"]

            # Get the path and the args
            if "rest_path" in args:
                path = args["rest_path"]
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403)

            # Get the request body
            if method.lower() == "post":
                if "payload" in args:
                    request_body = json.loads(args["payload"])
                else:
                    return utils.render_error_json(MESSAGE_NO_REQUEST_BODY, 400)
            elif method.lower() == "get":
                self.include_headers = args.get('query_parameters', {}).get('include_headers', True)
                if str(self.include_headers).lower() == "false":
                    self.include_headers = False
                else:
                    self.include_headers = True
            if method.lower() == "post":
                schedule_scan_type = request_body.get("schedule_scan_type", "default").lower()
                disabled = str(request_body.get("disabled", "0"))
                if schedule_scan_type == "default":
                    day = 1
                    hours = 1
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
                        return utils.render_error_json(MESSAGE_INVALID_DAY, 400)
                    if not (hours.isdigit() and 1 <= int(hours) <= 12):
                        return utils.render_error_json(MESSAGE_INVALID_HOURS, 400)
                    if not (minutes.isdigit() and 0 <= int(minutes) <= 59):
                        return utils.render_error_json(MESSAGE_INVALID_MINUTES, 400)
                    if not (am_pm == "AM" or am_pm == "PM"):
                        return utils.render_error_json(MESSAGE_INVALID_AM_PM, 400)
                    if not self.timezone_offset:
                        return utils.render_error_json(MESSAGE_INVALID_TIMEZONE_OFFSET, 400)
                else:
                    return utils.render_error_json(MESSAGE_INVALID_SCHEDULE_SCAN_TYPE, 400)

                schedule_scan_details = dict()
                schedule_scan_details["user"] = self.user
                schedule_scan_details["host"] = self.server_name
                schedule_scan_details["day"] = day
                schedule_scan_details["hours"] = hours
                schedule_scan_details["minutes"] = minutes
                schedule_scan_details["am_pm"] = am_pm
                schedule_scan_details["schedule_scan_type"] = schedule_scan_type
                schedule_scan_details["timestamp"] = int(time.time())
                schedule_scan_details['disabled'] = int(disabled)
                schedule_scan_details['is_updated'] = True
                schedule_scan_details['time_offset'] = self.timezone_offset

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

    def get_cron_format(self, schedule_scan_details):
        """
        Get the cron format for the schedule scan time

        :param schedule_scan_details: Schedule scan details provided in the input

        :return Time in cron format
        """
        try:
            day = schedule_scan_details["day"]
            hours = schedule_scan_details["hours"]
            minutes = schedule_scan_details["minutes"]
            am_pm = schedule_scan_details["am_pm"]
            timezone_seconds = 0

            if self.timezone_offset:
                timezone_details = self.timezone_offset.split(":")
                timezone_minutes = int(timezone_details[1])
                timezone_hours = int(timezone_details[0][1:])
                timezone_sign = timezone_details[0][0]
                timezone_seconds = timezone_minutes*60 + timezone_hours*60*60
                if timezone_sign == "-":
                    timezone_seconds = -1 * timezone_seconds
            local_gmt_offset = time.mktime(time.localtime()) - time.mktime(time.gmtime())
            total_seconds_offset = local_gmt_offset - timezone_seconds
            # convert to 24 hrs
            schedule_scan_time = "{}:{} {}".format(hours, minutes, am_pm)
            in_time = datetime.datetime.strptime(schedule_scan_time, "%I:%M %p")
            in_time = in_time + datetime.timedelta(seconds=total_seconds_offset)
            hours = in_time.hour
            minutes = in_time.minute
            logging.info("Scheduling scan for hours: {} minutes: {} disabled: {}".format(
                hours,
                minutes,
                schedule_scan_details["disabled"])
            )
            # create cron time format
            cron_time = "{} {} */{} * *".format(minutes, hours, day)
            return cron_time
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_CRON_TIME_FORMAT.format(str(e)))
            return None

    def get_saved_schedule_scan_details(self):
        try:
            file_details = pura_storage_utils.create_dirs_if_not_exists(schedule_scan_collection, "", self.server_name)
            content = pura_storage_utils.read(file_details["file_path"])
            if content is None:
                logging.error(MESSAGE_ERROR_READ_SCHEDULE_SCAN_DETAILS.format(self.user, self.server_name))
                return None
            max_timestamp = None
            schedule_scan_details = dict()
            for schedule_scan_detail in content:
                if self.server_name == schedule_scan_detail["host"] and (max_timestamp is None or max_timestamp < int(
                        schedule_scan_detail["timestamp"]
                    )):
                    max_timestamp = int(schedule_scan_detail["timestamp"])
                    schedule_scan_details = schedule_scan_detail
            return schedule_scan_details
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_GET_SCHEDULE_SCAN.format(str(e)))
            return None

    def post_schedule_scan(self, scan_details):
        """
        Store the scan scheduling details in kv store

        :param scan_details: The scan details to be stored in kv store

        :return Whether the scan scheduling details were stored in kv store
        """
        # conver to cron format
        cron_time = self.get_cron_format(scan_details)
        if not cron_time:
            return utils.render_error_json(MESSAGE_ERROR_POST_SCHEDULE_SCAN)

        file_details = pura_storage_utils.create_dirs_if_not_exists(schedule_scan_collection, "", self.server_name)
        response = pura_storage_utils.add(file_details["file_path"], scan_details, True)
        if not response:
            logging.error(
                MESSAGE_ERROR_WRITE_SCHEDULE_SCAN_DETAILS.format(self.user, self.server_name)
            )
            return utils.render_error_json(MESSAGE_ERROR_POST_SCHEDULE_SCAN)
        return utils.render_json(MESSAGE_POST_SCHEDULE_SCAN.format(self.user, self.server_name))

    def get_schedule_scan(self):
        """
        Get the scan schedule details from kv store

        :return Scan schedule details
        """
        schedule_scan_details = self.get_saved_schedule_scan_details()
        if schedule_scan_details is None:
            return utils.render_error_json(MESSAGE_ERROR_GET_SCHEDULE_SCAN, include_headers=self.include_headers)
        if not schedule_scan_details:
            schedule_scan_details["schedule_scan_type"] = None
        return utils.render_json(schedule_scan_details, include_headers=self.include_headers)
