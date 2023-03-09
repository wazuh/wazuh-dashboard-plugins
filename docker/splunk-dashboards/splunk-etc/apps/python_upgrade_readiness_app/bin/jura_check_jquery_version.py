import os
import sys
import re
from distutils.version import LooseVersion
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
if six.PY2:
    from io import open

logging = logger_manager.setup_logging('jura_check_jquery_version')

# COMMENTS_REGEX = 'jQuery (([a-zA-Z]+\s){2})?v([0-9.]+(-rc[0-9.]+)?)'

# COMMENTS_REGEX1 to capture "jQuery JavaScript Library v3.1.0"
COMMENTS_REGEX1 = 'jQuery JavaScript Library v([0-9.]+(-rc[0-9.]+)?)'

# COMMENTS_REGEX2 to capture "jQuery v3.1.0"
COMMENTS_REGEX2 = 'jQuery v([0-9.]+(-rc[0-9.]+)?)'

VERSION_REGEX = '\d+\.\d+\.\d+'
FILENAME_REGEX = '^jquery-[\d+\.]*\d+\.min.js$'

class JQueryVersionCheck:
    def __init__(self):
        self.report = {
            'description': 'Splunk jQuery version check',
            'name': 'check_for_jquery_version_existance',
            'result': AI_RESULT_SUCCESS,
            'messages': []
        }
        self.report_exception = copy.deepcopy(self.report)

    def add_warning_message(self, file_paths):
        """
        Add warning messages in the report.
        :param file_paths: Dictionary of filepath and the versions for the failure.
        """
        try:
            for file_path, versions in file_paths.items():
                versions_str = ""
                try:
                    versions_str = ", ".join(sorted(versions))
                except Exception as e:
                    logging.error(str(e))
                    versions_str = ", ".join(versions)
                message = {
                    "line": None,
                    "message_filename": file_path,
                    "code": versions_str,
                    "result": "warning",
                    "message_line": None,
                    'filename': file_path,
                    'dismissed': 0,
                    'message': MESSAGE_JQUERY_VERSION_LESS.format(", ".join(versions)),
                }
                self.report["messages"].append(message)
        except Exception as e:
            logging.exception(str(e))

    def find_version_in_comments(self, file_contents):
        """
        Find the jquery version in the comments.
        :param file_contents: Contents of the file which is to be searched.
        """
        try:
            match_comment1 = re.findall(COMMENTS_REGEX1, file_contents)
            match_comment2 = re.findall(COMMENTS_REGEX2, file_contents)
            version_regex = re.compile(VERSION_REGEX)
            minified_version = ""
            for version in match_comment1:
                try:
                    if version is not None:
                        res = "".join(version)
                        minified_version = version_regex.findall(res)
                        if minified_version:
                            minified_version = minified_version[0]
                            break
                except Exception as e:
                    logging.exception(str(e))
            if minified_version:
                return minified_version
            for version in match_comment2:
                try:
                    if version is not None:
                        res = "".join(version)
                        minified_version = version_regex.findall(res)
                        if minified_version:
                            minified_version = minified_version[0]
                            break
                except Exception as e:
                    logging.exception(str(e))
            return minified_version
        except Exception as e:
            logging.exception(str(e))
            return ""

    def get_all_files(self, app_name, app_path):
        """
        Get all the js files for the app name and app path.
        :param app_name: Name of the application.
        :param app_path: Path of the application.
        :return Dictionary containg list of js files.
        example:
        {
            "js": []
        }
        """
        try:
            logging.info("Getting all the js, html files.")
            js_files = []
            if app_path is None:
                dir_path = os.path.join(OTHER_APPS_DIR, app_name, "appserver")
            else:
                dir_path = os.path.join(app_path, "appserver")
            if not os.path.exists(dir_path):
                return {"js": []}
            js_file_path = os.path.join(dir_path, "static")

            try:
                for root, dirs, files in os.walk(js_file_path):
                    for file_name in files:
                        file_path = os.path.join(root, file_name)
                        if file_name.endswith(".js"):
                            js_files.append((file_name, file_path))
            except Exception as e:
                logging.exception(str(e))
            return {"js": js_files}
        except Exception as e:
            logging.exception(str(e))
            return {"js": []}

    def check_if_file_is_imported(self, file_path, all_files, failed_imports, version):
        """
        Check if a file is present as import in another files.
        :param file_path: Path of the file which is to be checked in other files.
        :param all_files: List of all the js and html files.
        """
        head, tail = os.path.split(file_path)
        for name, path in all_files:
            try:
                if path == file_path:
                    continue
                file_content = ""
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    file_content = f.read()
                matches = util.get_imported_matches(file_content)
                if tail in matches:
                    if not failed_imports.get(path):
                        failed_imports[path] = []
                    failed_imports[path].append(version)
            except Exception as e:
                logging.exception(str(e))

    def find_jquery_version(self, js_files):
        """
        Find the jquery version.
        :param js_files: List of the js files which are to be scanned.
        :return Set of file paths which contain unsupported imports.
        """
        try:
            failed_imports = {}
            for file_name, file_path in js_files:
                try:
                    version_found = ""
                    filename_regex = re.compile(FILENAME_REGEX)
                    is_regex_in_file = filename_regex.match(file_name)
                    if is_regex_in_file:
                        # remove "jquery-" from the begining of the filename
                        # and remove ".min.js" from the end of the filename
                        logging.info("Scanning file: {} from filename as filename matches regex".format(file_path))
                        version_found = file_name[7:len(file_name)-7]
                        if (version_found) and (LooseVersion(version_found) < LooseVersion("3.5")):
                            # find if the file is imported directly in some other js files also.
                            # if the file is imported directly in other js files flag them too.
                            self.check_if_file_is_imported(file_path, js_files, failed_imports, version_found)
                            if not failed_imports.get(file_path):
                                failed_imports[file_path] = []
                            failed_imports[file_path].append(version_found)
                    else:
                        logging.info("Scanning file: {} from comments".format(file_path))
                        file_contents = ""
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            file_contents = f.read()
                        version_found = self.find_version_in_comments(file_contents)
                        if version_found:
                            if LooseVersion(version_found) < LooseVersion("3.5"):
                                if not failed_imports.get(file_path):
                                    failed_imports[file_path] = []
                                failed_imports[file_path].append(version_found)
                except Exception as e:
                    logging.exception(str(e))
            return failed_imports
        except Exception as e:
            logging.exception(str(e))
            return {}

    def check_jquery_version(self, app_name, app_path):
        """
         Check that the dashboards in your app have a valid version attribute.
         :param app_name: Name of the app which is to be scanned.
         :param app_path: Path of the app which is to be scanned.
         :return Report of the scanned app.
        """
        try:
            logging.info("Starting check for jquery version.")
            all_files_dict = self.get_all_files(app_name, app_path)
            js_files = all_files_dict["js"]
            failed_imports = self.find_jquery_version(js_files)
            self.add_warning_message(failed_imports)
            if self.report.get("messages"):
                self.report["result"] = AI_RESULT_FAILURE
            logging.info("Completed check for jquery version.")
            return self.report
        except Exception as e:
            logging.exception(e)
            return self.report_exception
