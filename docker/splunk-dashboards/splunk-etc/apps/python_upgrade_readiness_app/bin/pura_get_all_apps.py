from __future__ import division
import json
import math
import csv
import sys
import os
import time
import copy

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager
import requests
from pura_libs_utils import six
from pura_libs_utils.pura_consts import *

logging = logger_manager.setup_logging('pura_get_all_apps')

SUCCESS_CODES = ["200", "201", "204"]

BASE_URL = "https://splunkbase.splunk.com/api/v1/app/"
LIMIT = 100
PARAMS = {
    "include": "releases,releases.splunk_compatibility",
    "limit": LIMIT,
    "offset": 0,
    "order": "latest"
}
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_DIR = os.path.join(APP_DIR, "local")
APP_LIST_DIR = os.path.join(APP_DIR, "local", "app_list")
CSV_FILENAME = "splunkbaseapps_{0}.csv"
CSV_APPS = {}

MESSAGE_EXCEPTION_GET_APPS = "Error getting apps: {}"
MESSAGE_ERROR_GET_APPS = "Could not get the apps status code: {} content: {}"
MESSAGE_FAILED_SYNC_APPS = "Failed to sync apps: {}"
MESSAGE_ERROR_FILE_WRITE = "Could not write to file: {}"
MESSAGE_EXCEPTION_GET_LATEST_FILE = 'Exceptioin fetching the latest file: {}'
MESSAGE_EXCEPTION_GET_CSV_APPS = 'Exceptioin fetching the apps from csv: {}'

if six.PY2:
    FILE_ARGS = {"mode":"wb"}
elif six.PY3:
    FILE_ARGS = {"mode":"w","newline":""}

def write_to_file(file_contents, file_path):
    """
    Write contents to the specified file

    :param file_contents: Content/Data to be written into the file
    :param file_path: Path of the file in which contents are to written
    """
    logging.info("Writing to file {0}".format(file_path))
    try:
        with open(file_path, **FILE_ARGS) as csvfile:
            csvwriter = csv.writer(csvfile)
            csvwriter.writerows(file_contents)
        logging.info("Successfully written to file {0}".format(file_path))
        return True
    except Exception as e:
        logging.exception(MESSAGE_ERROR_FILE_WRITE.format(str(e)))
        return False

def find_versions_for_apps(apps):
    """
    Find the version details for the apps

    :param apps: List of all the apps for which version is to be found out

    :return List of all apps with versions
    """
    all_apps = []
    for app in apps:
        app_detail = [app.get("appid"), app.get("title"), app.get("path")]
        versions = ""
        for release in app.get("releases", []):
            version_title = release.get("title")
            splunk_compatibilities = "|".join(release.get("splunk_compatibility"))
            if versions:
                versions = "{0};{1}#{2}|".format(versions, version_title, splunk_compatibilities)
            else:
                versions = "{0}#{1}|".format(version_title, splunk_compatibilities)
        if not versions:
            versions = "-"
        app_detail.append(versions)
        all_apps.append(app_detail)
    return all_apps

def compare_csv_apps_and_response(response_apps):
    """
    Compare the csv apps and the apps got from splunkbase response.
    Update the csv apps

    :param response_apps: List of apps from the splunkbase response
    """
    global CSV_APPS
    for app in response_apps:
        app_id = app.get("appid")
        csv_app = CSV_APPS.get(app_id, {})
        if csv_app:
            CSV_APPS[app_id]["title"] = app.get("title")
            new_releases = {}
            csv_releases = csv_app.get("releases", [])
            app_releases = app.get("releases", [])
            for csv_app_release in csv_releases:
                new_releases[csv_app_release.get("title")] = copy.deepcopy(csv_app_release)
            for app_release in app_releases:
                app_release_title = app_release.get("title")
                if new_releases.get(app_release_title):
                    # app release also present in synced/splunkbase csv
                    app_splunk_compatibility = copy.deepcopy(app_release.get("splunk_compatibility", []))
                    csv_splunk_compatibility = copy.deepcopy(new_releases[app_release_title].get("splunk_compatibility", []))
                    app_splunk_compatibility.extend(x for x in csv_splunk_compatibility if x not in app_splunk_compatibility)
                    new_release = {"title": app_release_title, "splunk_compatibility": copy.deepcopy(app_splunk_compatibility)}
                    new_releases[app_release_title] = copy.deepcopy(new_release)
                else:
                    # app release not present in synced/splunkbase csv
                    app_splunk_compatibility = app_release.get("splunk_compatibility", [])
                    new_release = {"title": app_release_title, "splunk_compatibility": app_splunk_compatibility}
                    new_releases[app_release_title] = copy.deepcopy(new_release)
            CSV_APPS[app_id]["releases"] = copy.deepcopy(list(new_releases.values()))
        else:
            # app not present in synced/splunkbase csv
            CSV_APPS[app_id] = {}
            CSV_APPS[app_id]["appid"] = app_id
            CSV_APPS[app_id]["title"] = app.get("title")
            CSV_APPS[app_id]["path"] = app.get("path")
            CSV_APPS[app_id]["releases"] = app.get("releases", [])


