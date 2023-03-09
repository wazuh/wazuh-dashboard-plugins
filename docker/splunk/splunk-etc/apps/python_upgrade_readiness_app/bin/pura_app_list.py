import os
import re
import sys
import csv
import json
import time
import splunk.rest as sr
from splunk.clilib import cli_common as cli
from splunk.persistconn.application import PersistentServerConnectionApplication

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from pura_libs_utils import six
from builtins import str

logging = logger_manager.setup_logging('pura_app_list')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class AppListHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs

    For example, if a GET request is made to the endpoint is executed with the path /app_list,
    then this class will attempt to run a function named get_app_list().
    Note that the root path of the REST handler is removed. If a POST request is made to the endpoint
    is executed with the path /app_list, then this class will attempt to execute post_app_list().
    """

    def __init__(self, command_line=None, command_arg=None):
        if command_arg and command_line:
            PersistentServerConnectionApplication.__init__(self)

    @classmethod
    def get_function_signature(cls, method, path):
        """
        Get the function that should be called based on path and request method.

        :param cls: class
        :param method: type of call (get/post)
        :param path: the rest endpoint for which method is to be called

        :return name of the function to be called
        """

        if len(path) > 0:
            components = path.split("pura")
            path = components[1]
            return method + re.sub(r'[^a-zA-Z0-9_]', '_', path).lower()
        else:
            return method

    def handle(self, in_string):
        """
        Handler function to call when REST endpoint is hit and process the call

        :param in_string: string of arguments

        :return Result of REST call
        """
        try:

            logging.info("Handling a request")

            # Parse the arguments
            args = utils.parse_in_string(in_string)

            # Get the user information
            self.session_key = args['session']['authtoken']
            self.user = args['session']['user']
            self.host = args['server']['hostname']

            # Get the method
            method = args['method']

            # Get the path and the args
            if 'rest_path' in args:
                path = args['rest_path']
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403)

            query_params = args['query_parameters']

            # If no scan_type is provided, the endpoint will return with 404 error
            if query_params.get('type'):
                scan_type = query_params['type']
            else:
                return utils.render_error_json(MESSAGE_ERROR_NO_SCAN_TYPE, 404)

            accepted_types = [TYPE_DEPLOYMENT, TYPE_PARTIAL, TYPE_SPLUNKBASE, TYPE_PRIVATE]
            if scan_type not in accepted_types:
                return utils.render_error_json(MESSAGE_INVALID_SCAN_TYPE, 400)
            # Get the function signature
            function_name = self.get_function_signature(method, path)

            try:
                function_to_call = getattr(self, function_name)
            except AttributeError:
                function_to_call = None

            # Try to run the function
            if function_to_call is not None:
                logging.info("Executing function, name={}".format(function_name))

                # Execute the function
                self.start_time = int(time.time()*1000)
                return function_to_call(scan_type)

            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))
    
    def read_app_version(self, application_path):
        """
        Reads application version from default/app.conf. If not found uses the version got from apps/local REST call.

        :param application_path: App path
        """

        app_version = ""
        try:
            app_conf_path = os.path.join(application_path, "default", "app.conf")

            if cli.checkConfigFile(app_conf_path):
                app_configs = cli.readConfFile(app_conf_path)
                app_version = app_configs.get("launcher", {}).get("version", "")
        except Exception:
            logging.info("No version found for app: {}".format(application_path))
            
        return app_version


    def get_app_list(self, scan_type):
        """
        Fetch the App list and return the App list as JSON

        :param scan_type: Type of scan

        :return List of Apps containing name, label, type and link
        """

        try:
            response_role, content_role = sr.simpleRequest('{}?output_mode=json&count=0'.format(user_role_endpoint),
                                                           sessionKey=self.session_key)
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_REST_CALL.format(str(e)))
            return utils.render_error_json(MESSAGE_EXCEPTION_REST_CALL.format(self.user), 404)

        if response_role['status'] not in success_codes:
            logging.error(MESSAGE_ERROR_FETCHING_ROLES.format(self.user))
            return utils.render_error_json(MESSAGE_ERROR_FETCHING_ROLES.format(self.user), 404)

        try:
            response_apps, content_apps = sr.simpleRequest('{}?output_mode=json&count=0'.format(instance_apps_endpoint),
                                                           sessionKey=self.session_key)
        except Exception as e:
            logging.exception(MESSAGE_EXCEPTION_REST_CALL.format(str(e)))
            return utils.render_error_json(MESSAGE_EXCEPTION_REST_CALL.format(self.user), 404)

        if response_apps['status'] not in success_codes:
            logging.error(MESSAGE_ERROR_FETCHING_APPS.format(self.user))
            return utils.render_error_json(MESSAGE_ERROR_FETCHING_APPS.format(self.user), 404)

        # Get list of apps for current user
        user_app_list = self.get_user_apps(content_role, content_apps)

        # Get apps from etc/apps
        etc_app_list = os.listdir(OTHER_APPS_DIR)

        # Get apps from etc/slave-apps
        try:
            slave_app_list = os.listdir(SLAVE_APPS_DIR)
        except Exception:
            slave_app_list = []

        # Prepare final app list
        # app tuple: name, label, version, visible, path, version
        app_list = []

        for value in user_app_list:
            if (value[0] not in SYSTEM_APPS) and (value[3] == CONST_ENABLED):

                if value[0] in etc_app_list:
                    etc_app_path = os.path.join(OTHER_APPS_DIR, value[0])
                    etc_app_version = self.read_app_version(etc_app_path)
                    if not etc_app_version:
                        etc_app_version = value[2]
                    etc_app_details_list = list(value)
                    etc_app_details_list.append(etc_app_path)
                    etc_app_details_list.append(etc_app_version)
                    etc_app_details_tuple = tuple(etc_app_details_list)
                    app_list.append(etc_app_details_tuple)

                if value[0] in slave_app_list:
                    cluster_app_path = os.path.join(SLAVE_APPS_DIR, value[0])
                    cluster_app_version = self.read_app_version(cluster_app_path)
                    if not cluster_app_version:
                        cluster_app_version = value[2]
                    cluster_app_details_list = list(value)
                    cluster_app_details_list.append(cluster_app_path)
                    cluster_app_details_list.append(cluster_app_version)
                    cluster_app_details_tuple = tuple(cluster_app_details_list)
                    app_list.append(cluster_app_details_tuple)

        if not app_list:
            logging.error(MESSAGE_NO_APPS_FOUND.format(self.user))
            return utils.render_error_json(MESSAGE_NO_APPS_FOUND.format(self.user), 404)


        # Get type of app and app link
        app_type_list = self.get_app_type(app_list)


        if scan_type == TYPE_SPLUNKBASE:
            app_type_list = self.filter_apps(app_type_list, TYPE_SPLUNKBASE)
            if not app_type_list:
                logging.error(MESSAGE_NO_SPLUNKBASE_APPS_FOUND.format(self.user))
                return utils.render_error_json(MESSAGE_NO_SPLUNKBASE_APPS_FOUND.format(self.user), 404)
        elif scan_type == TYPE_PRIVATE:
            app_type_list = self.filter_apps(app_type_list, TYPE_PRIVATE)
            if not app_type_list:
                logging.error(MESSAGE_NO_PRIVATE_APPS_FOUND.format(self.user))
                return utils.render_error_json(MESSAGE_NO_PRIVATE_APPS_FOUND.format(self.user), 404)

        final_app_list = list()
        # ((appname, app-label), (type, link), (version, compatibility), visible, path)
        for app in app_type_list:
            app_json = dict()
            app_json['name'] = app[0][0]
            app_json['label'] = app[0][1]
            app_json['type'] = self.get_compatibility_type(app[1][0], app[2][1])
            app_json['link'] = app[1][1]
            app_json['visible'] = app[3]
            app_json['version'] = app[2][0]
            app_json['app_path'] = app[4]
            final_app_list.append(app_json)

        return utils.render_json(final_app_list)

    def get_compatibility_type(self, app_type, compatibility):
        """
        Returns the compatibilty based type of app

        :param apps: Type of app
        :param compatibility: Compatibility with version

        :return Compatibility type
        """

        if app_type == CONST_SPLUNKBASE:
            if compatibility == CONST_QUAKE:
                return CONST_SPLUNKBASE_QUAKE
            elif compatibility == CONST_DUAL:
                return CONST_SPLUNKBASE_DUAL
            elif compatibility == CONST_UPDATE:
                return CONST_SPLUNKBASE_UPDATE
            elif compatibility == CONST_WARN:
                return CONST_SPLUNKBASE_WARN
            else:
                return CONST_SPLUNKBASE_NONE
        else:
            return app_type

    def get_user_apps(self, response_role, response_apps):
        """
        Returns the list of apps for the user.

        :param response_role: Dict containing apps entries with user roles
        :param response_apps: Dict containing user entries with user permissions

        :return List of apps for the user (name, label, version, visible)
        """

        user_apps = list()
        user_roles = list()

        try:
            rolelist = json.loads(response_role)
        except Exception:
            logging.exception(MESSAGE_EXCEPTION_ROLELIST.format(self.user))
            return user_apps

        for user in rolelist.get('entry', []):
            if user['name'] == self.user:
                user_roles = user['content']['roles']
                break

        if not user_roles and self.user == "splunk-system-user":
            user_roles.append('admin')
            user_roles.append('power')

        if not user_roles:
            return utils.render_error_json(MESSAGE_ERROR_FETCHING_ROLES.format(self.user), 404)

        try:
            applist = json.loads(response_apps)
        except Exception:
            logging.exception(MESSAGE_EXCEPTION_APPLIST.format(self.user))
            return user_apps

        for app in applist.get('entry', []):

            visible = CONST_ENABLED
            try:
                read_permission = app['acl'].get('perms').get('read')
                if not read_permission:
                    read_permission = []
                    visible = CONST_ALL_PERM
            except Exception:
                read_permission = []
                visible = CONST_ALL_PERM

            # Check if app is disabled or a premium app
            if app['content']['disabled']:
                visible = CONST_DISABLED
            elif read_permission:
                if app['name'] in PREMIUM_APPS:
                    visible = CONST_PREMIUM
                else:
                    visible = CONST_ENABLED
            
            # Check if app got version
            if not app.get('content').get('version'):
                version = None
            else:
                version = app['content']['version']

            if not read_permission:
                user_apps.append((app['name'], app['content']['label'], version, visible))
            elif '*' in read_permission:
                user_apps.append((app['name'], app['content']['label'], version, visible))
            elif set(user_roles).intersection(set(read_permission)):
                user_apps.append((app['name'], app['content']['label'], version, visible))
            else:
                visible = CONST_USER_PERM
                user_apps.append((app['name'], app['content']['label'], version, visible))

        return user_apps

    def check_splunk_supported(self, splunk_support):
        """
        Check if the versions in splunk_support are more than 8.0.0
        """
        try:
            is_splunk_supported = False
            for x in splunk_support:
                if str(x).strip() and (int(str(x).split(".")[0]) >= 8):
                    is_splunk_supported = True
                    break
            return is_splunk_supported
        except Exception as e:
            logging.exception(str(e))
        return False

    def get_compatibility(self, version, compatibility):
        """
        Returns the compatibilty based on installed version

        :param apps: App version
        :param compatibility: Compatibility mapping

        :return Compatibility
        """

        all_versions = compatibility.split(";")

        if version is None:
            return CONST_NONE

        quake_support_flag = False
        version_found = False
        for item in all_versions:
            app_version, splunk_support = item.split("#")
            splunk_support = splunk_support.split("|")
            if not splunk_support[-1]:
                splunk_support = splunk_support[:-1]
            is_splunk_supported = self.check_splunk_supported(splunk_support)
            if is_splunk_supported:
                quake_support_flag = True
            if version == app_version:
                version_found = True
                if is_splunk_supported and len(splunk_support) == 1:
                    return CONST_QUAKE
                elif is_splunk_supported and len(splunk_support) > 1:
                    return CONST_DUAL
                else:
                    continue
        else:
            if quake_support_flag and version_found:
                return CONST_UPDATE
            elif not version_found:
                return CONST_WARN
            else:
                return CONST_NONE

    def get_app_type(self, app_list):
        """
        Returns the list of tuples containing app along with its type.

        :param apps: List of apps

        :return App List of tuples ((appname, app-label), (type, link), (version, compatibility), visible, path)
        """

        updated_list = []
        splunkbase_apps = []

        splunkbase_path = ""
        max_epoch_time = None
        synced_csv_filename = ""

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
        with open(splunkbase_path, 'r') as f:
            csv_reader = csv.reader(f)
            for row in csv_reader:
                splunkbase_apps.append(row)

        if synced_csv_filename and not splunkbase_apps:
            logging.info("Reading the constant file as the synced splunkbase file was empty")
            splunkbase_path = os.path.join(CSV_PATH, 'splunkbaseapps.csv')
            with open(splunkbase_path, 'r') as f:
                csv_reader = csv.reader(f)
                for row in csv_reader:
                    splunkbase_apps.append(row)

        public_to_private_apps_list = list()
        try:
            public_to_private_apps_path = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'lookups', 'pura_mark_public_as_private.csv')
            with open(public_to_private_apps_path, 'r') as f:
                csv_reader = csv.reader(f)
                for row in csv_reader:
                    if row:
                        public_to_private_apps_list.append(row[0])
        except:
            logging.exception("Failed to find the pura_mark_public_as_private lookup file")

        # app tuple: name, label, version, visible, path, version
        for app in app_list:
            if app[0] in public_to_private_apps_list:
                updated_list.append(((app[0], app[1]), (CONST_PRIVATE, ""), (app[5], CONST_NONE), app[3], app[4]))
            else:
                for item in splunkbase_apps:
                    if app[0] == item[0]:
                        if not item[3] == "-":
                            compatibility = self.get_compatibility(app[5], item[3])
                            updated_list.append(((app[0], app[1]), (CONST_SPLUNKBASE, item[2]),
                                                (app[5], compatibility), app[3], app[4]))
                        else:
                            updated_list.append(((app[0], app[1]), (CONST_SPLUNKBASE, item[2]),
                                                (app[5], CONST_NONE), app[3], app[4]))
                        break
                else:
                    updated_list.append(((app[0], app[1]), (CONST_PRIVATE, ""), (app[5], CONST_NONE), app[3], app[4]))

        return updated_list

    def filter_apps(self, app_list, type_of_apps):
        """
        Returns the list of app as per the type required.

        :param app_list: List of apps
        :param type_of_apps: Type of apps required

        :return Filtered list of apps
        """

        filtered_list = list()
        if type_of_apps == TYPE_SPLUNKBASE:
            for app in app_list:
                if app[1][0] != CONST_PRIVATE:
                    filtered_list.append(app)
        else:
            for app in app_list:
                if app[1][0] == CONST_PRIVATE:
                    filtered_list.append(app)

        return filtered_list
