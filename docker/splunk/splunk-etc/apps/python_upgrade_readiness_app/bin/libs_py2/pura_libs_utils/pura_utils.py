import json
import copy
import splunk.rest as sr
import splunklib.client as client
import splunklib.results as results
import os
from time import time
import subprocess
from pura_libs_utils.pura_consts import *
import pura_storage_utils
from pura_libs_utils import pura_logger_manager as logger_manager
logging = logger_manager.setup_logging('pura_utils')

def render_json(data, response_code=200, include_headers=True):
    """
    Render the data as JSON

    :param data: Response data
    :param response_code: Status code for response

    :return JSON response containing payload and status
    """
    return_value = {
        'payload': json.dumps(data),
        'status': response_code
        }
    if include_headers:
        return_value['headers'] = {
            'Content-Type': 'application/json'
        }
    return return_value


def render_msg_json(message, response_code=200, include_headers=True):
    """
    Render a message to be returned to the client.

    :param message: Success message to be displayed
    :param response_code: Status code for response

    :return JSON response containing payload and status
    """

    data = {
        'success': True,
        'message': message
    }
    return_value = {
        'payload': json.dumps(data),
        'status': response_code
    }
    if include_headers:
        return_value['headers'] = {
            'Content-Type': 'application/json'
        }
    return return_value


def render_error_json(message, response_code=500, include_headers=True):
    """
    Render an error to be returned to the client.

    :param message: Error message to be displayed
    :param response_code: Status code for response

    :return JSON response containing payload and status
    """

    data = {
        'success': False,
        'message': message
    }
    return_value = {
        'payload': json.dumps(data),
        'status': response_code
        }
    if include_headers:
        return_value['headers']= {
            'Content-Type': 'application/json'
        }
    return return_value


def render_csv(data, response_code=200):
    """
    Render the data as CSV

    :param data: Response data
    :param response_code: Status code for response

    :return CSV response containing payload and status
    """

    return {
        'payload': data,
        'status': response_code,
        'headers': {
            'Content-Type': 'text/csv'
        }
    }


def get_forms_args_as_dict(form_args):
    """
    Get the form arguments in the form of a dictionary.

    :param form_args: list of arguments

    :return dict containing name-value pair
    """

    post_arg_dict = {}

    for arg in form_args:
        name = arg[0]
        value = arg[1]

        post_arg_dict[name] = value

    return post_arg_dict


def convert_to_dict(query):
    """
    Create a dictionary containing the parameters.

    :param query: Query containing params

    :return Parameters
    """
    parameters = {}

    for key, val in query:

        # If the key is already in the list, but the existing
        # entry isn't a list then make the
        # existing entry a list and add thi one
        if key in parameters and not isinstance(parameters[key], list):
            parameters[key] = [parameters[key], val]

        # If the entry is already included as a list, then
        # just add the entry
        elif key in parameters:
            parameters[key].append(val)

        # Otherwise, just add the entry
        else:
            parameters[key] = val

    return parameters


def parse_in_string(in_string):
    """
    Parse the in_string

    :param in_string: String containing arguements

    :return params
    """

    params = json.loads(in_string)

    params['method'] = params['method'].lower()

    params['form_parameters'] = convert_to_dict(params.get('form', []))
    params['query_parameters'] = convert_to_dict(params.get('query', []))

    return params

def get_dismiss_app_kvstore_details(session_key, scan_type="python"):
    """
    Get the dismissed app details from the kvstore.
    :param session_key: Session key of the user.
    :returns Dictionary containing dismissed app details.
    """
    try:
        endpoint = pra_dismiss_remote_app_endpoint
        if scan_type.lower() == "python":
            endpoint = pra_dismiss_remote_app_endpoint
        elif scan_type.lower() == "jquery":
            endpoint = jra_dismiss_remote_app_endpoint
        elif scan_type.lower() == "emerald":
            endpoint = era_dismiss_remote_app_endpoint
        try:
            response, content = sr.simpleRequest('{}?output_mode=json'.format(endpoint),
                                            sessionKey=session_key, method='GET',
                                            raiseAllErrors=True)
        except Exception as e:
            logging.exception(str(e))
            return {}
        if response['status'] not in success_codes:
            return {}
        content = json.loads(content)
        dismissed_app_details = {}
        for app in content:
            dismissed_app_details[app['app_path']] = {}
            dismissed_app_details[app['app_path']]['dismiss_app_date'] = app['dismiss_app_date']
        return dismissed_app_details
    except Exception as e:
        logging.exception("Could not fetch dismissed apps from kvstore: {}".format(str(e)))
        return {}

