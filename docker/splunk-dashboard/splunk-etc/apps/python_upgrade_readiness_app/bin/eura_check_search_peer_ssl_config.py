import os
import sys
import json
import copy

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
import pura_utils as utils
import six
if six.PY2:
    from io import open

logging = logger_manager.setup_logging('eura_search_peer_ssl_config')


class SearchPeerSSLConfig:
    def __init__(self, is_cloud, session_key):
        self.report = {
            'description': 'This config requires updates to use SSL connections in accordance with Splunk Enterprise 9.0 changes. <link to documentation>',
            'name': 'check_for_search_peer_config',
            'label': 'Search peer SSL config check',
            "summary": {
                "Status": CHECK_CONST_PASSED,
                "dismiss": 0,
                "dismiss_date": "",
                "type": "config",
            },
            "required_action": "None",
            "details": EMERALD_DETAILS_COMPATIBLE.format("configuration"),
            "config": "",
            "filepath": "",
            "message": ""
        }
        self.libs = "libs_py2"
        if six.PY2:
            self.libs = "libs_py2"
        elif six.PY3:
            self.libs = "libs_py3"
        self.report_exception = copy.deepcopy(self.report)
        self.is_cloud = is_cloud
        self.session_key = session_key

    def add_warning_message(self, required_action):
        """
        Add warning message for the file path.
        :param required_action: Required Action message.
        """
        self.report['summary']['Status'] = CHECK_CONST_BLOCKER
        self.report["required_action"] = required_action
        self.report["details"] = EMERALD_DETAILS_NOT_COMPATIBLE.format("configuration")

    def verify_config_param_set(self):
        """verify if the config param is set for not

        Returns:
            string: "1" if config flag is set else "0"
        """
        service = utils.get_connection_object(self.session_key)
        one_shot_str = "| rest /services/configs/conf-server/sslConfig"
        reader = utils.one_shot_str_wrapper(one_shot_str, service)
        requireClientCert = "0"
        verifyServerCert = "0"
        for item in reader:
            content = dict(item)
            if content.get("requireClientCert") is None:
                logging.info("Parameter: {} in config is unset.".format("requireClientCert"))
                requireClientCert = "0"
            else:
                requireClientCert = str(content.get("requireClientCert"))
            if content.get("verifyServerCert")is None:
                logging.info("Parameter: {} in config is unset.".format("verifyServerCert"))
                verifyServerCert = "0"
            else:
                verifyServerCert = str(content.get("verifyServerCert"))
        return {"requireClientCert": requireClientCert, "verifyServerCert": verifyServerCert}


    def check_search_peer_ssl_config(self,):
        """
        Check SSL search peer configs.
        """
        try:
            logging.info("Starting check for search peer SSL config.")
            config_params = self.verify_config_param_set()
            requireClientCert = config_params["requireClientCert"]
            verifyServerCert = config_params["verifyServerCert"]
            if (requireClientCert == "0") or (verifyServerCert == "0"):
                self.add_warning_message(EMERALD_SYSTEM_CONFIG_REQUIRED_ACTION)
            logging.info("Completed check for search peer SSL config.")
            return self.report
        except Exception as e:
            logging.exception(e)
            return self.report_exception

