from __future__ import division
import os
import re
import sys
import json
import time
import splunk.rest as sr
import csv
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
from pura_libs_utils import pura_utils as utils
from pura_libs_utils import six
from builtins import str
from builtins import object
from pura_libs_utils.checksumdir import dirhash
import pura_storage_utils
import eura_check_python_tls
import eura_check_search_peer_ssl_config
import eura_check_mongodb_tls_dns_validation
from eura_telemetry import Telemetry

FILE_PATTERN = re.compile(r'(F|f)ile:\s*[.,0-9a-zA-Z\\/_-]*')
LINE_PATTERN = re.compile(r'(L|l)ine\s*\w*:\s*[\d.]*')

logging = logger_manager.setup_logging('eura_scan_deployment')


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
        self.is_cloud = scan_args["is_cloud"]
        self.system_scan = self.request_body.get("system_scan", True)

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
            era_get_progress_collection, era_cancel_scan_collection
        )
        self.write_hash = write_hash
        if not proceed:
            logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
            return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

        try:
            results = scan_report['results']

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
                era_get_progress_collection, era_cancel_scan_collection
            )
            self.write_hash = write_hash
            if not proceed:
                logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

            # list of apps for scan results
            system_scan_length = 0
            if self.system_scan:
                system_scan_length = 2
            results["apps"] = []
            results["system"] = []
            private_passed_apps = 0
            public_passed_apps = 0
            private_blocker_apps = 0
            public_blocker_apps = 0
            system_passed = 0
            system_blocker = 0
            public_app_count = 0
            private_app_count = 0
            public_warning_apps = 0
            private_warning_apps = 0
            public_unknown_apps = 0
            private_unknown_apps = 0
            app_count = 0
            if self.system_scan:
                scan_report.update({
                    'status': PROGRESS_INPROGRESS,
                    'progress': int(100/(list_size+2)),
                    'message': "Scanning system for seach peer SSL config check."
                })
                logging.info("start: search peer SSL config check")
                search_peer_tls_config_obj = eura_check_search_peer_ssl_config.SearchPeerSSLConfig(self.is_cloud, self.session_key)
                search_peer_tls_config_report = search_peer_tls_config_obj.check_search_peer_ssl_config()
                results["system"].append(search_peer_tls_config_report)
                if search_peer_tls_config_report.get("summary", {}).get("Status") == CHECK_CONST_PASSED:
                    system_passed += 1
                else:
                    system_blocker += 1
                logging.info("stop: search peer SSL config check")

                logging.info("start: MongoDB TLS and DNS validation check")
                scan_report.update({
                    'status': PROGRESS_INPROGRESS,
                    'progress': int(200/(list_size+2)),
                    'message': "Scanning system for Mongodb TLS and DNS validation check."
                })
                proceed, write_hash = utils.write_progress(
                    self.host, self.user, self.session_key,
                    self.scan_key, self.cancel_scan_key, scan_report,
                    era_get_progress_collection, era_cancel_scan_collection
                )
                self.write_hash = write_hash

                if not proceed:
                    logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                    return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))

                mongodb_tls_dns_validation_obj = eura_check_mongodb_tls_dns_validation.MongoDBTLSDNSValidation(self.is_cloud, self.session_key)
                mongodb_tls_dns_validation_report = mongodb_tls_dns_validation_obj.check_mongodb_tls_dns_validation()
                results["system"].append(mongodb_tls_dns_validation_report)
                if mongodb_tls_dns_validation_report.get("summary", {}).get("Status") == CHECK_CONST_PASSED:
                    system_passed += 1
                else:
                    system_blocker += 1
                logging.info("stop: MongoDB TLS and DNS validation check")

            for index, app in enumerate(app_type_list):
                self.write_hash = True
                current_scan_message = MESSAGE_SCANNING_APP.format(str(index), str(list_size), app[0][1])
                logging.info(current_scan_message)
                current_progress = int(((index+system_scan_length) * 100) / (list_size+system_scan_length))
                scan_report.update({
                    'status': PROGRESS_INPROGRESS,
                    'progress': current_progress,
                    'message': current_scan_message
                })

                proceed, write_hash = utils.write_progress(
                    self.host, self.user, self.session_key,
                    self.scan_key, self.cancel_scan_key, scan_report,
                    era_get_progress_collection, era_cancel_scan_collection
                )
                if not write_hash:
                    self.write_hash = write_hash
                if not proceed:
                    logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                    return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                app_path = app[2]
                if (app[1][0] == CONST_SPLUNKBASE_9_X):
                    python_tls_report = {
                        'description': 'This config requires updates to use TLS connections in accordance with Splunk Enterprise 9.0 changes. <link to documentation>',
                        'name': 'check_for_python_tls',
                        'result': CHECK_CONST_PASSED,
                        'messages': []
                    }
                    app_reports = []
                    app_reports.append(python_tls_report)
                    updated_app_report, app_result = self.parse_response(app[0], app[1], app_reports, app[2])
                else:
                    try:
                        current_checksum = self.calculate_app_checksum(app_path)
                    except Exception as e:
                        logging.exception(str(e))
                        current_checksum = ""
                    previous_checksum = self.read_sha512_hash(app[2])
                    updated_app_report = None
                    app_result = None

                    if (previous_checksum) and (current_checksum == previous_checksum):
                        updated_app_report = self.get_skipped_app_report(app[0][0], app_path)
                    if updated_app_report is None:
                        app_reports = []
                        logging.info("start: python TLS check")
                        scan_report.update({
                            'message': "{}. Scanning app for python TLS check.".format(current_scan_message)
                        })
                        proceed, write_hash = utils.write_progress(
                            self.host, self.user, self.session_key,
                            self.scan_key, self.cancel_scan_key, scan_report,
                            era_get_progress_collection, era_cancel_scan_collection
                        )
                        if not write_hash:
                            self.write_hash = write_hash

                        if not proceed:
                            logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                            return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                        scan_details = {
                            "host": self.host,
                            "user": self.user,
                            "session_key": self.session_key,
                            "scan_key": self.scan_key,
                            "cancel_scan_key": self.cancel_scan_key,
                            "get_progress_collection": era_get_progress_collection,
                            "cancel_scan_collection": era_cancel_scan_collection
                        }
                        python_tls_obj = eura_check_python_tls.PythonTLS(scan_details)
                        python_tls_report, write_hash, proceed = python_tls_obj.check_python_tls(app[0][0], app[2])
                        if not write_hash:
                            self.write_hash = write_hash

                        if not proceed:
                            logging.info(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                            return utils.render_error_json(MESSAGE_SCAN_CANCELLED.format(self.user, self.host))
                        app_reports.append(python_tls_report)
                        logging.info("stop: python TLS check")

                        # Get formatted report and status of app
                        logging.info("starting parsing of reports")
                        updated_app_report, app_result = self.parse_response(app[0], app[1], app_reports, app[2])
                        logging.info("completing parsing")

                    if app_result is None:
                        app_result = updated_app_report['summary']['Status']

                    if self.write_hash:
                        self.write_sha512_hash(app[2], current_checksum)

                # Add app report to results
                results['apps'].append(updated_app_report)
                self.write_to_persistent_file(updated_app_report)
                if app[1][0] == CONST_PRIVATE:
                    if app_result == CHECK_CONST_PASSED:
                        private_passed_apps += 1
                    elif app_result == CHECK_CONST_BLOCKER:
                        private_blocker_apps += 1
                    private_app_count += 1
                else:
                    if app_result == CHECK_CONST_PASSED:
                        public_passed_apps += 1
                    elif app_result == CHECK_CONST_UNKNOWN:
                        public_blocker_apps += 1
                    public_app_count += 1
                app_count += 1
            scan_completion_time = int(time.time())
            results['summary'] = {
                "splunkbase": public_app_count,
                "private": private_app_count,
                "public_passed": public_passed_apps,
                "public_blocker": public_blocker_apps,
                "private_passed": private_passed_apps,
                "private_blocker": private_blocker_apps,
                "public_dismissed": 0,
                "private_dismissed": 0,
                "system_dismissed": 0,
                "public_warning": public_warning_apps,
                "private_warning": private_warning_apps,
                "public_unknown": public_unknown_apps,
                "private_unknown": private_unknown_apps,
                "system_passed": system_passed,
                "system_blocker": system_blocker,
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
                era_get_progress_collection, era_cancel_scan_collection
            )
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
            dismiss_app_details = utils.get_dismiss_app_kvstore_details(self.session_key, "emerald")
            dismiss_file_details = utils.get_dismiss_file_kvstore_details(self.session_key, "emerald")
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

    def write_to_persistent_file(self, app_report):
        try:
            # Check if local directory exists
            local_dir = LOCAL_DIR
            if not os.path.isdir(local_dir):
                os.makedirs(local_dir)

            report_dir = EMERALD_REPORT_PATH
            if not os.path.isdir(report_dir):
                os.makedirs(report_dir)

            persistent_results_file = PERSISTENT_FILE_JSON.format(self.user)
            persistent_results_file_path = os.path.join(EMERALD_REPORT_PATH, persistent_results_file)
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

        report_dir = EMERALD_REPORT_PATH
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
                    EMERALD_REPORT_PATH = os.path.join(report_dir, report)
                    if os.path.exists(EMERALD_REPORT_PATH):
                        os.remove(EMERALD_REPORT_PATH)
        except Exception as e:
            logging.exception(str(e))

    def parse_response(self, app, app_meta, reports, app_path):
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
            app_report["checks"] = []
            app_report["checks"].extend(reports)
            app_report = self.get_check_count(app_report)
            app_result = app_report['summary']['Status']
            app_report['details'] = EMERALD_DETAILS_COMPATIBLE.format("app")
            app_report['required_action'] = 'None'
            if (app_result != CHECK_CONST_PASSED):
                app_report['details'] = EMERALD_DETAILS_NOT_COMPATIBLE.format("app")
                if app_report["summary"]["type"] != CONST_PRIVATE:
                    app_report['required_action'] = EMERALD_REQUIRED_ACTION_SPLUNKBASE
                else:
                    app_report['required_action'] = EMERALD_REQUIRED_ACTION_PRIVATE
            return app_report, app_result
        except Exception as e:
            logging.exception(e)
            return {}, None

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
        if blocker > 0:
            if (app_report["summary"]["type"] != CONST_PRIVATE):
                status = CHECK_CONST_UNKNOWN
            else:
                status = CHECK_CONST_BLOCKER
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

    def calculate_app_checksum(self, app):
        hash = dirhash(app, 'sha512')
        logging.info("{}, {} ".format(app, hash))
        return hash

    def read_sha512_hash(self, app):
        try:
            data = None
            if os.path.isfile(EMERALD_SHA512_HASH_PATH):
                with open(EMERALD_SHA512_HASH_PATH) as f:
                    data = json.load(f)
                if app in data.keys():
                    return data[app]
        except Exception as e:
            logging.exception(str(e))
        return None

    def write_sha512_hash(self, app, checksum):
        try:
            data = {}
            if os.path.isfile(EMERALD_SHA512_HASH_PATH):
                with open(EMERALD_SHA512_HASH_PATH, 'r+') as f:
                    data = json.load(f)
            data[app] = checksum
            with open(EMERALD_SHA512_HASH_PATH, 'w+') as file_handler:
                json.dump(data, file_handler)
            logging.info("Successfully written hash for app: {}".format(app))
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
            persistent_results_file_path = os.path.join(EMERALD_REPORT_PATH, persistent_results_file)
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
        list_reports = os.listdir(EMERALD_REPORT_PATH)

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
                    report_file = os.path.join(EMERALD_REPORT_PATH, report)
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
