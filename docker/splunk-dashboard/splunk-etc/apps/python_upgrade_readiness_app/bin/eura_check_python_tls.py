import os
import shutil
import stat
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
is_import_successful = True
try:
    from pura_libs_utils.splunk_appinspect.client import Client
except Exception as ex:
    is_import_successful = False
from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import CancelScan

import six
if six.PY2:
    from io import open

logging = logger_manager.setup_logging('eura_check_python_tls')


class PythonTLS:
    def __init__(self, scan_details):

        CancelScan.CancelScan(scan_details)
        self.scan_details = scan_details
        self.report = {
            'description': 'This config requires updates to use TLS connections in accordance with Splunk Enterprise 9.0 changes. <link to documentation>',
            'name': 'check_for_python_tls',
            'result': CHECK_CONST_PASSED,
            'messages': []
        }
        self.libs = "libs_py2"
        if six.PY2:
            self.libs = "libs_py2"
        elif six.PY3:
            self.libs = "libs_py3"
        self.report_exception = copy.deepcopy(self.report)

    def add_warning_message(self, file_path, error_message=None, line_no=0):
        """
        Add warning message for the file path.
        :param file_path: Path of the file which is failing.
        """
        try:
            message = {
                "line": None,
                "message_filename": file_path,
                "code": "",
                "result": "warning",
                "message_line": None,
                'filename': file_path,
                'dismissed': 0,
            }
            message['message'] = error_message
            if line_no:
                message['line_no'] = line_no
            self.report["messages"].append(message)
            self.report['Status'] = CHECK_CONST_BLOCKER
            self.report['result'] = CHECK_CONST_BLOCKER
        except Exception as e:
            logging.exception(str(e))

    def remove_from_ura(self):
        """
        Remove the temp directory inside URA created for splunk9x check.
        """
        try:
            def onerror_callback(func, path, exc_info):
                os.chmod(path, stat.S_IWUSR)
                if os.path.isdir(path):
                    os.rmdir(path)
                else:
                    os.remove(path)
            if os.path.exists(SPLUNK9X_COPY_PATH):
                shutil.rmtree(SPLUNK9X_COPY_PATH, onerror=onerror_callback)
        except Exception as e:
            logging.exception(str(e))
            return

    def create_temp_folder_in_ura(self):
        """
        Create a temp directory inside URA for splumk9x checks.
        """
        copy_path = os.path.join(SPLUNK9X_COPY_PATH)
        if not os.path.exists(copy_path):
            os.mkdir(copy_path)

    def check_python_tls(self, app_name, app_path):
        """
        Check that the imports in html are valid.
        :param app_name: Name of the app to be scanned.
        :param app_path: Path of the app to be scanned.
        """
        client = None
        try:
            logging.info("Starting check for python TLS.")
            self.create_temp_folder_in_ura()
            failed_filepaths = {}
            def _report_if_all_kwrgs_found(
                ast_info, file_path, reporter, lib_name, check_kwrgs
            ):
                usages = ast_info.get_module_function_call_usage(lib_name, fuzzy=True)
                for usage in usages:
                    CancelScan.CancelScan.get_instance().check_cancelled_scan()
                    find_count = 0
                    if hasattr(usage, "keywords"):
                        for keyword in usage.keywords:
                            if (
                                hasattr(keyword, "arg")
                                and hasattr(keyword, "value")
                                and hasattr(keyword.value, "value")
                            ):
                                for k, v in check_kwrgs.items():
                                    if keyword.arg == k and keyword.value.value == v:
                                        find_count = find_count + 1
                    if find_count == len(check_kwrgs):
                        full_filepath = os.path.join(app_path, file_path)
                        if not failed_filepaths.get(full_filepath):
                            failed_filepaths[full_filepath] = []
                        failed_filepaths[full_filepath].append(lib_name)
            if not is_import_successful:
                logging.info("Python TLS check failed because of failed import")
                return self.report
            client = Client(files_folder=app_path)

            for file_path, ast_info in client.get_all_ast_infos():
                _report_if_all_kwrgs_found(
                    ast_info,
                    file_path,
                    self,
                    "http.client.HTTPSConnection",
                    {"cert_file": None},
                )
                _report_if_all_kwrgs_found(
                    ast_info,
                    file_path,
                    self,
                    "urllib.request.urlopen",
                    {
                        "cafile": None,
                        "capath": None,
                    },
                )
                _report_if_all_kwrgs_found(
                    ast_info,
                    file_path,
                    self,
                    "httplib2.Http",
                    {"disable_ssl_certificate_validation": False},
                )
                for request_method in (
                    "requests.request",
                    "requests.get",
                    "requests.post",
                    "requests.patch",
                    "requests.put",
                ):
                    _report_if_all_kwrgs_found(
                        ast_info, file_path, self, request_method, {"verify": False}
                    )
            for filepath, imports in failed_filepaths.items():
                imports_str = ",".join(imports)
                reporter_output = EMERALD_PYTHON_TLS_CHECK_REMEDIATION_MESSAGE.format(imports_str)
                self.add_warning_message(filepath, error_message=reporter_output)
            if self.report.get("messages"):
                self.report["result"] = CHECK_CONST_BLOCKER
            self.remove_from_ura()
            logging.info("Completed check for python TLS.")
            return self.report, True, True

        except CancelScan.CancelScanException as ce:
            logging.exception(ce)
            if client is not None:
                client.remove_raw_files()
            self.remove_from_ura()
            return self.report_exception, ce.write_hash, ce.proceed
        except Exception as e:
            logging.exception(e)
            self.remove_from_ura()
            return self.report_exception, False, True