def get_dismiss_app_file_system(host, user):
    """
    Get the dismissed app name details from file system.
    :param host: Host of the machine.
    :param user: Name of the user

    :returns Dictionary of details of the dismissed apps.
    """
    try:
        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_dismiss_app_collection, user, host)
        content = pura_storage_utils.read(file_details["file_path"])
        if content is None:
            return {}
        dismissed_app_details = {}
        for app in content:
            dismissed_app_details[app['app_path']] = {}
            dismissed_app_details[app['app_path']]['dismiss_app_date'] = app['timestamp']
        return dismissed_app_details
    except Exception as e:
        logging.exception("Could not fetch the dismissed apps from file system: {}".format(str(e)))
        return {}


def get_dismiss_file_kvstore_details(session_key, scan_type="python"):
    """
    Get the dismissed file details from kvstore.
    :param session_key: Session key of the user.
    :returns Dictionary containing dismissed file details.
    """
    # structure-
    # {'/opt/splunk/etc/apps/app1': [{'file_path': '/opt/splunk/etc/apps/app1/file1', 'check': 'check1'}]}
    try:
        endpoint = ""
        if scan_type.lower() == "python":
            endpoint = pra_dismiss_remote_file_endpoint
        elif scan_type.lower() == "jquery":
            endpoint = jra_dismiss_remote_file_endpoint
        elif scan_type.lower() == "emerald":
            endpoint = era_dismiss_remote_file_endpoint
        try:
            response, content = sr.simpleRequest('{}?output_mode=json'.format(endpoint),
                                            sessionKey=session_key, method='GET',
                                            raiseAllErrors=True)
        except Exception as e:
            logging.exception(str(e))
            return {}
        if response['status'] not in success_codes:
            return {}
        content = json.loads(content)
        dismissed_file_details = {}
        for app in content:
            temp = {}
            if dismissed_file_details.get(app['app_path']):
                temp['file_path'] = app['file_path']
                temp['check'] = app['check']
                temp['instance'] = app['instance']
                temp['app_name'] = app['app']
            else:
                dismissed_file_details[app['app_path']] = []
                temp['file_path'] = app['file_path']
                temp['check'] = app['check']
                temp['instance'] = app['instance']
                temp['app_name'] = app['app']
            dismissed_file_details[app['app_path']].append(copy.deepcopy(temp))
        return dismissed_file_details
    except Exception as e:
        logging.exception("Could not fetch the dismissed files from kvstore: {}".format(str(e)))
        return {}

def get_dismiss_file_file_system(host, user):
    """
    Get the dismissed file details from file system.
    :param host: Host of the machine.
    :param user: Name of the user

    :returns Dictionary of details of the dismissed files.
    """
    # structure-
    # {'/opt/splunk/etc/apps/app1': [{'file_path': '/opt/splunk/etc/apps/app1/file1', 'check': 'check1', 'app_name':'app1', 'instance':'local'}]}
    try:
        file_details = pura_storage_utils.create_dirs_if_not_exists(pra_dismiss_file_collection, user, host)
        content = pura_storage_utils.read(file_details["file_path"])
        if content is None:
            return {}
        dismissed_file_details = {}
        for app in content:
            temp = {}
            if dismissed_file_details.get(app['app_path']):
                temp['file_path'] = app['file_path']
                temp['check'] = app['check']
            else:
                dismissed_file_details[app['app_path']] = []
                temp['file_path'] = app['file_path']
                temp['check'] = app['check']
            dismissed_file_details[app['app_path']].append(copy.deepcopy(temp))
        return dismissed_file_details
    except Exception as e:
        logging.exception("Could not fetch the dismissed files from file system: {}".format(str(e)))
        return {}

def get_dismiss_check_kvstore_details(session_key):
    """
    Get the dismissed check details from the kvstore.
    :param session_key: Session key of the user.
    :returns Dictionary containing dismissed check details.
    """
    try:
        endpoint = era_dismiss_remote_system_check_endpoint
        try:
            response, content = sr.simpleRequest('{}?output_mode=json'.format(endpoint),
                                            sessionKey=session_key, method='GET',
                                            raiseAllErrors=True)
        except Exception as e:
            logging.exception(str(e))
            return {}
        if response['status'] not in success_codes:
            return {}
        content = json.loads(content)
        dismissed_check_details = {}
        for system_check in content:
            dismissed_check_details[system_check['check_name']] = {}
            dismissed_check_details[system_check['check_name']]['dismiss_check_date'] = system_check['dismiss_check_date']
        return dismissed_check_details
    except Exception as e:
        logging.exception("Could not fetch dismissed checks from kvstore: {}".format(str(e)))
        return {}


