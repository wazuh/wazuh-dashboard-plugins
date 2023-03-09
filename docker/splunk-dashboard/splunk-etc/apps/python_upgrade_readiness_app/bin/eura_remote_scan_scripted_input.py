import sys
import os
import json
import splunk.rest as sr
import datetime
import time

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
import pura_python_toggle_utils as toggle_utils

logging = logger_manager.setup_logging('eura_remote_scan_scripted_input')

class RemoteScan:
    def __init__(self, session_key):
        self.session_key = session_key
        self.host = ""
        self.all_hosts = []

    def get_remote_scan_details(self):
        """
        Get the saved remote schedule scan details from kvstore.
        :returns Details of remote schedule scan details.
        """
        try:
            try:
                response, content = sr.simpleRequest(
                    era_remote_schedule_scan_endpoint,
                    sessionKey=self.session_key,
                )
            except Exception as e:
                logging.exception(
                    MESSAGE_EXCEPTION_REMOTE_SCHEDULE_SCAN_READ.format("", self.host, str(e))
                )
                return {}
            if response["status"] not in success_codes:
                logging.error(MESSAGE_ERROR_REMOTE_SCHEDULE_SCAN_READ.format("", self.host))
                return {}
            schedule_scan_details = dict()
            for schedule_scan_detail in json.loads(content):
                schedule_scan_details = schedule_scan_detail
            return schedule_scan_details
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_REMOTE_SCHEDULE_SCAN_READ.format("", self.host, str(e)))
            return {}

    def get_one_shot_str(self, host, scan_details):
        one_shot_str = "| rest splunk_server=\"{}\"".format(host)
        one_shot_str = "{} disabled=\"{}\"".format(one_shot_str, scan_details['disabled'])
        one_shot_str = "{} schedule_scan_type=\"{}\"".format(one_shot_str, scan_details['schedule_scan_type'])
        one_shot_str = "{} day=\"{}\"".format(one_shot_str, scan_details['day'])
        one_shot_str = "{} hours=\"{}\"".format(one_shot_str, scan_details['hours'])
        one_shot_str = "{} minutes=\"{}\"".format(one_shot_str, scan_details['minutes'])
        one_shot_str = "{} am_pm=\"{}\"".format(one_shot_str, scan_details['am_pm'])
        one_shot_str = "{} time_offset=\"{}\"".format(one_shot_str, scan_details['time_offset'])
        one_shot_str = "{} services/eura_manage_remote_scan".format(one_shot_str)
        return one_shot_str

    def call_manage_scan_endpoint(self, service, host, scan_details):
        try:
            one_shot_str = self.get_one_shot_str(host, scan_details)
            reader = utils.one_shot_str_wrapper(one_shot_str, service)
            for item in reader:
                content = dict(item)
                content = json.loads(content["value"])
                msg = content
                logging.info("host {} response {}".format(host, msg))
            return True
        except Exception as e:
            logging.exception("Exception occurred while calling manage scan endpoint: {}".format(str(e)))
            return False

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
            timezone_offset = schedule_scan_details["time_offset"]
            timezone_seconds = 0

            if timezone_offset:
                timezone_details = timezone_offset.split(":")
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

    def save_schedule_scan_in_local(self, scan_details):
        try:
            cron_time = self.get_cron_format(scan_details)
            if cron_time is None:
                return False
            scan_details["disabled"] = int(str(scan_details["disabled"]))
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
        except Exception as e:
            logging.exception(str(e))
            return False
        if response["status"] not in success_codes:
            logging.error(MESSAGE_ERROR_SCHEDULE_SCAN_INTERVAL.format("", self.host))
            return False
        return True

    def post(self):
        service = utils.get_connection_object(self.session_key)
        host_details = utils.get_host_details(service)
        self.host = host_details["host"]
        self.all_hosts = host_details["all_hosts"]

        # get saved remote schedule scan details
        scan_details_remote = self.get_remote_scan_details()
        if (not scan_details_remote.get('is_updated', False)):
            logging.info("Skipping to call pipe rest command.")
            return

        for host in self.all_hosts:
            hostname = host['host']
            logging.info("calling host {}".format(hostname))
            if not scan_details_remote.get("is_updated", False):
                logging.info(
                    "Skipping to call pipe rest command on host: {} in remote".format(hostname))
                continue
            if hostname == self.host:
                continue
            else:
                _ = self.call_manage_scan_endpoint(service, hostname, scan_details_remote)

        _ = self.save_schedule_scan_in_local(scan_details_remote)
        return


if __name__ == "__main__":
    sessionKey = sys.stdin.readline().strip()
    obj = RemoteScan(session_key=sessionKey)
    try:
        obj.post()
    except Exception as e:
        logging.exception(str(e))
