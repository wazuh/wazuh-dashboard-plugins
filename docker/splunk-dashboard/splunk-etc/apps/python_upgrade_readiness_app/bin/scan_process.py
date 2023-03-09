from __future__ import division
import os
import re
import sys
import copy
import json
import time
import splunk.rest as sr
from itertools import groupby
from threading import Thread, ThreadError
from distutils.version import LooseVersion

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

from mako.lexer import Lexer
from mako.parsetree import TextTag, Code

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_version_bifurcator as version_bifurcator
from pura_libs_utils import pura_utils as utils
from pura_libs_utils import six
from builtins import str
from builtins import range
from builtins import object
from pura_libs_utils.checksumdir import dirhash

from pura_libs_utils.splunk_py2to3 import lib2to3Runner as lib2to3Runner
import pura_storage_utils
from pura_telemetry import Telemetry

FILE_PATTERN = re.compile(r'(F|f)ile:\s*[.,0-9a-zA-Z\\/_-]*')
LINE_PATTERN = re.compile(r'(L|l)ine\s*\w*:\s*[\d.]*')

logging = logger_manager.setup_logging('pura_scan_deployment')


class ScanProcess(object):
    """
    This is a process class which does the execution of scan and process the response.
    """

    def __init__(self, scan_args):

        self.session_key = scan_args['session_key']
        self.user = scan_args['user']
        self.host = scan_args['host']
        self.request_body = scan_args["request_body"]

        self.scan_key = scan_args["scan_key"]
        self.cancel_scan_key = scan_args["cancel_scan_key"]
        self.write_hash = True
        self.start_time = int(time.time())

    def find_splunklib_version(self, folder_path):
        try:
            file_path = os.path.join(folder_path, "__init__.py")
            with open(file_path) as f:
                content = f.readlines()
            content = [x.strip() for x in content]
            matcher_rex = re.compile(r'^(\s*[A-Za-z_][A-Za-z_0-9]*\s*)(?=\=)(?!==)(\s*.*)')
            for line in content:
                matches = matcher_rex.search(line)
                if matches:
                    name, value = matches.groups()
                    if name == "__version_info__ " or name == "__version__ ":
                        version_rex = re.compile(r'\s*((\d*)(\s*)(\.|\,)(\s*)(\d*)(\s*)(\.|\,)(\s*)(\d*))\s*')
                        version_matches = version_rex.search(value)
                        if version_matches:
                            version = version_matches.groups()[0]
                            version = version.replace(',', '.').replace(' ', '')
                            return version
        except Exception as e:
            logging.exception(str(e))
        return ""

    def splunk_python_sdk_check(self, app_name, app_path=None):
        """
        Python files check.
        Walks through all python files of the app and returns the report for the script
        if it is python 3 compatible or not.

        :param app_name: Name of the app
        :param app_path: Path of the app (For Mako Template check)
        :param scan_report: Current scan report
        :param message: Scan message

        :return Dict containing python check results
        """

        def add_warning_message(file_path, version_number):
            """
            Adds a warning message to the result

            :param warn_lines: Warning lines for python file
            """

            report["messages"].append({
                "line": None,
                "message_filename": file_path,
                "code": str(version_number),
                "result": "warning",
                "message_line": None,
                'filename': file_path,
                'dismissed': 0,
                'message': "File: {}".format(file_path),
            })

        report = {
            'description': 'Splunk Python SDK Check',
            'name': 'Splunk Python SDK Check',
            'result': AI_RESULT_SUCCESS,
            'messages': []
        }
        try:

            init_files = []

            if app_path is None:
                dir_path = os.path.join(OTHER_APPS_DIR, app_name)
            else:
                dir_path = app_path

            for dirpath, dirs, files in os.walk(dir_path):
                is_folder_to_skipped = False
                all_dirs = dirpath.split(os.sep)
                for folder in SKIPPED_PYTHON_SCAN_DIRS:
                    if folder in all_dirs:
                        is_folder_to_skipped = True
                        break
                if is_folder_to_skipped:
                    continue
                for filename in files:
                    fname = os.path.join(dirpath, filename)
                    if fname.endswith('/splunklib/__init__.py') or fname.endswith('\splunklib\__init__.py')\
                            or fname.endswith('\\splunklib\\__init__.py'):
                        init_files.append(fname)

            for file_path in init_files:
                with open(file_path) as f:
                    content = f.readlines()
                content = [x.strip() for x in content]
                matcher_rex = re.compile(r'^(\s*[A-Za-z_][A-Za-z_0-9]*\s*)(?=\=)(?!==)(\s*.*)')
                for line in content:
                    matches = matcher_rex.search(line)
                    if matches:
                        name, value = matches.groups()
                        if name == "__version_info__ " or name == "__version__ ":
                            version_rex = re.compile(r'\s*((\d*)(\s*)(\.|\,)(\s*)(\d*)(\s*)(\.|\,)(\s*)(\d*))\s*')
                            version_matches = version_rex.search(value)
                            if version_matches:
                                version = version_matches.groups()[0]
                                version = version.replace(',', '.').replace(' ', '')
                                if LooseVersion(version) < LooseVersion("1.6.14"):
                                    add_warning_message(file_path, version)
                if report.get("messages"):
                    report["result"] = AI_RESULT_FAILURE

            return report
        except Exception as e:
            logging.exception(e)
            return report

    def parse_sdk_response(self, app, app_meta, report, splunk_sdk_check_report, app_path):
        """
        Parse response of sdk.

        :param app: Name of the app
        :param app_meta: Type of app and external link of app
        :param report: app inspect report of given app

        :return updated app report, status of app
        """
        try:
            report["checks"] += [splunk_sdk_check_report]
            report["checks"] = self.set_status(report["checks"])
            updated_app_report = self.get_check_count(report)
            app_result = updated_app_report['summary']['Status']
            report['details'] = 'This app is compatible with Python 3.'
            report['required_action'] = 'None'
            if app_result != CHECK_CONST_PASSED:
                report['details'] = 'This app is not compatible with Python 3.'
                report[
                    'required_action'] = 'Update this app or uninstall it. If you do nothing, the app will fail.'

            return updated_app_report, app_result
        except Exception as e:
            logging.exception(e)
            return None, None


    def py_2to3_check(self, app_name, app_path=None, scan_report=None, message=None):
        """
        Python files check.
        Walks through all python files of the app and returns the report for the script
        if it is python 3 compatible or not.

        :param app_name: Name of the app
        :param app_path: Path of the app (For Mako Template check)
        :param scan_report: Current scan report
        :param message: Scan message

        :return Dict containing python check results
        """

        def add_warning_message(warn_lines):
            """
            Adds a warning message to the result

            :param warn_lines: Warning lines for python file
            """

            report["messages"].append({
                "line": None,
                "message_filename": file_abs_path,
                "code": warn_lines,
                "result": "warning",
                "message_line": None,
                "dismissed": 0,
                'filename': file_abs_path,
                'message': "{}\nFile: {}".format(warn_lines, file_abs_path),
            })

        def parse_futurize(lines):
            """
            Parse the futurize library response

            :param lines: Lines to be checked for python issues
            """

            report_lines = []
            for line in lines:
                if not line.startswith("RefactoringTool:") and not line.startswith("---") and not line.startswith("+++"):
                    report_lines.append(line)

            report_lines = "\n".join(report_lines)
            # Generate Report
            add_warning_message(report_lines)

        report = {
            'description': CHECK_CONST_DESCRIPTION,
            'name': CHECK_CONST_NAME,
            'result': AI_RESULT_WARNING,
            'messages': []
        }
        try:
            if app_path is None:
                dir_path = os.path.join(OTHER_APPS_DIR, app_name)
            else:
                dir_path = app_path
            skipped_paths = []
            for dirs, subdirs, files in os.walk(dir_path):
                logging.info("Scanning directory: {}".format(dirs))
                is_folder_to_skipped = False
                all_dirs = dirs.split(os.sep)
                for folder in SKIPPED_PYTHON_SCAN_DIRS:
                    if folder in all_dirs:
                        is_folder_to_skipped = True
                        break
                for skipped_path in skipped_paths:
                    if (skipped_path == dirs) or (dirs.startswith(os.path.join(skipped_path, os.sep))):
                        # skip a folder if it starts with any skipped folder path
                        is_folder_to_skipped = True
                        break
                if is_folder_to_skipped:
                    logging.info("Skipping folder: {} to scan.".format(dirs))
                    continue
                for subdir in subdirs:
                    if subdir == "splunklib":
                        folder_path = os.path.join(dirs, subdir)
                        splunklib_version = self.find_splunklib_version(folder_path)
                        if LooseVersion(splunklib_version) >= LooseVersion("1.6.14"):
                            skipped_paths.append(folder_path)
                            logging.info("Adding folder {} to skip scanning".format(folder_path))
                        break
                for file_obj in files:
                    if file_obj[-3:] == ".py":
                        file_abs_path = os.path.join(dirs, file_obj)
                        file_original_path = file_abs_path.split(app_name, 1)
                        msg_file = "...{}".format(file_original_path[-1])
                        if scan_report:
                            scan_report.update({
                                'message': "{}. Scanning file: {}".format(message, msg_file)
                            })
                            proceed, write_hash = utils.write_progress(
                                self.host, self.user, self.session_key,
                                self.scan_key, self.cancel_scan_key, scan_report,
                                pra_get_progress_collection, pra_cancel_scan_collection
                            )
                            if not write_hash:
                                self.write_hash = write_hash
                            if not proceed:
                                logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                                return report

                        try:
                            parse_futurize(lib2to3Runner.runFuturize(file_abs_path))
                        except Exception as e:
                            logging.error(str(e))
                            add_warning_message("failed to parse the file")

            return report
        except Exception as e:
            logging.exception(str(e))
            return report

    def process_mako(self, check_list):
        """
        Process Mako templates found and search for issues found in related python code

        :param app: List of checks

        :return Updated list of checks
        """

        mako_msg = None

        def create_temp_dir():
            """
            Create a temp directory for Mako files
            """

            # Check if local directory exists
            if not os.path.isdir(LOCAL_DIR):
                os.makedirs(LOCAL_DIR)

            if not os.path.isdir(MAKO_PATH):
                os.makedirs(MAKO_PATH)

        def create_mako_file(message, line, file_path):
            """
            Create a mako python file from the code found in html files

            :param message: Message for Mako file check
            :param line: Line number
            :param file_path: Actual path of html file
            """

            content = re.split(" Python code: \"|\" File: | Line Number: ", message)
            mako_msg = content[0]
            py_file = file_path.split(separator, 1)[1]
            py_file = py_file.replace(separator, "$").replace(HTML_EXTENSION, ".py")
            py_file_path = os.path.join(MAKO_PATH, py_file)

            for entry in file_path_list:
                if entry.get('file', None) == py_file_path:
                    entry['content'].update({
                        line: content[1]
                    })
                    break
            else:
                code_dict = dict()
                code_dict['file'] = py_file_path
                code_dict['content'] = {line: content[1]}
                file_path_list.append(code_dict)

        def code_file_writer(filename, line_map, first_line_number=1):
            """
            function to write specific lines to a file

            :param filename: absolute path of the file
            :param line_map: Key value pair of line number and line
            """

            current_line = first_line_number
            file_content = ""
            for line_no, str_line in sorted(list(line_map.items()), key=lambda kv: kv[0]):
                # Assert line_no
                line_no = int(line_no)
                if not (line_no > 0 and (current_line == first_line_number or current_line < line_no)):
                    logging.error(MESSAGE_MAKO_FILE_LINE_NO)

                # Prepare the string
                new_line_count = line_no - current_line
                logging.debug("new_line_count = {}".format(new_line_count))
                line_to_add = "\n" * new_line_count
                line_to_add += str_line.strip()
                current_line = line_no + str_line.strip().count("\n")

                # Add to content
                file_content += line_to_add

            with open(filename, "w") as f:
                f.write(file_content)

        def format_mako(mako_list, python_list):
            """
            Formatting mako content

            :param mako_list: List of mako templates
            :param python_list: List of python files

            :return Filtered list of files
            """
            if not python_list:
                return python_list

            filtered_list = []
            mako_list = sorted(mako_list, key=lambda i: i['message_filename'])
            for _, grouped_list in groupby(mako_list, lambda i: i['message_filename']):
                filtered_list.append(list(grouped_list)[0])

            for item in python_list:
                file_path = item['message_filename']
                file_path = file_path.split(MAKO_PATH)[1]
                file_path = file_path.replace("$", separator).replace(".py", HTML_EXTENSION)
                item['message_filename'] = file_path

            for entry in filtered_list:
                for item in python_list:
                    split_string = "{}{}etc{}".format(SPLUNK_HOME, separator, separator)
                    if entry['message_filename'].split(split_string)[1] in item['message_filename']:
                        entry['code'] = item['code']
                        entry['message'] = mako_msg
                        break
                else:
                    entry['code'] = []

            filtered_list = list([i for i in filtered_list if len(i['code']) > 0])
            return filtered_list

        if os.name == "nt":
            separator = '\\'
        else:
            separator = '/'
        file_path_list = list()
        for check in check_list:
            if check['name'] == "check_for_existence_of_python_code_block_in_mako_template":
                create_temp_dir()
                if not check['messages']:
                    break
                try:
                    for entry in check['messages']:
                        create_mako_file(entry['message'], entry['message_line'], entry['message_filename'])
                except Exception:
                    logging.exception(MESSAGE_EXCEPTION_MAKO_FILE_CREATION)
                    check['messages'] = []
                    check['result'] = CHECK_CONST_SKIPPED
                    check['required_action'] = CHECK_CONST_SKIPPED_MSG
                    return check_list
                try:
                    for entry in file_path_list:
                        code_file_writer(entry['file'], entry['content'])
                except Exception:
                    logging.exception(MESSAGE_EXCEPTION_MAKO_FILE_WRITE)
                    check['messages'] = []
                    check['result'] = CHECK_CONST_SKIPPED
                    check['required_action'] = CHECK_CONST_SKIPPED_MSG
                    return check_list

                # Create python script report by running fixers over it
                py_report = self.py_2to3_check(app_name=SELF_DIR_NAME, app_path=MAKO_PATH)
                app_checks = [py_report]
                app_checks = self.fixer_results(app_checks)
                py_report = app_checks[0]
                check['messages'] = format_mako(check['messages'], py_report['messages'])
                if not check['messages']:
                    check['result'] = CHECK_CONST_PASSED
                    check['required_action'] = CHECK_CONST_PASSED_MSG
                break

        try:
            if os.path.exists(MAKO_PATH):
                temp_files = os.listdir(MAKO_PATH)
                for entry in temp_files:
                    os.remove(os.path.join(MAKO_PATH, entry))

        except Exception:
            logging.exception(MESSAGE_EXCEPTION_MAKO_FILE_DELETE)
            for check in check_list:
                if check['name'] == "Python in custom Mako templates":
                    check['messages'] = []
                    check['result'] = CHECK_CONST_SKIPPED
                    check['required_action'] = CHECK_CONST_SKIPPED_MSG

        return check_list

    def _extract_values(self, pattern, message):
        """Find the filename AND line depending on the pattern."""
        v1, v2 = '', ''
        result = pattern.search(message)
        if result:
            group = result.group()
            v1, v2 = group.split(":", 1)
        # strip [,.] from captured line number for normalizing message
        # is (filename, lineno) is not passed as params
        return tuple(map(lambda x: re.sub(r'[,.]$', r'', x.strip()), (v1, v2)))

    def extract_filename_lineno(self, message):
        filename = self._extract_values(FILE_PATTERN, message)[1]
        lineno = self._extract_values(LINE_PATTERN, message)[1]
        return filename, lineno

    def __format_message(self, message, message_file_name=None, message_line_number=None):
        """Formats file and numbers in a consistent fashion"""
        # tailor file_name, then line_number
        file_info_tailored_message = FILE_PATTERN.sub('', message, 1)
        tailored_message = LINE_PATTERN.sub('', file_info_tailored_message, 1).strip()

        captured_file_name, captured_line_number = self.extract_filename_lineno(message)
        output_file_name = message_file_name or captured_file_name
        output_line_number = message_line_number or captured_line_number

        if output_file_name and not output_line_number:
            return "{} File: {}".format(tailored_message, output_file_name)
        elif output_file_name and output_line_number:
            return "{} File: {} Line Number: {}".format(tailored_message,
                                                        output_file_name,
                                                        output_line_number)
        return tailored_message

    def find_code_in_mako(self, filepath):
        stack = []
        with open(filepath, "r") as f:
            text = f.read()
            try:
                lexer = Lexer(text)
                lexer.parse()
                stack = lexer.template.nodes[:]
                while stack:
                    node = stack.pop()
                    if isinstance(node, Code) and not isinstance(node, TextTag):
                        # A normal html Tag will be as TextTag, so we shall
                        # exclude this case.
                        yield node.text, node.lineno
                    if hasattr(node, 'nodes'):
                        for sub_node in getattr(node, "nodes"):
                            stack.append(sub_node)
            except Exception:
                # If error occurs during parsing, then it must not be mako template.
                return
        return

    def check_for_existence_of_python_code_block_in_mako_template(self, app_path):
        """
        Check for the existence of Python code block in Mako templates, which must be upgraded to be Python 3-compatible for the upcoming Splunk Enterprise Python 3 release.
        """
        messages = []
        reporter_output = ('Update Mako templates to be Python 3-compatible.'
                           ' Splunk Web, which Mako templates depend on, will support only Python 3.7.'
                           ' If you have finished your update, please disregard this message. Python code: "{}"')
        try:
            for dirs, subdirs, files in os.walk(app_path):
                for file_obj in files:
                    if file_obj.endswith(HTML_EXTENSION):
                        file_abs_path = os.path.join(dirs, file_obj)
                        for code_block, lineno in self.find_code_in_mako(file_abs_path):
                            message = self.__format_message(reporter_output.format(code_block),
                                                            message_file_name=file_abs_path, message_line_number=lineno)
                            messages.append({"message": message, "dismissed": 0, "message_filename": file_abs_path, "message_line": lineno,
                                            "filename": file_abs_path})
        except Exception as e:
            logging.exception(str(e))
            messages = []

        report = {
            "name": "check_for_existence_of_python_code_block_in_mako_template",
            "result": "warning",
            "messages": messages,
        }
        if not messages:
            report["result"] = "success"

        return report

    def check_for_existance_of_python_files(self, app_path):
        """
        Check if the application has any python files.

        :param app_path: Path of the application which is to be checked or python files.
        :boolean: Whether the application contains the python files of not.
        """
        try:
            for root, dirs, files in os.walk(app_path):
                for file in files:
                    try:
                        if(file.endswith(".py")):
                            return True
                    except Exception as e:
                        logging.exception(str(e))
        except Exception as e:
            logging.exception(str(e))
        return False

    def modify_app_type(self, app_info, app_type):
        """
        Modify the app type of the application.

        :param app_info: Tuple of the information about the application.
        :param app_type: Modified application type.

        :returns: Tuple containing the modified application type.
        """
        try:
            app_list = list(app_info)
            app_meta_list = list(app_list[1])
            app_meta_list[0] = app_type
            app_list[1] = tuple(app_meta_list)
            app = tuple(app_list)
            return app
        except Exception as e:
            logging.exception(str(e))
        return app_info

    def post_scan_deployment(self):
        """
        Runs the scan deployment to start scan for all the apps for given user.

        :return Scan results
        """

        # Creating new scan report
        scan_report = dict()
        results = dict()
        scan_report['status'] = PROGRESS_INIT
        scan_report['results'] = results
        scan_report['message'] = MESSAGE_NO_SCAN_RESULTS
        scan_report['progress'] = 0
        proceed, write_hash = utils.write_progress(
            self.host, self.user, self.session_key,
            self.scan_key, self.cancel_scan_key, scan_report,
            pra_get_progress_collection, pra_cancel_scan_collection
        )
        if not write_hash:
            self.write_hash = write_hash
        if not proceed:
            logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
            return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

        try:
            results = scan_report['results']

            if 'apps' not in self.request_body or not self.request_body['apps']:
                logging.error(MESSAGE_NO_APPS_FOUND.format(self.user))
                scan_report.update({
                    'status': PROGRESS_ERROR,
                    'message': MESSAGE_NO_APPS_FOUND.format(self.user)
                })
                proceed, write_hash = utils.write_progress(
                    self.host, self.user, self.session_key,
                    self.scan_key, self.cancel_scan_key, scan_report,
                    pra_get_progress_collection, pra_cancel_scan_collection
                )
                if not write_hash:
                    self.write_hash = write_hash
                if not proceed:
                    logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                    return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                return utils.render_error_json(MESSAGE_NO_APPS_FOUND.format(self.user), 404)

            apps = self.request_body['apps']

            app_type_list = list()
            for app in apps:
                app_type_list.append(
                    ((app['name'], app['label'], app['version']), (app['type'], app['link']), app['app_path']))
            list_size = len(app_type_list)
            logging.info(MESSAGE_TOTAL_APPS_FOUND.format(str(list_size), self.user))
            scan_report.update({
                'status': PROGRESS_INPROGRESS,
                'message': MESSAGE_TOTAL_APPS_FOUND.format(str(list_size), self.user)
            })
            proceed, write_hash = utils.write_progress(
                self.host, self.user, self.session_key,
                self.scan_key, self.cancel_scan_key, scan_report,
                pra_get_progress_collection, pra_cancel_scan_collection
            )
            if not write_hash:
                self.write_hash = write_hash
            if not proceed:
                logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

            # list of apps for scan results
            results['apps'] = list()
            private_passed_apps = 0
            private_blocker_apps = 0
            private_warning_apps = 0
            private_unknown_apps = 0
            public_passed_apps = 0
            public_blocker_apps = 0
            public_warning_apps = 0
            public_unknown_apps = 0
            splunk_base_app_count = 0
            splunk_support_app_count = 0
            private_app_count = 0

            for index, app in enumerate(app_type_list):
                skip_flag = False
                current_scan_message = MESSAGE_SCANNING_APP.format(str(index), str(list_size), app[0][1])
                logging.info(current_scan_message)
                current_progress = int(((index) * 100) / list_size)
                scan_report.update({
                    'status': PROGRESS_INPROGRESS,
                    'progress': current_progress,
                    'message': current_scan_message
                })
                proceed, write_hash = utils.write_progress(
                    self.host, self.user, self.session_key,
                    self.scan_key, self.cancel_scan_key, scan_report,
                    pra_get_progress_collection, pra_cancel_scan_collection
                )
                if not write_hash:
                    self.write_hash = write_hash
                if not proceed:
                    logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                    return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

                if app[1][0] != CONST_PRIVATE:
                    are_python_files_present = self.check_for_existance_of_python_files(app[2])
                    if not are_python_files_present:
                        app = self.modify_app_type(app, CONST_SPLUNKBASE_DUAL)
                        updated_app_report, app_result = self.quake_response(app[0], app[1], CHECK_CONST_PASSED, app[2])
                    elif app[1][0] == CONST_SPLUNKBASE_QUAKE or app[1][0] == CONST_SPLUNKBASE_DUAL:
                        # Get static report and status PASSED for this app
                        updated_app_report, app_result = self.quake_response(app[0], app[1], CHECK_CONST_PASSED, app[2])
                    else:
                        # Get static report and status FAILED for this app
                        updated_app_report, app_result = self.quake_response(app[0], app[1], CHECK_CONST_BLOCKER,
                                                                             app[2])

                    logging.info("start: splunk_sdk_check")
                    scan_report.update({
                        'message': "{}. Scanning app for older version of python SDK.".format(current_scan_message)
                    })
                    proceed, write_hash = utils.write_progress(
                        self.host, self.user, self.session_key,
                        self.scan_key, self.cancel_scan_key, scan_report,
                        pra_get_progress_collection, pra_cancel_scan_collection
                    )
                    if not write_hash:
                        self.write_hash = write_hash

                    if not proceed:
                        logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                        return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

                    splunk_sdk_check_report = self.splunk_python_sdk_check(app_name=app[0][0], app_path=app[2])
                    logging.info("stop: splunk_sdk_check")
                    updated_app_report["checks"] = [splunk_sdk_check_report]

                    self.delete_sha512_hash(app[2])
                else:
                    app_path = app[2]
                    try:
                        current_checksum = self.calculate_app_checksum(app_path)
                    except Exception as e:
                        logging.exception(str(e))
                        current_checksum = ""
                    previous_checksum = self.read_sha512_hash(app[2])
                    updated_app_report = None
                    app_result = None


                    if previous_checksum and current_checksum == previous_checksum:
                        skip_flag = True
                        updated_app_report = self.get_skipped_app_report(app[0][0], app_path)
                    if updated_app_report is None:
                        skip_flag = False
                        logging.info("start: mako check")
                        # Get the mako report of the app
                        app_report = self.check_for_existence_of_python_code_block_in_mako_template(app_path)
                        logging.info("stop : mako check")
                        proceed, write_hash = utils.write_progress(
                            self.host, self.user, self.session_key,
                            self.scan_key, self.cancel_scan_key, scan_report,
                            pra_get_progress_collection, pra_cancel_scan_collection
                        )
                        if not write_hash:
                            self.write_hash = write_hash
                        if not proceed:
                            logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                            return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

                        logging.info("start: py2to3_check")
                        # Check for python 3 compatible code using lib2to3
                        py_2to3_report = self.py_2to3_check(app_name=app[0][0], app_path=app[2],
                                                            scan_report=scan_report,
                                                            message=current_scan_message)
                        logging.info("stop : py2to3_check")

                        logging.info("start: splunk_sdk_check")
                        scan_report.update({
                            'message': "{}. Scanning app for older version of python SDK.".format(current_scan_message)
                        })
                        proceed, write_hash = utils.write_progress(
                            self.host, self.user, self.session_key,
                            self.scan_key, self.cancel_scan_key, scan_report,
                            pra_get_progress_collection, pra_cancel_scan_collection
                        )
                        if not write_hash:
                            self.write_hash = write_hash

                        if not proceed:
                            logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                            return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

                        splunk_sdk_check_report = self.splunk_python_sdk_check(app_name=app[0][0], app_path=app[2])
                        logging.info("stop: splunk_sdk_check")
                        proceed, write_hash = utils.write_progress(
                            self.host, self.user, self.session_key,
                            self.scan_key, self.cancel_scan_key, scan_report,
                            pra_get_progress_collection, pra_cancel_scan_collection
                        )
                        if not write_hash:
                            self.write_hash = write_hash
                        if not proceed:
                            logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                            return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

                        # Get formatted report and status of app
                        logging.info("starting py check parsing")
                        updated_app_report = self.parse_response(app[0], app[1], app_report, py_2to3_report, app[2])

                        logging.info("starting sdk check parsing")
                        updated_app_report, app_result = self.parse_sdk_response(app[0], app[1], updated_app_report,
                                                                                 splunk_sdk_check_report, app[2])
                        logging.info("completing parsing")

                    if app_result is None:
                        app_result = updated_app_report['summary']['Status']

                    if self.write_hash:
                        self.write_sha512_hash(app[2], current_checksum)

                # Add app report to results
                results['apps'].append(updated_app_report)

                if app[1][0] == CONST_PRIVATE:
                    self.write_to_persistent_file(updated_app_report)
                    if app_result == CHECK_CONST_PASSED:
                        private_passed_apps += 1
                    elif app_result == CHECK_CONST_BLOCKER:
                        private_blocker_apps += 1
                    elif app_result == CHECK_CONST_WARNING:
                        private_warning_apps += 1
                    elif app_result == CHECK_CONST_UNKNOWN:
                        private_unknown_apps += 1
                    private_app_count += 1
                else:
                    if app_result == CHECK_CONST_PASSED:
                        public_passed_apps += 1
                    elif app_result == CHECK_CONST_BLOCKER:
                        public_blocker_apps += 1
                    elif app_result == CHECK_CONST_WARNING:
                        public_warning_apps += 1
                    elif app_result == CHECK_CONST_UNKNOWN:
                        public_unknown_apps += 1
                    splunk_base_app_count += 1

            scan_completion_time = int(time.time())
            results['summary'] = {
                "splunkbase": splunk_base_app_count,
                "splunk_supported": splunk_support_app_count,
                "private": private_app_count,
                "public_passed": public_passed_apps,
                "public_blocker": public_blocker_apps,
                "public_warning": public_warning_apps,
                "public_unknown": public_unknown_apps,
                "private_passed": private_passed_apps,
                "private_blocker": private_blocker_apps,
                "private_warning": private_warning_apps,
                "private_unknown": private_unknown_apps,
                "private_dismissed": 0,
                "public_dismissed": 0,
                "scan_completion_time": scan_completion_time,
                "app_version": UPGRADE_READINESS_APP_VERSION
            }

            logging.info(MESSAGE_SCAN_SUCCESS.format(self.user))
            results['scan_id'] = "{}_{}".format(self.user, str(scan_completion_time))

            scan_report.update({
                'status': PROGRESS_COMPLETE,
                'results': results,
                'progress': 100,
                'message': MESSAGE_SCAN_SUCCESS.format(self.user)
            })



            # Write scan report to a file
            self.write_to_file(scan_report)
            proceed, write_hash = utils.write_progress(
                self.host, self.user, self.session_key,
                self.scan_key, self.cancel_scan_key, scan_report,
                pra_get_progress_collection, pra_cancel_scan_collection
            )
            if not write_hash:
                self.write_hash = write_hash
            if not proceed:
                logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

            self.write_to_skynet(scan_report)
            return utils.render_json(scan_report)
        except Exception as e:
            logging.exception("{}: {}".format(MESSAGE_EXCEPTION_SCAN_DEPLOYMENT, str(e)))

            return utils.render_error_json(MESSAGE_EXCEPTION_SCAN_DEPLOYMENT)

    def write_to_skynet(self, report):
        """
        Write the scan report to skyent summary.
        :param report: Scan report
        """
        try:
            report = report.get("results", {})
            report = utils.add_missing_keys_in_report(report)
            dismiss_app_details = utils.get_dismiss_app_kvstore_details(self.session_key, "python")
            dismiss_file_details = utils.get_dismiss_file_kvstore_details(self.session_key, "python")
            results_dismissed_apps_copy = copy.deepcopy(report)
            are_dismissed_apps_filtered = utils.filter_dismissed_apps(report, dismiss_app_details)
            if not are_dismissed_apps_filtered:
                logging.error(MESSAGE_SKIP_DISMISS_APPS)
                report = results_dismissed_apps_copy
            results_dismissed_files_copy = copy.deepcopy(report)
            are_dismissed_files_filtered = utils.filter_dismissed_files(report, dismiss_file_details, scan_type="python")
            if not are_dismissed_files_filtered:
                logging.error(MESSAGE_SKIP_DISMISS_FILES)
                report = results_dismissed_files_copy
            self.telemetry_handler = Telemetry(self.session_key, self.user)
            self.telemetry_handler.init_telemetry(TELEMETRY_MANUAL)
            if (not self.telemetry_handler.telemetry_data) and (not self.telemetry_handler.scan_summary):
                logging.info("Skipping to send skynet data.")
                return
            self.telemetry_handler.telemetry_data.update({
                'apps': list(),
                'system': report.get("system", [])
            })
            self.telemetry_handler.scan_summary.update({
                'apps': list(),
                'system': report.get("system", [])
            })
            for _app in report.get("apps", []):
                self.telemetry_handler.update_telemetry_data(_app, _app["summary"]["Status"], _app, None,
                                                                False, default=False)
            self.telemetry_handler.write_scan_summary()
            return
        except Exception as e:
            logging.exception(str(e))
            return

    def write_progress(self, scan_report):
        """
        Write progress in KV store.

        :param scan_report: current scan report

        :return Proceed(True/False) based on whether scan is cancelled or not
        """

        c_value = dict()

        data = {
            'process_id': os.getpid(),
            'host': self.host,
            'user': self.user,
            'progress': 0,
            'status': PROGRESS_NEW,
            'message': "Run new scan"
        }

        data.update({
            'progress': scan_report['progress'],
            'status': scan_report['status'],
            'message': scan_report['message']
        })

        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_get_progress_collection, self.user, self.host)
        response = pura_storage_utils.read(file_details["file_path"])
        response = pura_storage_utils.search(response, {"_key": self.scan_key})

        if not response:
            empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
            return False

        cancelled, entry = self.is_cancelled(self.cancel_scan_key)

        if cancelled:
            self.write_hash = False
            logging.info("Scan has been cancelled.")
            empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
            return False

        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_get_progress_collection, self.user, self.host)
        response = pura_storage_utils.update(file_details["file_path"], data, self.scan_key)

        if not response:
            logging.error(MESSAGE_ERROR_WRITING_PROGRESS.format(self.user, self.host))
            empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
            return False

        return True

    def is_cancelled(self, key):
        """
        Check for cancelled status for user and host.

        :param key: the key of the entry

        :return True/False, Dict of entry
        """
        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_cancel_scan_collection, self.user, self.host)
        content = pura_storage_utils.read(file_details["file_path"])
        c_value = dict()

        if content is None:
            logging.exception(MESSAGE_EXCEPTION_READ_FILE_STORE.format(self.user, self.host))
            empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
            return True, {}

        content = pura_storage_utils.search(content, {"_key": key})

        if not content:
            logging.error(MESSAGE_ERROR_READING_PROGRESS.format(self.user, self.host))
            empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
            return True, {}

        else:
            entry = content[0]
            if entry['cancelled']:
                empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
                return True, entry

        return False, {}

    def write_to_persistent_file(self, app_report):
        try:
            # Check if local directory exists
            local_dir = LOCAL_DIR
            if not os.path.isdir(local_dir):
                os.makedirs(local_dir)

            report_dir = REPORT_PATH
            if not os.path.isdir(report_dir):
                os.makedirs(report_dir)

            persistent_results_file = PERSISTENT_FILE_JSON.format(self.user)
            persistent_results_file_path = os.path.join(REPORT_PATH, persistent_results_file)
            if not os.path.exists(persistent_results_file_path):
                with open(persistent_results_file_path, 'w') as p_file_handler:
                    json.dump([app_report], p_file_handler)
            else:
                with open(persistent_results_file_path, 'r') as p_file_handler:
                    apps = json.load(p_file_handler)
                    for i, app in enumerate(apps):
                        if app["name"] == app_report["name"] and app["app_path"] == app_report["app_path"]:
                            apps[i] = app_report
                            break
                    else:
                        apps.append(app_report)
                with open(persistent_results_file_path, 'w') as p_file_handler:
                    json.dump(apps, p_file_handler)
        except Exception as e:
            logging.warn("Error writing data to persistent file.")
            logging.exception(e)

    def write_to_file(self, report):
        """
        Write progress in files.

        :param report: JSON report of App inspect results
        """

        # Check if local directory exists
        local_dir = LOCAL_DIR
        if not os.path.isdir(local_dir):
            os.makedirs(local_dir)

        report_dir = REPORT_PATH
        if not os.path.isdir(report_dir):
            os.makedirs(report_dir)

        scan_id = report['results']['scan_id']
        report_filename = "{}.json".format(scan_id)
        report_file = os.path.join(report_dir, report_filename)
        report['results']['host'] = self.host
        with open(report_file, 'w') as file_handler:
            json.dump(report['results'], file_handler)

        self.remove_previous_scans(report_dir, report_filename)

    def remove_previous_scans(self, report_dir, report_filename):
        """
        Remove previous scan results.

        :param report_dir: Report directory path
        :param report_filename: filename of current report
        """
        try:
            list_reports = os.listdir(report_dir)
            persistent_results_file = PERSISTENT_FILE_JSON.format(self.user)
            for report in list_reports:
                if self.user == report[:-16] and report_filename != report and persistent_results_file != report:
                    report_path = os.path.join(report_dir, report)
                    if os.path.exists(report_path):
                        os.remove(report_path)
        except Exception as e:
            logging.exception(str(e))

    def quake_response(self, app, app_meta, app_status, app_path):
        """
        Prepare response for Quake supported apps.

        :param app: Name, label and version of the app
        :param app_meta: Type of app and external link of app

        :return app report, status of app
        """
        dismiss_app_flag = 0
        dismiss_app_timestamp = ""
        app_report = dict()
        app_report['name'] = app[0]
        app_report['label'] = app[1]
        app_report['version'] = app[2]
        app_report['app_path'] = app_path
        app_report['summary'] = {
            'Passed': 0,
            'Blocker': 0,
            'Warning': 0,
            'Skipped': 0,
            'Status': app_status,
            'type': app_meta[0],
            'app_link': app_meta[1],
            'dismiss_app': dismiss_app_flag,
            'dismiss_app_date': dismiss_app_timestamp
        }
        if app_status == CHECK_CONST_PASSED:
            app_report['details'] = 'This app is compatible with Python 3.'
            app_report['required_action'] = 'None'
        else:
            if app_meta[0] == CONST_SPLUNKBASE_UPDATE:
                app_report['details'] = 'This app is not compatible with Python 3. ' \
                                        'A Python 3 compatible version of this app is available on Splunkbase.'
                app_report['required_action'] = 'Update this app to the latest version on Splunkbase.'
            elif (app_meta[0] == CONST_SPLUNKBASE_NONE) or (app_meta[0] == CONST_SPLUNKBASE_WARN):
                app_report['details'] = 'This app is not compatible with Python 3.'
                app_report['required_action'] = PYTHON_REQUIRED_ACTION_SPLUNKBASE

        app_report['checks'] = []
        return app_report, app_status

    def parse_response(self, app, app_meta, report, py_2to3_report, app_path):
        """
        Parse response of app inspect.

        :param app: Name, label and version of the app
        :param app_meta: Type of app and external link of app
        :param report: app inspect report of given app

        :return updated app report, status of app
        """
        try:
            app_report = dict()
            app_report['name'] = app[0]
            app_report['label'] = app[1]
            app_report['version'] = app[2]
            app_report['app_path'] = app_path
            app_report['summary'] = {
                'Passed': 0,
                'Blocker': 0,
                'Warning': 0,
                'Skipped': 0,
                'type': app_meta[0],
                'app_link': app_meta[1],
                'dismiss_app': 0,
                'dismiss_app_date': ""

            }

            app_report["checks"] = [report, py_2to3_report]

            app_report['checks'] = self.process_mako(app_report['checks'])
            app_report['checks'] = self.fixer_results(app_report['checks'])

            app_report['checks'] = self.set_status(app_report['checks'])
            app_report = self.set_check_name(app_report)

            # Filter python 3 files from python scripts check
            app_report['checks'] = self.filter_py3_files(app[0], app_report['checks'])

            return app_report
        except Exception as e:
            logging.exception(e)

    def fixer_results(self, checks):
        """
        Format fixer results for Python syntax check.

        :param checks: List of checks

        :return Updated checklist
        """

        for check in checks:
            if check['name'] == CHECK_CONST_NAME:
                messages = [files_paths for files_paths in check['messages'] if files_paths['code']]
                for message_dict in messages:
                    message_dict['code'] = self.format_code(message_dict['code'])
                check['messages'] = messages
            else:
                continue

        return checks

    def format_code(self, syntax_errors):
        """
        Convert syntax error string into list of separate errors

        :param syntax_errors: String of results containing syntax errors

        :return List of separate syntax errors
        """

        code_list = syntax_errors.split("\n@@")
        if len(code_list) > 1:
            new_list = ["@@" + item for item in code_list[1:]]
            new_list.insert(0, code_list[0])
            return new_list
        else:
            return code_list

    def set_file_paths(self, checklist, app_folder):
        """
        Set relative file paths for all entries in checks.

        :param checklist: List of checks for app
        :param app_folder: Folder name of the app

        :return Updated checklist
        """

        for check in checklist:
            for entry in check['messages']:
                entry['full_path'] = entry['message_filename']
                if entry['message_filename'] is not None:
                    old_path = entry['message_filename'].split(app_folder, 1)
                    new_path = "...{}".format(old_path[-1])
                    entry['message_filename'] = new_path

        return checklist

    def get_check_count(self, app_report):
        """
        Get check count for app.

        :param app_report: The app report for which check count is to be calculated

        :return Updated app report
        """

        passed = app_report['summary']['Passed']
        blocker = app_report['summary']['Blocker']
        warning = app_report['summary']['Warning']
        skipped = app_report['summary']['Skipped']

        for check in app_report['checks']:
            if check['result'] == CHECK_CONST_PASSED:
                passed += 1
            elif check['result'] == CHECK_CONST_BLOCKER:
                blocker += 1
            elif check['result'] == CHECK_CONST_WARNING:
                warning += 1
            elif check['result'] == CHECK_CONST_SKIPPED:
                skipped += 1

        status = CHECK_CONST_PASSED
        if skipped > 0:
            status = CHECK_CONST_UNKNOWN
        elif blocker > 0:
            status = CHECK_CONST_BLOCKER
        elif blocker == 0 and warning > 0:
            status = CHECK_CONST_WARNING
        else:
            status = CHECK_CONST_PASSED

        app_report['summary'].update({
            'Passed': passed,
            'Blocker': blocker,
            'Warning': warning,
            'Skipped': skipped,
            'Status': status
        })

        return app_report

    def set_status(self, app_checks):
        """
        Set status for app checks.

        :param app_checks: List of checks

        :return Updated check list with status set
        """

        for check in app_checks:
            if (check['result'] == AI_RESULT_SUCCESS or check['result'] == AI_RESULT_MANUAL or
                    check['result'] == AI_RESULT_NA):
                check['result'] = CHECK_CONST_PASSED
            elif (check['result'] == AI_RESULT_ERROR or check['result'] == AI_RESULT_FAILURE or
                  check['result'] == AI_RESULT_WARNING):
                if check['name'] == CHECK_CONST_NAME:
                    check['result'] = CHECK_CONST_WARNING
                else:
                    check['result'] = CHECK_CONST_BLOCKER
            elif check['result'] == AI_RESULT_SKIPPED:
                check['result'] = CHECK_CONST_SKIPPED

        return app_checks

    def set_check_name(self, app_report):
        """
        Update check names and set required action.

        :param app_report: The app report for which checks should be updated

        :return Updated app report
        """
        checks_list = app_report['checks']
        for check in checks_list:
            if check['name'] in CHECK_NAME_MAPPING:
                check['name'] = CHECK_NAME_MAPPING[check['name']]
                if check['result'] == CHECK_CONST_PASSED:
                    check['required_action'] = CHECK_CONST_PASSED_MSG
                elif check['result'] == CHECK_CONST_SKIPPED:
                    check['required_action'] = CHECK_CONST_SKIPPED_MSG
                else:
                    check['required_action'] = CHECK_ACTION_MAPPING[check['name']]

        app_report['checks'] = checks_list
        return app_report

    def filter_py3_files(self, app_name, app_checks):
        """
        Filter python 3 files from python script files.

        :param app_name: Application name

        :param app_checks: List of checks for app

        :return Updated checklist
        """

        try:
            py3_files_list = version_bifurcator.get_app_python_file_versions(app_name).get("python3")
        except Exception as e:
            logging.exception(str(e))
            logging.error("Error encountered while finding and filtering python 3 designated files.")
            return app_checks

        python_script_list = []

        for check in app_checks:
            if check['name'] == "Python scripts":
                python_script_list = check['messages']

        for entry in py3_files_list:
            for i, item in enumerate(python_script_list):
                if entry == item['filename']:
                    del python_script_list[i]
                    break

        for check in app_checks:
            if check['name'] == "Python scripts":
                check['messages'] = python_script_list
                if not python_script_list:
                    check['result'] = CHECK_CONST_PASSED
                    check['required_action'] = CHECK_CONST_PASSED_MSG

        return app_checks

    def calculate_app_checksum(self, app):
        hash = dirhash(app, 'sha512')
        logging.info("{}, {} ".format(app, hash))
        return hash

    def read_sha512_hash(self, app):
        try:
            data = None
            if os.path.isfile(SHA512_HASH_PATH):
                with open(SHA512_HASH_PATH) as f:
                    data = json.load(f)
                # logging.info('Hash dict of all apps {}'.format(data))
                if app in data.keys():
                    return data[app]
        except Exception as e:
            logging.exception(str(e))
        return None

    def delete_sha512_hash(self, app):
        try:
            data = {}
            if os.path.isfile(SHA512_HASH_PATH):
                with open(SHA512_HASH_PATH, 'r+') as f:
                    data = json.load(f)
            data.pop(app, None)
            with open(SHA512_HASH_PATH, 'w+') as file_handler:
                json.dump(data, file_handler)
            return True
        except Exception as e:
            logging.exception(str(e))
            return False
        return False

    def write_sha512_hash(self, app, checksum):
        try:
            data = {}
            if os.path.isfile(SHA512_HASH_PATH):
                with open(SHA512_HASH_PATH, 'r+') as f:
                    data = json.load(f)
            data[app] = checksum
            with open(SHA512_HASH_PATH, 'w+') as file_handler:
                json.dump(data, file_handler)
            return True
        except Exception as e:
            logging.exception(str(e))
            return False

        return None

    def get_skipped_app_report(self, app, app_path):
        try:
            results, file = self.get_latest_results()
            if not file or not results:
                logging.error(MESSAGE_CHECKSUM_ERROR_FILE_READ.format(app))
            else:
                for _app in results['apps']:
                    if _app['name'] == app and _app['app_path'] == app_path:
                        return _app

            persistent_results_file = PERSISTENT_FILE_JSON.format(self.user)
            persistent_results_file_path = os.path.join(REPORT_PATH, persistent_results_file)
            if os.path.exists(persistent_results_file_path):
                with open(persistent_results_file_path, 'r') as file_handler:
                    persistent_apps = json.load(file_handler)
                    for persistent_app in persistent_apps:
                        if persistent_app["name"] == app and persistent_app["app_path"] == app_path:
                            return persistent_app
            return None
        except Exception as e:
            logging.exception(str(e))
        return None

    def get_latest_results(self):
        """
        Fetch latest results for the user

        :return latest results for the user based on timestamp, filename for results
        """
        results = None
        filepath = ""
        list_reports = os.listdir(REPORT_PATH)

        user_reports = list()
        persistent_user_report = PERSISTENT_FILE_JSON.format(self.user)
        for report in list_reports:
            if self.user == report[:-16] and report != persistent_user_report:
                user_reports.append(report)

        latest_timestamp = 0
        for report in user_reports:
            timestamp = (report[:-5])[-10:]
            if int(timestamp) > latest_timestamp:
                latest_timestamp = int(timestamp)
        try:
            for report in user_reports:
                if str(latest_timestamp) in report:
                    report_file = os.path.join(REPORT_PATH, report)
                    with open(report_file, 'r') as file_handler:
                        results = json.load(file_handler)
                    filepath = report_file
                    break
        except Exception as e:
            logging.exception(str(e))

        return results, filepath


if __name__ == '__main__':
    try:
        logging.info("Scan initiated")
        if six.PY2:
            scan_args = json.loads(sys.stdin.read())
        elif six.PY3:
            scan_args = json.loads(str(sys.stdin.read()))

        scanner = ScanProcess(scan_args)
        scanner.post_scan_deployment()
    except Exception as e:
        logging.exception(str(e))