def filter_dismissed_apps(report, kvstore_details):
    try:
        for _app in report.get('apps', []):
            if kvstore_details.get(_app['app_path']):
                _app['summary']['dismiss_app'] = 1
                _app['summary']['dismiss_app_date'] = kvstore_details[_app['app_path']]['dismiss_app_date']
                old_app_status = _app['summary']['Status']
                _app['summary']['Status'] = CHECK_CONST_DISMISSED
                report['summary'] = update_report_summary(report['summary'], old_app_status, _app['summary']['Status'], _app['summary']['type'])
        return True
    except Exception as e:
        logging.exception("Could not filter the dismissed apps: {}".format(str(e)))
        return False

def filter_dismissed_checks(report, kvstore_details):
    try:
        for check in report.get('system', []):
            if kvstore_details.get(check['name']):
                check['summary']['dismiss'] = 1
                check['summary']['dismiss_date'] = kvstore_details[check['name']]['dismiss_check_date']
                old_status = check['summary']['Status']
                check['summary']['Status'] = CHECK_CONST_DISMISSED
                if old_status == CHECK_CONST_BLOCKER:
                    system_blocker = report["summary"]["system_blocker"]
                    system_dismissed = report["summary"]["system_dismissed"]
                    report['summary']["system_blocker"] = system_blocker - 1
                    report['summary']["system_dismissed"] = system_dismissed + 1
                else:
                    system_passed = report["summary"]["system_passed"]
                    system_dismissed = report["summary"]["system_dismissed"]
                    report['summary']["system_passed"] = system_passed - 1
                    report['summary']["system_dismissed"] = system_dismissed + 1
        return True
    except Exception as e:
        logging.exception("Could not filter the dismissed apps: {}".format(str(e)))
        return False

def filter_dismissed_files(report, kvstore_details, is_remote=True, scan_type="python"):
    """
    Filter the report with dismissed file kvstore details.
    :param report: Report containing the scan details.
    :param kvstore_details: dictionary containing the dismissed file details for a particular host.
    """
    try:
        compatible_msg = ""
        if scan_type.lower() == "python":
            compatible_msg = 'This app is compatible with Python 3.'
        elif scan_type.lower() == "jquery":
            compatible_msg = 'This app is compatible with jQuery 3.5.'
        elif scan_type.lower() == "emerald":
            compatible_msg = EMERALD_DETAILS_COMPATIBLE.format("app")

        for _app in report.get('apps', []):
            if kvstore_details.get(_app['app_path']):
                old_app_status = _app['summary']['Status']
                for file_details in kvstore_details[_app['app_path']]:
                    check = file_details['check']
                    file_path = file_details['file_path']
                    for _check in _app['checks']:
                        if _check['name'] == check:
                            if is_remote:
                                dismissed_instance = file_details["instance"]
                                file_path = file_details["app_name"].join(file_path.split(file_details["app_name"])[1:])
                                _check['messages'], dismissed_message_count = update_check_messages_remote(_check['messages'],
                                                                                                    file_path, dismissed_instance, _app['name'])
                            else:
                                _check['messages'], dismissed_message_count = update_check_messages(_check['messages'],
                                                                                                        file_path)

                            if dismissed_message_count == len(_check['messages']):
                                old_result = _check['result']
                                _check['result'] = CHECK_CONST_PASSED
                                _check['required_action'] = CHECK_CONST_PASSED_MSG
                                _app['summary'] = update_check_count(_app['summary'], old_result)
                                if _app['summary']['Status'] == CHECK_CONST_PASSED:
                                    _app['required_action'] = 'None'
                                    _app['details'] = compatible_msg
                                report['summary'] = update_report_summary(report['summary'],
                                                                                old_app_status,
                                                                                _app['summary']['Status'],
                                                                                _app['summary']['type'])
                            break
        return True
    except Exception as e:
        logging.exception("Could not filter the dismissed files: {}".format(str(e)))
        return False


def update_check_messages(messages, file_path):
    dismissed_message_count = 0
    for i in messages:
        if i['message_filename'] == file_path:
            i['dismissed'] = 1

        if i['dismissed'] == 1:
            dismissed_message_count += 1
    return messages, dismissed_message_count


def update_check_messages_remote(messages, file_path, dismissed_instance, app_name):
    dismissed_message_count = 0
    for i in messages:
        if (app_name.join(i['message_filename'].split(app_name)[1:]) == file_path) and (i['instance'] == dismissed_instance):
            i['dismissed'] = 1

        if i['dismissed'] == 1:
            dismissed_message_count += 1
    return messages, dismissed_message_count

