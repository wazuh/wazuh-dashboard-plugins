import os
import sys
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

logging = logger_manager.setup_logging("eura_manage_remote_scan")

if sys.platform == "win32":
    import msvcrt

    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class ManageRemoteScanHandler(PersistentServerConnectionApplication):
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

        return "manage_remote_scan"

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
                disabled = int(str(query_params.get("disabled", "0")))
                schedule_scan_type = query_params.get("schedule_scan_type", "default").lower()
                if schedule_scan_type == "default":
                    day = 1
                    hours = 1
                    minutes = 0
                    am_pm = "AM"
                    self.timezone_offset = query_params.get("time_offset", "")
                elif schedule_scan_type == "custom":
                    day = str(query_params.get("day", ""))
                    hours = str(query_params.get("hours", ""))
                    minutes = str(query_params.get("minutes", ""))
                    am_pm = query_params.get("am_pm", "").strip().upper()
                    self.timezone_offset = query_params.get("time_offset", "")

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
                    return function_to_call(schedule_scan_details)

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

    def manage_remote_scan(self, scan_details):
        """
        Store the scan scheduling details in kv store

        :param scan_details: The scan details to be stored in kv store

        :return Whether the scan scheduling details were stored in kv store
        """
        # conver to cron format
        cron_time = self.get_cron_format(scan_details)
        if not cron_time:
            return utils.render_error_json(MESSAGE_ERROR_POST_SCHEDULE_SCAN, include_headers=False)

        # change the interval time of the scripted input
        try:
            post_args = {"interval": cron_time, "disabled": scan_details["disabled"]}
            logging.info("APP_DIR {}".format(APP_DIR))
            if APP_DIR == OTHER_APPS_DIR:
                # if app is in etc/apps
                scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fapps%252Fpython_upgrade_readiness_app%252Fbin%252Feura_scan_apps.py"
            else:
                scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fslave-apps%252Fpython_upgrade_readiness_app%252Fbin%252Feura_scan_apps.py"
            logging.info("scriped_input_endpoint {}".format(scripted_input_endpoint))
            response, content = sr.simpleRequest(
                "{}?output_mode=json".format(
                    schedule_scan_interval_endpoint.format(scripted_input_endpoint)),
                    sessionKey=self.session_key,
                    postargs=post_args,
                    method="POST",
                    raiseAllErrors=True,
            )
        except Exception:
            logging.exception(MESSAGE_EXCEPTION_SCHEDULE_SCAN_INTERVAL.format(self.user, self.host))
            return utils.render_error_json(MESSAGE_ERROR_POST_SCHEDULE_SCAN, include_headers=False)
        if response["status"] not in success_codes:
            logging.error(MESSAGE_ERROR_SCHEDULE_SCAN_INTERVAL.format(self.user, self.host))
            return utils.render_error_json(MESSAGE_ERROR_POST_SCHEDULE_SCAN, include_headers=False)
        return utils.render_json(MESSAGE_POST_MANAGE_SCAN_SCHEDULE.format(self.user, self.host), include_headers=False)
