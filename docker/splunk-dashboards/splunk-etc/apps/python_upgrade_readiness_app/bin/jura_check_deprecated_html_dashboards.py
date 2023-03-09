import os
import sys
import json
import copy
from typing import List

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
import six
if six.PY2:
    from io import open

logging = logger_manager.setup_logging('jura_check_deprecated_html_dashboards')


class SplunkDeprecatedHTMLDashboards:
    def __init__(self):
        self.report = {
            'description': 'Splunk deprecated html dashboards check',
            'name': 'check_for_deprecated_html_dashboards',
            'result': AI_RESULT_SUCCESS,
            'messages': []
        }
        self.libs = "libs_py2"
        if six.PY2:
            self.libs = "libs_py2"
        elif six.PY3:
            self.libs = "libs_py3"
        self.report_exception = copy.deepcopy(self.report)

    def add_warning_message(self, file_path, bad_imports, error_message=None):
        """
        Add warning message for the file path.
        :param file_path: Path of the file which is failing.
        :param bad_imports: List of bad imports.
        """
        try:
            bad_imports_str = ""
            try:
                bad_imports_str = ", ".join(sorted(bad_imports))
            except Exception as e:
                logging.error(str(e))
                bad_imports_str = ", ".join(bad_imports)
            message = {
                "line": None,
                "message_filename": file_path,
                "code": bad_imports_str,
                "result": "warning",
                "message_line": None,
                'filename': file_path,
                'dismissed': 0
            }
            bad_imports_str = "<badimport>{}".format(", ".join(bad_imports))
            message['message'] = error_message if error_message else MESSAGE_HOTLINKING_WEB_LIBRARY_REMEDIATION.format(file_path, bad_imports_str)
            self.report["messages"].append(message)
        except Exception as e:
            logging.exception(str(e))

    def get_html_dashboard_files(self, html_dashboard_filepath):
        """
        Get the html dashboard files.

        :param html_dashboard_filepath: Path of the dir from where html files are to fetched.
        :return: List of tuple containing html files [(filename, filepath)]
        """
        try:
            html_dashboard_files = []
            for root, dirs, files in os.walk(html_dashboard_filepath):
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    if file_name.endswith(".html"):
                        html_dashboard_files.append((file_name, file_path))
            return html_dashboard_files
        except Exception as e:
            logging.exception(str(e))
            return []

    def get_all_files(self, app_name, app_path):
        """
        Get all the html files for the app name and app path.
        :param app_name: Name of the application.
        :param app_path: Path of the application.
        :return List of js files.
        """
        try:
            logging.info("Getting all the html files.")
            html_dashboard_files = []
            html_local_dashboard_files = []
            if app_path is None:
                dir_path = os.path.join(OTHER_APPS_DIR, app_name)
            else:
                dir_path = os.path.join(app_path)
            if not os.path.exists(dir_path):
                return []
            html_dashboard_filepath = os.path.join(dir_path, "default", "data", "ui", "html")
            html_local_dashboard_filepath = os.path.join(dir_path, "local", "data", "ui", "html")
            html_dashboard_files = self.get_html_dashboard_files(html_dashboard_filepath)
            html_local_dashboard_files = self.get_html_dashboard_files(html_local_dashboard_filepath)
            all_html_files = []
            all_html_files.extend(html_dashboard_files)
            all_html_files.extend(html_local_dashboard_files)
            return all_html_files
        except Exception as e:
            logging.exception(str(e))
            return []

    def fail_html_dashboards(self, html_files:List):
        """
        Fail all HTML dashboards

        Args:
            html_files (List): paths of html files
        """
        for html_file, file_path in html_files:
            self.add_warning_message(file_path, [], error_message=FAIL_HTML_DASHBOARD_MESSAGE)

    def check_splunk_deprecated_html_dashboards(self, app_name, app_path):
        """
        Check that the imports in html are valid.
        :param app_name: Name of the app to be scanned.
        :param app_path: Path of the app to be scanned.
        """
        try:
            logging.info("Starting check for splunk deprecated html dashboards.")
            html_files = self.get_all_files(app_name, app_path)
            self.fail_html_dashboards(html_files)
            if self.report.get("messages"):
                self.report["result"] = AI_RESULT_FAILURE
            logging.info("Completed check for splunk deprecated html dashboards.")
            return self.report
        except Exception as e:
            logging.exception(e)
            return self.report_exception