def update_report_summary(report_summary, old_app_status, new_app_status, type):
    """
    Update report summary if app has all the checks passed

    :param report_summary: Existing report summary
    :param old_app_status: Previous app status
    :param new_app_status: Latest app status

    :return Updated report_summary
    """
    if old_app_status == CHECK_CONST_DISMISSED:
        return report_summary
    key = ''
    if type == CONST_PRIVATE:
        key = 'private_'
    else:
        key = 'public_'
    passed = report_summary[key+'passed']
    blocker = report_summary[key+'blocker']
    warning = report_summary[key+'warning']
    unknown = report_summary[key+'unknown']
    dismissed_str = key+'dismissed'
    dismissed = report_summary.get(dismissed_str, 0)

    if new_app_status == CHECK_CONST_PASSED:
        passed += 1
        if ((old_app_status == CHECK_CONST_BLOCKER) or (old_app_status == CHECK_CONST_UNKNOWN)):
            blocker -= 1
        elif old_app_status == CHECK_CONST_WARNING:
            warning -= 1
    elif new_app_status == CHECK_CONST_WARNING:
        warning += 1
        if old_app_status == CHECK_CONST_BLOCKER:
            blocker -= 1
    elif new_app_status == CHECK_CONST_BLOCKER:
        blocker += 1
        if old_app_status == CHECK_CONST_WARNING:
            warning -= 1
        elif old_app_status == CHECK_CONST_BLOCKER:
            blocker -= 1
    elif new_app_status == CHECK_CONST_DISMISSED:
        dismissed += 1
        if old_app_status == CHECK_CONST_WARNING:
            warning -= 1
        if ((old_app_status == CHECK_CONST_BLOCKER) or (old_app_status == CHECK_CONST_UNKNOWN)):
            blocker -= 1

    report_summary[key+'passed'] = passed
    report_summary[key+'blocker'] = blocker
    report_summary[key+'warning'] = warning
    report_summary[key+'unknown'] = unknown
    report_summary[key+'dismissed'] = dismissed

    return report_summary

def update_check_count(summary, result):
    """
    Update app summary based on changed result for check

    :param summary: Existing check summary
    :param result: Previous result of check

    :return Updated check summary for app
    """

    passed = summary['Passed']
    blocker = summary['Blocker']
    warning = summary['Warning']
    skipped = summary['Skipped']
    status = summary['Status']

    if result == CHECK_CONST_BLOCKER:
        blocker -= 1
    elif result == CHECK_CONST_WARNING:
        warning -= 1
    elif result == CHECK_CONST_SKIPPED:
        skipped -= 1

    passed += 1
    if status == CHECK_CONST_DISMISSED:
        # skipping to change the app status if it is dismissed
        status = CHECK_CONST_DISMISSED
    elif skipped > 0:
        status = CHECK_CONST_UNKNOWN
    elif blocker > 0:
        status = CHECK_CONST_BLOCKER
    elif blocker == 0 and warning > 0:
        status = CHECK_CONST_WARNING
    else:
        status = CHECK_CONST_PASSED

    summary.update({
        'Passed': passed,
        'Blocker': blocker,
        'Warning': warning,
        'Skipped': skipped,
        'Status': status
    })

    return summary

def convert_filepath_to_relative(results):
    """
    Convert the filenames to relative paths.
    :param results: Scan report.
    """
    for app in results.get("apps", []):
        app_name = app["name"]
        for check in app.get("checks", []):
            for message in check.get("messages", []):
                message_filename = message["message_filename"]
                app_name_index = message_filename.find(app_name)+len(app_name)
                message_filename_relative = "...{}".format(message_filename[app_name_index:])
                message["message_filename"] = message_filename_relative

def add_details_to_kvstore(endpoint, details, session_key, user, host):
    """
    Add the details to kvstore.
    :param endpoint: Kvstore endpoint to which details are to be added.
    :param details: Details which are to be saved in kvstore.
    :returns Whether details were saved or not.
    """
    try:
        response, _ = sr.simpleRequest(
                endpoint,
                sessionKey=session_key,
                jsonargs=json.dumps(details),
                method="POST",
                raiseAllErrors=True,
        )
        if response["status"] not in success_codes:
            logging.error(
                MESSAGE_ERROR_KVSTORE_WRITE.format(endpoint, user, host)
            )
            return False
        return True
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_KVSTORE_WRITE.format(endpoint, user, host, str(e)))
        return False


def get_details_from_kvstore(endpoint, session_key, user, host):
    """
    Get the saved details from kvstore.
    :param endpoint: Kvstore endpoint to which details are to be added.
    :returns Details from the kvstore for the endpoint.
    """
    try:
        response, content = sr.simpleRequest(
            endpoint,
            sessionKey=session_key,
            raiseAllErrors=True,
        )
        if response["status"] not in success_codes:
            logging.error(MESSAGE_ERROR_KVSTORE_READ.format(endpoint, user, host))
            return None
        schedule_scan_details = dict()
        for schedule_scan_detail in json.loads(content):
            schedule_scan_details = schedule_scan_detail
        return schedule_scan_details
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_KVSTORE_READ.format(endpoint, user, host, str(e)))
        return None