def get_apps():
    """
    Get all the apps from splunkbase

    :return Whether all apps are successfully fetched or updated or not
    """
    try:
        max_page_number = 0
        current_page_number = 1
        logging.info("Fetching apps limit- {0} and offset- {1}".format(LIMIT, PARAMS["offset"]))
        response = requests.get(url=BASE_URL, params=PARAMS)
        if str(response.status_code) not in SUCCESS_CODES:
            logging.error(MESSAGE_ERROR_GET_APPS.format(response.status_code, response.content.decode("utf-8")))
            return []
        apps = response.json()
        compare_csv_apps_and_response(response_apps=apps.get("results", []))
        total_apps = apps.get("total")
        max_page_number = math.ceil(total_apps/LIMIT)
        while current_page_number < max_page_number:
            current_page_number = current_page_number + 1
            PARAMS["offset"] = PARAMS["offset"] + LIMIT
            logging.info("Fetching apps limit- {0} and offset- {1}".format(LIMIT, PARAMS["offset"]))
            response = requests.get(url=BASE_URL, params=PARAMS)
            if str(response.status_code) not in SUCCESS_CODES:
                logging.error(MESSAGE_ERROR_GET_APPS.format(response.status_code, response.content.decode("utf-8")))
                return []
            apps = response.json()
            compare_csv_apps_and_response(response_apps=apps.get("results", []))
        logging.info("Successfully fetched all the apps")
        return True
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_GET_APPS.format(str(e)))
        return False

def create_dirs(dirs_path):
    """Create directories

    Args:
        :param dirs_path: List of path of directories to be created if not present
    """
    for dir in dirs_path:
        if not os.path.isdir(dir):
            logging.info("Creating dir {0} as it not present".format(dir))
            os.makedirs(dir)

def delete_previous_files(dir_path, exclude_file_name):
    """Delete the previously synced files

    :param dir_path: Path of the directory in which files are present
    :param exclude_file_name: Name of file exluded in deletion
    """
    for csv_file in os.listdir(dir_path):
        if csv_file != exclude_file_name:
            csv_path = os.path.join(dir_path, csv_file)
            if os.path.exists(csv_path):
                logging.info("Deleting {0} as they are previous synced files".format(csv_path))
                os.remove(csv_path)

def get_compatibility(compatibility):
    """
    Returns the compatibilty based type of app

    :param compatibility: Compatibility with version

    :return Compatibility type
    """
    releases = []
    all_versions = compatibility.split(";")
    for item in all_versions:
        if item != "-":
            app_version, splunk_support = item.split("#")
            splunk_support = splunk_support.split("|")
            splunk_support = [i for i in splunk_support if i]
            version_dict = {}
            version_dict["title"] = app_version
            version_dict["splunk_compatibility"] = splunk_support
            releases.append(copy.deepcopy(version_dict))
    return releases

def get_latest_file():
    """
    Get the latest filename/filepath

    :return File path of the latest file if present
    """
    try:
        max_epoch_time = None
        synced_csv_filename = ""
        splunkbase_path = ""
        if os.path.isdir(SYNCED_CSV_PATH):
            # there is directory present named app_list
            for new_csv in os.listdir(SYNCED_CSV_PATH):
                # if at all multiple files are present then get the file with greatest epoch
                epoch_time = int(new_csv.split("_")[1][:-4])
                if max_epoch_time is None or epoch_time > max_epoch_time:
                    max_epoch_time = epoch_time
                    synced_csv_filename = new_csv
            if synced_csv_filename:
                logging.info("Found a synced splunkbase file")
                splunkbase_path = os.path.join(SYNCED_CSV_PATH, synced_csv_filename)

        if splunkbase_path == "":
            logging.info("Could not find synced splunkbase apps so using the constant file")
            splunkbase_path = os.path.join(CSV_PATH, 'splunkbaseapps.csv')

        logging.info("splunkbase_path- {0}".format(splunkbase_path))
        return splunkbase_path
    except Exception as e:
        logging.exception(MESSAGE_EXCEPTION_GET_LATEST_FILE.format(str(e)))
        return None

def get_apps_from_csv():
    """
    Get all the apps from the csv

    :return List of apps from csv
    """
    try:
        global CSV_APPS
        csv_apps = {}
        splunkbase_path = get_latest_file()
        if splunkbase_path is None:
            return None
        with open(splunkbase_path, 'r') as f:
            csv_reader = csv.reader(f)
            for row in csv_reader:
                id = row[0]
                name = row[1]
                app_url = row[2]
                releases = get_compatibility(row[3])
                csv_apps[id] = {}
                csv_apps[id]["appid"] = id
                csv_apps[id]["title"] = name
                csv_apps[id]["path"] = app_url
                csv_apps[id]["releases"] = releases
        CSV_APPS = csv_apps
        return True
    except Exception as e:
        logging.info(MESSAGE_EXCEPTION_GET_CSV_APPS.format(str(e)))
        return None

if __name__ == "__main__":
    try:
        is_csv_read = get_apps_from_csv()
        if is_csv_read is None:
            exit
        if get_apps():
            csv_apps_list = list(CSV_APPS.values())
            all_apps = find_versions_for_apps(apps=csv_apps_list)
            if all_apps:
                create_dirs(dirs_path=[LOCAL_DIR, APP_LIST_DIR])
                epoch_time = int(time.time())
                splunkbase_app_filename = CSV_FILENAME.format(epoch_time)
                splunkbase_app_path = os.path.join(APP_LIST_DIR, splunkbase_app_filename)
                is_file_written = write_to_file(file_contents=all_apps, file_path=splunkbase_app_path)
                if is_file_written:
                    delete_previous_files(dir_path=APP_LIST_DIR, exclude_file_name=splunkbase_app_filename)

    except Exception as e:
        logging.exception(MESSAGE_FAILED_SYNC_APPS.format(str(e)))
