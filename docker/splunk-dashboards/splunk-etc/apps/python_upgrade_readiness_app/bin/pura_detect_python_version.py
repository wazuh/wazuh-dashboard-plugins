from splunk.clilib import cli_common as cli
import splunk.rest as sr
import sys
import os
import json
from datetime import (datetime, timezone)


if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_python_toggle_utils as python_toggle_utils
import splunklib.client as client
import splunklib.results as results


MESSAGE_FAILED_TO_GET_PYTHON_VERSION = "Could not get current python version"
MESSAGE_EXCEPTION_REST_CALL = "Could not make request to Splunk: {}"
PYTHON_VERSION_FILE_PATH = os.path.join(LOCAL_DIR, "python_version.json")
SUBJECT_FOR_VERSION_UPGRADED = "Default Python Version Updated in Splunk"
MESSAGE_VERSION_UPGRADED = "Python Version Upgraded."
BODY_VERSION_UPGRADED = """\
<html>
    <head></head>
    <body>
        <p>Hello,</p>
        <p>On {}, the default Python version was updated. To address Python issues within apps, visit the Upgrade Readiness App for troubleshooting.</p>
        <p>- Upgrade Readiness App</p>
    </body>
</html>
"""

logging = logger_manager.setup_logging('pura_detect_python_version')


class NotFoundPythonVersion(Exception):
    pass

def get_default_python_stack():
    try:
        return cli.getConfKeyValue('server', 'general', 'python.version')
    except Exception as e:
        logging.exception(str(e))
    return None


def write_python_version(python_version):
    if not os.path.exists(LOCAL_DIR):
        os.mkdir(LOCAL_DIR)    
    with open(PYTHON_VERSION_FILE_PATH, "w") as version_file:
        json.dump({ "python_version" : python_version }, version_file)


def check_python_version_upgraded(python_version):
    """
    Check whether python version upgraded or not

    :param python_version: Python Version
    :param session_key: Session Key of the logged in user

    :return True if python version upgraded otherwise False
    """
    is_upgraded = False
    try:
        with open(PYTHON_VERSION_FILE_PATH, "r") as version_file:
            old_python_version = json.load(version_file).get("python_version")
            if old_python_version:
                is_upgraded = old_python_version != python_version
                if not is_upgraded:
                    return False
        write_python_version(python_version)
    except FileNotFoundError:
        try:
            write_python_version(python_version)
        except Exception as e:
            logging.exception(e)    
    except Exception as e:
        logging.exception(e)
    return is_upgraded


if __name__ == "__main__":
    try:
        sessionKey = sys.stdin.readline().strip()
        if not python_toggle_utils.check_host_is_search_head(sessionKey):
            exit()
        python_version = get_default_python_stack()

        if not python_version:
            raise NotFoundPythonVersion(MESSAGE_FAILED_TO_GET_PYTHON_VERSION)

        if check_python_version_upgraded(python_version):
            logging.info(MESSAGE_VERSION_UPGRADED)
            if python_toggle_utils.check_host_is_not_shc_member(sessionKey):
                utc_date_time = datetime.utcnow()
                mail_date_time = datetime.strftime(utc_date_time,'%d %b %Y %H:%M:%S') + " +UTC" 
                is_email_sent, email_status = python_toggle_utils.send_mail_to_all_sc_admins(sessionKey, BODY_VERSION_UPGRADED.format(mail_date_time), SUBJECT_FOR_VERSION_UPGRADED, "html")
                if is_email_sent:    
                    logging.info(email_status)
                else:
                    logging.error(email_status)
    except Exception as e:
        logging.exception(str(e))