def add_details_to_scripted_input(endpoint, details, session_key, user, host):
    """
    Add the details to scripted input.
    :param endpoint: scripted endpoint to which details are to be added.
    :param details: Details which are to be saved in scripted input.
    :returns Whether details were saved or not.
    """
    try:
        response, _ = sr.simpleRequest(
                endpoint,
                sessionKey=session_key,
                postargs=details,
                method="POST",
                raiseAllErrors=True,
        )
        if response["status"] not in success_codes:
            logging.error(
                MESSAGE_ERROR_SCRIPTED_INPUT_WRITE.format(endpoint, user, host)
            )
            return False
        return True
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_SCRIPTED_INPUT_WRITE.format(endpoint, user, host, str(e)))
        return False

def save_jura_scripted_input(email_switch_details, session_key, user, host):
    """
    Modify the jQuery scripted input details.

    :param email_switch_details: dictionary containing the new values.
    :return: whether the details were modified in the scripted input.
    """
    try:
        if APP_DIR == OTHER_APPS_DIR:
            # if app is in etc/apps
            scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fapps%252Fpython_upgrade_readiness_app%252Fbin%252Fjura_send_email.py"
        else:
            scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fslave-apps%252Fpython_upgrade_readiness_app%252Fbin%252Fjura_send_email.py"
        endpoint = send_email_endpoint.format(scripted_input_endpoint)
        is_jra_email_disabled = 1 - email_switch_details.get("is_jra_email_enabled")
        postargs = {"disabled": is_jra_email_disabled}
        is_jura_details_saved = add_details_to_scripted_input(endpoint, postargs, session_key, "", host)
        return is_jura_details_saved
    except Exception as e:
        logging.exception(str(e))
        return False

def save_pura_scripted_input(email_switch_details, session_key, user, host):
    """
    Modify the python scripted input details.

    :param email_switch_details: dictionary containing the new values.
    :return: whether the details were modified in the scripted input.
    """
    try:
        if APP_DIR == OTHER_APPS_DIR:
            # if app is in etc/apps
            scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fapps%252Fpython_upgrade_readiness_app%252Fbin%252Fpura_send_email.py"
        else:
            scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fslave-apps%252Fpython_upgrade_readiness_app%252Fbin%252Fpura_send_email.py"
        endpoint = send_email_endpoint.format(scripted_input_endpoint)
        is_pra_email_disabled = 1 - email_switch_details.get("is_pra_email_enabled")
        postargs = {"disabled": is_pra_email_disabled}
        is_pura_details_saved = add_details_to_scripted_input(endpoint, postargs, session_key, "", host)
        return is_pura_details_saved
    except Exception as e:
        logging.exception(str(e))
        return False

def save_eura_scripted_input(email_switch_details, session_key, user, host):
    """
    Modify the python scripted input details.

    :param email_switch_details: dictionary containing the new values.
    :return: whether the details were modified in the scripted input.
    """
    try:
        if APP_DIR == OTHER_APPS_DIR:
            # if app is in etc/apps
            scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fapps%252Fpython_upgrade_readiness_app%252Fbin%252Feura_send_email.py"
        else:
            scripted_input_endpoint = "$SPLUNK_HOME%252Fetc%252Fslave-apps%252Fpython_upgrade_readiness_app%252Fbin%252Feura_send_email.py"
        endpoint = send_email_endpoint.format(scripted_input_endpoint)
        is_era_email_disabled = 1 - email_switch_details.get("is_era_email_enabled")
        postargs = {"disabled": is_era_email_disabled}
        is_eura_details_saved = add_details_to_scripted_input(endpoint, postargs, session_key, "", host)
        return is_eura_details_saved
    except Exception as e:
        logging.exception(str(e))
        return False

def save_email_switch_details_in_local(email_switch_details, session_key, user, host):
    """
    Save the new python and jQuery scripted details.

    :param email_switch_details: dictionary containing new values.
    :return: whether the scripted inputs were modified sucessfully or not.
    """
    try:
        is_eura_details_saved = True
        is_pura_details_saved = True
        is_jura_details_saved = True
        if email_switch_details.get("is_pra_email_enabled") is not None:
            email_switch_details["is_pra_email_enabled"] = int(str(email_switch_details["is_pra_email_enabled"]))
            is_pura_details_saved = save_pura_scripted_input(email_switch_details, session_key, user, host)
        if email_switch_details.get("is_jra_email_enabled") is not None:
            email_switch_details["is_jra_email_enabled"] = int(str(email_switch_details["is_jra_email_enabled"]))
            is_jura_details_saved = save_jura_scripted_input(email_switch_details, session_key, user, host)
        if email_switch_details.get("is_era_email_enabled") is not None:
            email_switch_details["is_era_email_enabled"] = int(str(email_switch_details["is_era_email_enabled"]))
            is_eura_details_saved = save_eura_scripted_input(email_switch_details, session_key, user, host)
        return is_pura_details_saved or is_jura_details_saved or is_eura_details_saved
    except Exception as e:
        logging.exception(str(e))
        return False

