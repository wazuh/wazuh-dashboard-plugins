import os
import sys
import re
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
import jura_app_inspect_util as util
import six
import six
if six.PY2:
    from io import open

logging = logger_manager.setup_logging('jura_check_splunk_internal_library')


class SplunkInternalLibraryCheck:
    def __init__(self):
        self.report = {
            'description': 'Splunk internal library check',
            'name': 'check_for_splunk_internal_library_existance',
            'result': AI_RESULT_SUCCESS,
            'messages': []
        }
        self.libs = "libs_py2"
        if six.PY2:
            self.libs = "libs_py2"
        elif six.PY3:
            self.libs = "libs_py3"
        self.report_exception = copy.deepcopy(self.report)

    def read_disallowed_list(self):
        try:
            logging.info("Getting disallowed list.")
            dir_path = os.path.join(APP_DIR, SELF_DIR_NAME, "bin", self.libs, "pura_libs_utils")
            file_path = os.path.join(dir_path, "disAllowList.json")
            web_core_contents = []
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                web_core_contents = json.load(f)
            file_path2 = os.path.join(dir_path, "disAllowList2.json")
            web_core_contents2 = []
            with open(file_path2, "r", encoding="utf-8", errors="ignore") as f:
                web_core_contents2 = json.load(f)
            all_web_core_contents = web_core_contents + web_core_contents2
            return list(set(all_web_core_contents))
        except Exception as e:
            logging.exception(str(e))
            return []

    def add_warning_message(self, file_path, bad_imports):
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
            message['message'] = MESSAGE_INTERNAL_LIBARY_REMEDIATION.format(file_path, bad_imports_str)
            self.report["messages"].append(message)
        except Exception as e:
            logging.exception(str(e))

    def get_all_files(self, app_name, app_path):
        """
        Get all the js files for the app name and app path.
        :param app_name: Name of the application.
        :param app_path: Path of the application.
        :return List of js files.
        """
        try:
            logging.info("Getting all the js files.")
            js_files = []
            if app_path is None:
                dir_path = os.path.join(OTHER_APPS_DIR, app_name)
            else:
                dir_path = os.path.join(app_path)
            if not os.path.exists(dir_path):
                return []
            js_file_path = os.path.join(dir_path, "appserver", "static")
            for root, dirs, files in os.walk(js_file_path):
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    if file_name.endswith(".js"):
                        js_files.append((file_name, file_path))
            return js_files
        except Exception as e:
            logging.exception(str(e))
            return []

    def find_internal_library_in_js(self, js_files, disallowed_list):
        """
        Find internal libraries in js files.
        :param js_files: list containing all the js files in a tuple with filename and filepath.
        :param disallowed_list: list of imports which are not allowed.
        """
        logging.info("Finding internal splunk libraries in js.")
        for file_name, file_path in js_files:
            try:
                logging.info("Scanning file: {} for internal splunk library".format(file_path))
                with open(file_path, "r", encoding="utf-8", errors="ignore") as my_file:
                    matches = util.get_imported_matches(my_file.read())
                    bad_imports = set()
                    for match in matches:
                        match = match.strip()
                        if match in disallowed_list:
                            bad_imports.add(match)
                    if bad_imports:
                        self.add_warning_message(file_path, bad_imports)
            except Exception as e:
                logging.exception(str(e))

    def check_splunk_internal_library(self, app_name, app_path):
        """
        Check that the imports in js are valid.
        :param app_name: Name of the app to be scanned.
        :param app_path: Path of the app to be scanned.
        """
        try:
            logging.info("Starting check for splunk internal libraries.")
            js_files = self.get_all_files(app_name, app_path)
            disallowed_list = self.read_disallowed_list()
            self.find_internal_library_in_js(js_files, disallowed_list)
            if self.report.get("messages"):
                self.report["result"] = AI_RESULT_FAILURE
            logging.info("Completed check for splunk internal libraries.")
            return self.report
        except Exception as e:
            logging.exception(e)
            return self.report_exception
