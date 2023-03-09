from datetime import datetime, timedelta
from time import sleep
import splunk.rest as sr
import sys
import json
import copy
import os

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
import pura_python_toggle_utils as toggle_utils

SLEEP_INTERVAL = 5  # in secs
POLL_TILL = 120  # in secs
SUCCESS_CODES = ["200", "201", "204"]

MESSAGE_EXCEPTION_REST_CALL = "Could not make request to Splunk: {}"
MESSAGE_ERROR_FETCHING_APPS = "Error fetching apps status code: {} content: {}"
MESSAGE_FAILED_SCAN = "Failed to scan apps: {}"
MESSAGE_ERROR_TRIGGER_SCAN = "Error triggering scan: status code: {} content: {}"
MESSAGE_ERROR_POLL_SCAN = "Error polling scan: status code: {} content: {}"
SCAN_TYPE = TYPE_DEPLOYMENT
APP_LIST_TYPE = SCAN_TYPE

logging = logger_manager.setup_logging('eura_scan_apps')


def get_all_apps(session_key):
    """
    Get all the apps

    :param session_key: Session Key of the logged in user

    :return List of all the applications
    """
    logging.info("Starting to get apps")
    endpoint = "/services/eura_app_list?type={}".format(APP_LIST_TYPE)
    try:
        response, content = sr.simpleRequest(path=endpoint, sessionKey=session_key, method="GET")
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_REST_CALL.format(str(e)))
        return []
    if str(response["status"]) not in SUCCESS_CODES:
        logging.error(MESSAGE_ERROR_FETCHING_APPS.format(response["status"], content))
        return []
    apps = []
    content = json.loads(content)
    for app in content:
        if app["visible"] == "ENABLED":
            apps.append(copy.deepcopy(app))
    logging.info("Successfully got apps")
    return apps

def trigger_scan(apps, session_key):
    """
    Start the scan for the apps

    :param apps: List of apps to be scanned
    :param session_key: Session Key of the logged in user

    :return Whether the scan was triggered or not
    """
    logging.info("Starting to trigger scan")
    endpoint = "/services/eura_scan_deployment"
    body = {"apps": apps, "scanType": SCAN_TYPE, "forceScan": True}
    try:
        response, content = sr.simpleRequest(path=endpoint, sessionKey=session_key, method="POST",
                                             jsonargs=json.dumps(body))
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_REST_CALL.format(str(e)))
        return False
    content = json.loads(content)
    if str(response["status"]) in SUCCESS_CODES:
        logging.info("Successfully triggered the scan")
        return True
    else:
        logging.error(MESSAGE_ERROR_TRIGGER_SCAN.format(response["status"], content))
        return False


def poll_scan(session_key):
    """
    Poll the scan at intervals

    :param session_key: Session Key of the logged in user
    """
    logging.info("Starting to poll")
    endpoint = "/services/eura_read_progress"
    start_date_time = datetime.utcnow()
    end_date_time = start_date_time + timedelta(seconds=POLL_TILL)
    temp_date_time = start_date_time
    is_scan_completed = False
    while temp_date_time < end_date_time:
        try:
            response, content = sr.simpleRequest(path=endpoint, sessionKey=session_key, method="GET")
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_REST_CALL.format(str(e)))
            return
        if str(response["status"]) not in SUCCESS_CODES:
            logging.error(MESSAGE_ERROR_POLL_SCAN.format(response["status"], content))
            return
        content = json.loads(content)
        logger_msg = "Scan progress: {0} Scan status: {1} Scan message: {2}".format(
            content.get("progress"), content.get("status"), content.get("message")
        )
        logging.info(logger_msg)
        if str(content.get("progress")) == "100":
            logging.info("Scan is completed")
            is_scan_completed = True
            break
        sleep(SLEEP_INTERVAL)
        temp_date_time = temp_date_time + timedelta(seconds=SLEEP_INTERVAL)
    if not is_scan_completed:
        logging.warning("Poll time completed but scan is not completed")


if __name__ == "__main__":
    try:
        sessionKey = sys.stdin.readline().strip()
        apps = get_all_apps(sessionKey)
        is_scan_triggered = trigger_scan(apps=apps, session_key=sessionKey)
        if is_scan_triggered:
            poll_scan(session_key=sessionKey)
    except Exception as e:
        logging.exception(MESSAGE_FAILED_SCAN.format(str(e)))