def get_connection_object(session_key, owner=None):
    """
    Create a new connection object for oneshot.
    :param session_key: Session key of the logged in user.

    :return: oneshot connection object.
    """
    logging.info("Creating a new connection object for oneshot.")
    try:
        args = {"token": session_key}
        if owner:
            args["owner"] = owner
        service = client.connect(**args)
        return service
    except Exception as e:
        logging.exception(str(e))
        return None

def one_shot_str_wrapper(path, service):
    """
    Make a rest call using one shot str.

    :param path: Path of the rest endpoint.
    :param service: One shot connection object.

    :return: Containing the details of the new service object if created and the response
                    of the rest endpoint call.
    """
    response = []
    logging.info("Calling path: {} using oneshot ".format(path))
    try:
        if service is None:
            return []
        oneshot_job = service.jobs.oneshot(path)
        response = results.ResultsReader(oneshot_job)
        return response
    except Exception as e:
        logging.exception(str(e))
        return []

def get_local_host_details(service):
    """
    Get the details about local host.

    :param service: One shot connection object.
    """
    local_host_details = one_shot_str_wrapper(
        oneshot_local_host_details,
        service
    )
    return local_host_details

def get_all_host_details(service):
    """
    Get the details about all the hosts.

    :param service: One shot connection object.
    """
    hosts_details = one_shot_str_wrapper(
        oneshot_all_hosts_details,
        service
    )
    return hosts_details

def get_host_details(service):
    """
    Get the host details using oneshot str

    :param service: One shot connection object.
    :return dict: Dictionary containing the details(host, all_hosts, current_roles) of the host.
    eg. {"host": "", "all_hosts": [], "current_roles": []}
    """
    host = ""
    current_roles = []
    all_hosts = []
    try:
        local_host = get_local_host_details(service)
        for item in local_host:
            content = dict(item)
            host = content['splunk_server']
            current_roles = content['server_roles']

        hosts = get_all_host_details(service)
        for item in hosts:
            content = dict(item)
            details = {"host": content['splunk_server'], "roles": content['server_roles']}
            all_hosts.append(copy.deepcopy(details))
        logging.info("all_hosts {}".format(all_hosts))
    except Exception as e:
        logging.exception(str(e))

    return {"host": host, "all_hosts": all_hosts, "current_roles": current_roles}

def get_latest_report(all_reports):
    """
    Get the latest report from the list of reports.
    :param user_reports: List of user report names.

    :return
        Filename of the latest report if it exists.
        If no file exists then empty string.
    """
    final_report = ""
    latest_timestamp = 0
    for report in all_reports:
        timestamp = (report[:-5])[-10:]
        if int(timestamp) > latest_timestamp:
            latest_timestamp = int(timestamp)
            final_report = report
    return final_report, latest_timestamp

def get_scan_completion_time(filepath):
    """
    Get the scan completion time for the specified file path.
    :param filepath: Path of the scan report file.

    :return Scan completion time. 0 if the filepath does not exists or is empty
    """
    try:
        if not os.path.exists(filepath):
            return 0
        file_data = {}
        with open(filepath, "r") as f:
            file_data = json.load(f)
        scan_time = file_data.get("summary", {}).get("scan_completion_time", 0)
        return scan_time
    except Exception as e:
        logging.exception(str(e))
        return 0

