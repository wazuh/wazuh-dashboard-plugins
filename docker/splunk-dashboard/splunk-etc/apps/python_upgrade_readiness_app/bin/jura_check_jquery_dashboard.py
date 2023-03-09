import os
import sys
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
import jura_app_inspect_util as util


logging = logger_manager.setup_logging('jura_check_jquery_dashboard')

class DashboarXMLCheck:
    def __init__(self):
        self.report = {
            'description': 'Splunk dashboard jQuery version check',
            'name': 'check_for_xml_version_existance',
            'result': AI_RESULT_SUCCESS,
            'messages': []
        }
        self.report_exception = copy.deepcopy(self.report)

    def add_warning_message(self, file_path, remmediation_message, version):
        """
        Add warning message for the file path.
        :param file_path: Path of the file which is failing.
        :param remmediation_message: Remmediation message for the warning.
        :param version: List of versions in the dashboard.
        """
        try:
            message = {
                "line": None,
                "message_filename": file_path,
                "code": version,
                "result": "warning",
                "message_line": None,
                'filename': file_path,
                'dismissed': 0,
                'message': remmediation_message,
            }
            self.report["messages"].append(message)
        except Exception as e:
            logging.exception(str(e))

    def get_xml_files(self, app_name, app_path):
        """
        Get the xml files for an app.
        :param app_name: Name of the app for which xml files are to fetched.
        :param app_path: Path of the app for which xml files are to be fetched.
        :return List tuple of xml files containing file name and file path.
        """
        try:
            xml_files = []
            if app_path is None:
                dir_path = os.path.join(OTHER_APPS_DIR, app_name)
            else:
                dir_path = app_path
            dir_path = os.path.join(dir_path, "default", "data", "ui", "views")
            if not os.path.exists(dir_path):
                return []
            xml_files = []
            for root, dirs, files in os.walk(dir_path):
                for file_name in files:
                    if file_name.endswith(".xml"):
                        file_path = os.path.join(root, file_name)
                        xml_files.append((file_name, file_path))
            return xml_files
        except Exception as e:
            logging.exception(str(e))
            return []

    def find_version_in_xml(self, xml_files):
        """
        Find the version for the xml files and flag the files for which version is less than 1.1.
        :param xml_files: List of the xml files.
        """
        try:
            nodes = [util.xml_node("dashboard"), util.xml_node("form")]
            query_nodes = util.get_dashboard_nodes(xml_files)
            for query_node, file_path in query_nodes:
                logging.info("Scanning file: {}".format(file_path))
                version = query_node.get("version", "").strip()
                if not version:
                    self.add_warning_message(file_path, MESSAGE_VERSION_NOT_SET.format(file_path), "")
                elif (version != "1.1" and version != "2"):
                    self.add_warning_message(file_path, MESSAGE_VERSION_LESS.format(file_path, version), version)
        except Exception as e:
            logging.exception(str(e))

    def check_dashboard_xml(self, app_name, app_path):
        """
        Check that the dashboards in your app have a valid version attribute.
        :param app_name: Name of the app is to be scanned for dashboard xml.
        :param app_path: Path of the app is to be scanned for dashboard xml.
        """
        try:
            logging.info("Starting check for dashboard and form xml.")
            xml_files = self.get_xml_files(app_name, app_path)
            self.find_version_in_xml(xml_files)
            if self.report.get("messages"):
                self.report["result"] = AI_RESULT_FAILURE
            logging.info("Completed to check for dashboard and form xml.")
            return self.report
        except Exception as e:
            logging.exception(e)
            return self.report_exception
