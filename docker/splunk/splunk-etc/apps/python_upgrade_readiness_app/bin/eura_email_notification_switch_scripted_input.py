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

logging = logger_manager.setup_logging('eura_email_notification_scripted_input')

class EmailSwitch:
    def __init__(self, session_key):
        self.session_key = session_key
        self.host = ""
        self.all_hosts = []

    def get_one_shot_str(self, host, email_switch_details):
        """Get the one shot string for making rest call.

        :param host: hostname where the rest call is to be made.
        :param email_switch_details: dictionary containing details for email switch.
        :return: string containing query for making the rest call.
        """
        one_shot_str = "| rest splunk_server=\"{}\"".format(host)
        one_shot_str = "{} is_era_email_enabled=\"{}\"".format(one_shot_str, email_switch_details['is_era_email_enabled'])
        one_shot_str = "{} services/eura_manage_email_notification_switch".format(one_shot_str)
        return one_shot_str

    def call_manage_email_switch_endpoint(self, service, host, email_switch_details):
        """
        Call the rest endpoint using the one shot str.

        :param service: service object
        :param host: hostname where the rest call is to be made.
        :param email_switch_details: dictionary containing email switch details.
        :return: whether rest call was successful or not.
        """
        try:
            one_shot_str = self.get_one_shot_str(host, email_switch_details)
            reader = utils.one_shot_str_wrapper(
                one_shot_str,
                service
            )
            for item in reader:
                content = dict(item)
                content = json.loads(content["value"])
                msg = content
                logging.info("host {} response {}".format(host, msg))
            return True
        except Exception as e:
            logging.exception("Exception occurred while calling manage scan endpoint: {}".format(str(e)))
            return False

    def post(self):
        service = utils.get_connection_object(self.session_key)
        host_details = utils.get_host_details(service)
        self.host = host_details["host"]
        self.all_hosts = host_details["all_hosts"]

        email_switch_details = utils.get_details_from_kvstore(
            era_email_switch_endpoint,
            self.session_key,
            "",
            self.host
        )
        if (email_switch_details is None) or (not email_switch_details.get('is_updated', False)):
            logging.info("Skipping to call pipe rest command.")
            return
        for host in self.all_hosts:
            hostname = host['host']
            logging.info("calling host {}".format(hostname))
            if hostname == self.host:
                continue
            else:
                _ = self.call_manage_email_switch_endpoint(service, hostname, email_switch_details)

        _ = utils.save_email_switch_details_in_local(email_switch_details, self.session_key, "", self.host)
        return


if __name__ == "__main__":
    sessionKey = sys.stdin.readline().strip()
    obj = EmailSwitch(session_key=sessionKey)
    try:
        obj.post()
    except Exception as e:
        logging.exception(str(e))