def read_latest_report_filepath(scan_type="python", is_remote=False):
    """
    Get the file path for the latest report for the user according to the scan type and is remote instance or not.
    :param scan_type: The type of the scan eg. python, jquery.
    :param is_remote: Is the report needed for an scheduled scan or not. If the report is needed for an adhoc/manual
        scan then is_remote=False. If the report is nedded for scheduled scan then is_remote=True

    :return
        File path of the report if present.
        If the file path is not present then empty string is returned.
    """
    if not is_remote:
        merged_report_path = ""
        if not os.path.isdir(LOCAL_DIR):
            os.makedirs(LOCAL_DIR)
        dir_path = REPORT_PATH
        if scan_type.lower() == "python":
            if not os.path.isdir(REPORT_PATH):
                os.makedirs(REPORT_PATH)
            dir_path = REPORT_PATH
            merged_report_path = os.path.join(MERGED_DIR, MERGED_FILE_JSON)
        elif scan_type.lower() == "jquery":
            if not os.path.isdir(JQUERY_REPORT_PATH):
                os.makedirs(JQUERY_REPORT_PATH)
            dir_path = JQUERY_REPORT_PATH
            merged_report_path = os.path.join(JQUERY_MERGED_DIR, MERGED_FILE_JSON)
        elif scan_type.lower() == "emerald":
            if not os.path.isdir(EMERALD_REPORT_PATH):
                os.makedirs(EMERALD_REPORT_PATH)
            dir_path = EMERALD_REPORT_PATH
            merged_report_path = os.path.join(EMERALD_MERGED_DIR, MERGED_FILE_JSON)
        all_reports = os.listdir(dir_path)
        final_report, final_report_timestamp = get_latest_report(all_reports)
        merged_report_timestamp = get_scan_completion_time(merged_report_path)
        if (not final_report) and (merged_report_timestamp == 0):
            return ""
        if final_report_timestamp > merged_report_timestamp:
            filepath = os.path.join(dir_path, final_report)
        else:
            filepath = merged_report_path
        return filepath
    else:
        filepath = ""
        if scan_type.lower() == "python":
            filepath = os.path.join(MERGED_DIR, MERGED_FILE_JSON)
        elif scan_type.lower() == "jquery":
            filepath = os.path.join(JQUERY_MERGED_DIR, MERGED_FILE_JSON)
        elif scan_type.lower() == "emerald":
            filepath = os.path.join(EMERALD_MERGED_DIR, MERGED_FILE_JSON)
        if not os.path.exists(filepath):
            return ""
        return filepath


def add_missing_keys_in_report(report):
    """
    Add missing keys in the report if not present.
    :param report: Scan report for the user.

    :return
        Updated report containing the missing keys if they are not present.
    """
    try:
        report_copy = copy.deepcopy(report)
        for app in report_copy.get("apps", []):
            if "remote_version" not in app:
                app["remote_version"] = ""
            for check in app.get("checks", []):
                for message in check.get("messages", []):
                    if "instance" not in message:
                        message["instance"] = "local"
                    if "identical" not in message:
                        message["identical"] = 0
        if report_copy.get("summary", {}):
            if "public_dismissed" not in report_copy["summary"]:
                report_copy["summary"]["public_dismissed"] = 0
            if "private_dismissed" not in report_copy["summary"]:
                report_copy["summary"]["private_dismissed"] = 0
        return report_copy
    except Exception as e:
        logging.exception("Exception occured while adding instance in report exception: {}".format(str(e)))
        return report

def get_cloud_instance_type():
    """
    Check whether the cloud instance is noah or not.
    If the temporary noah file is present the instance is noah.
    """
    try:
        if os.path.exists(NOAH_PATH):
            return "noah"
        return "classic"
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_FETCHING_CLOUD_INSTANCE_TYPE.format(str(e)))
        return "noah"

def check_is_remote():
    """
    Check whether manual scan is to be shown or not.
    If the cloud instance is noah then manual scan is to shown.
    """
    cloud_instance_type = get_cloud_instance_type()
    if cloud_instance_type == "noah":
        return False
    return True


def is_cancelled(key, user, host, cancel_scan_collection):
    """
    Check for cancelled status for user and host.

    :param key: the key of the entry

    :return True/False, Dict of entry
    """
    file_details = pura_storage_utils.create_dirs_if_not_exists(cancel_scan_collection, user, host)
    content = pura_storage_utils.read(file_details["file_path"])
    c_value = dict()

    if content is None:
        logging.exception(MESSAGE_EXCEPTION_READ_FILE_STORE.format(user, host))
        empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
        return True, {}
    content = pura_storage_utils.search(content, {"_key": key})

    if content is None:
        logging.error(MESSAGE_ERROR_READING_PROGRESS.format(user, host))
        empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
        return True, {}

    elif len(content) > 0:
        entry = content[0]
        if entry['cancelled']:
            empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
            return True, entry

    return False, {}

def write_progress(host, user, session_key, scan_key, cancel_scan_key, scan_report, get_progress_collection, cancel_scan_collection):
    """
    Write progress in KV store.

    :param scan_report: current scan report

    :return Proceed(True/False), Write Hash(True/False) based on whether scan is cancelled or not
    """

    c_value = dict()

    data = {
        'process_id': os.getpid(),
        'host': host,
        'user': user,
        'progress': 0,
        'status': PROGRESS_NEW,
        'message': "Run new scan"
    }

    data.update({
        'progress': scan_report['progress'],
        'status': scan_report['status'],
        'message': scan_report['message']
    })

    file_details = pura_storage_utils.create_dirs_if_not_exists(get_progress_collection, user, host)
    response = pura_storage_utils.read(file_details["file_path"])
    response = pura_storage_utils.search(response, {"_key": scan_key})

    if not response:
        empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
        return False, True

    cancelled, entry = is_cancelled(cancel_scan_key, user, host, cancel_scan_collection)

    if cancelled:
        logging.info("Scan has been cancelled.")
        empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
        return False, False

    file_details = pura_storage_utils.create_dirs_if_not_exists(get_progress_collection, user, host)
    response = pura_storage_utils.update(file_details["file_path"], data, scan_key)

    if not response:
        logging.error(MESSAGE_ERROR_WRITING_PROGRESS.format(user, host))
        empty_file = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
        return False, True

    return True, True

def update_structure(scan_summary, scanType, is_config):
    """
    Update the apps structure to write in skynet.
    """
    updated_data = []
    try:
        summary_data = []
        if is_config:
            summary_data = scan_summary.get("system", [])
        else:
            summary_data = scan_summary.get("apps", [])
        for summary in summary_data:
            data = {}
            data["timestamp"] = int(time())
            data["name"] = summary.get("name", "")
            data["scanType"] = scanType
            data["version"] = ""
            data["status"] = ""
            data["details"] = summary.get("details", "")
            data["label"] = summary.get("label", data["name"])
            if not is_config:
                data["version"] = summary.get("version", "")
                data["status"] = summary.get("status", "")
                data["appType"] = summary.get("type", "")
                data["meta"] = summary.get("meta", {})
            else:
                data["status"] = summary.get("summary", {}).get("Status", "")
                data["appType"] = "config"
                data["meta"] = scan_summary.get("summary", {})
            data["type"] = scan_summary.get("statistics", {}).get("type", "")
            data["component"] = scan_summary.get("statistics", {}).get("component", "")
            data["data"] = {}
            data["data"]["URAAppVersion"] = scan_summary.get("statistics", {}).get("data", {}).get("appVersion", "")
            data["data"]["scanType"] = scan_summary.get("statistics", {}).get("data", {}).get("scanType", "")
            data["data"]["scanTypeModified"] = scan_summary.get("statistics", {}).get("data", {}).get("scanTypeModified", "")
            data["is_summary"] = False
            updated_data.append(data)
        return updated_data
    except Exception as e:
        logging.exception(str(e))
        return []

def update_summary(scan_summary):
    """
    Create a new structure for scan summary for writing to skynet data.
    """
    summary = {}
    summary["timestamp"] = int(time())
    try:
        summary["type"] = scan_summary.get("statistics", {}).get("type", "")
        summary["component"] = scan_summary.get("statistics", {}).get("component", "")
        summary["data"] = {}
        summary["data"]["URAAppVersion"] = scan_summary.get("statistics", {}).get("data", {}).get("appVersion", "")
        summary["data"]["scanType"] = scan_summary.get("statistics", {}).get("data", {}).get("scanType", "")
        summary["data"]["scanTypeModified"] = scan_summary.get("statistics", {}).get("data", {}).get("scanTypeModified", "")
        summary["summary"] = scan_summary.get("summary", {})
        summary["is_summary"] = True
        return summary
    except Exception as e:
        logging.exception(str(e))
        return {}

def update_skynet_data(filepath, apps, summary):
    """
    Update the data in skynet folder for URA.

    :param filepath: Filepath where the data is to be updated.
    :param apps: Updated data of the apps which are to be updated.
    """
    try:
        skynet_apps = []
        if os.path.exists(filepath):
            with open(filepath, "r") as f:
                try:
                    skynet_apps = json.load(f)
                except Exception:
                    skynet_apps = []
        updated_apps = set()
        all_apps = []
        is_summary_added = False
        for skynet_app in skynet_apps:
            is_app_added = False
            if (skynet_app.get("is_summary", True)) and (skynet_app["component"] == summary["component"]):
                all_apps.append(summary)
                is_summary_added = True
                continue
            for app in apps:
                if (not skynet_app.get("is_summary", True)) and (skynet_app["name"] == app["name"]) and (skynet_app["scanType"] == app["scanType"]):
                    updated_apps.add((app["name"], app["scanType"]))
                    all_apps.append(app)
                    is_app_added = True
                    break
            if not is_app_added:
                all_apps.append(skynet_app)
        for app in apps:
            if (app["name"], app["scanType"]) not in updated_apps:
                all_apps.append(app)
        if not is_summary_added:
            all_apps.append(summary)
        with open(filepath, "w+") as f:
            json.dump(all_apps, f)
    except Exception as e:
        logging.exception(str(e))
    return
