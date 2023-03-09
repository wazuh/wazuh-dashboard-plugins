"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for managing app types in the kvstore, and their enabled/disabled state
"""

import sys
import json
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
from spacebridgeapp.util import py23

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.util import errors as Errors
from spacebridgeapp.rest.util.helper import extract_parameter
from spacebridgeapp.rest.services.splunk_service import get_all_users
from spacebridgeapp.rest.services.spacebridge_service import delete_device_from_spacebridge
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore
from spacebridgeapp.util.constants import NOBODY, ALERTS_IOS, AR_PLUS, APPLE_TV, SPLUNK_TV, VR, DRONE_MODE

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_app_type_configuration")
APP_TYPES = [ALERTS_IOS, AR_PLUS, APPLE_TV, SPLUNK_TV, VR, DRONE_MODE]
APP_NAME_LABEL = 'app_name'
APP_NAMES_LABEL = 'app_names'
QUERY_LABEL = 'query'
APPLICATION_ENABLED_LABEL = 'application_enabled'


class AppState(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the app endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Returns whether a given app_type is enabled or not

        :param query[app_name] <string> or query[app_names] <json array>
        """
        authtoken = request['system_authtoken']

        if APP_NAMES_LABEL in request[QUERY_LABEL]:
            try:
                app_names = json.loads(request[QUERY_LABEL][APP_NAMES_LABEL])
            except ValueError:
                raise Errors.SpacebridgeRestError('Error: "app_names" query parameter must be a valid JSON array', 400)

            return get_state_of_apps(app_names, authtoken)

        app_name = extract_parameter(request[QUERY_LABEL], APP_NAME_LABEL, QUERY_LABEL)
        return get_state_of_app(app_name, authtoken)

    def post(self, request):
        """
        Updates whether the specified app is enabled or not
        """
        authtoken = request['session']['authtoken']
        system_authtoken = request['system_authtoken']
        app_name = extract_parameter(request[QUERY_LABEL], APP_NAME_LABEL, QUERY_LABEL)
        body = json.loads(request['payload'])
        new_state = extract_parameter(body, APPLICATION_ENABLED_LABEL, 'body')
        return set_state_of_app(app_name, authtoken, system_authtoken, new_state)


def get_state_of_apps(app_names, authtoken):
    result = {}
    for app_name in app_names:
        if app_name not in APP_TYPES:
            raise Errors.SpacebridgeRestError('Error: Invalid app_type=%s' % app_name, 400)
        result[app_name] = retrieve_state_of_app(app_name, authtoken)
    return {
        'payload': result,
        'status': 200,
    }


def get_state_of_app(app_name, authtoken):
    """
    Returns whether a given app_type is enabled or not. This function:
        1. Validates the app_type for correctness
        2. Attempts to retrieve the record of the app from the kvstore
        3. Creates a new record if one does not already exist
        4. Returns the state of the app_type

    :param app_name: Name of app in kvstore
    :param authtoken: System level auth token
    :return: State of specified app_type
    """

    # Validates the app_type for correctness
    if app_name not in APP_TYPES:
        raise Errors.SpacebridgeRestError('Error: Invalid app_type=%s' % app_name, 400)

    # Attempts to retrieve the record of the app from the kvstore. Creates a new record if one does not already exist
    app_state = retrieve_state_of_app(app_name, authtoken)
    LOGGER.info('Retrieved state of app for app_type=%s, application_state=%s' % (app_name, app_state))

    # Returns the state of the app_type
    return {
        'payload': {
            app_name: app_state,
        },
        'status': 200,
    }


def retrieve_state_of_app(app_name, authtoken):
    """
    Single function to encapsulate all app_type state retrieval behaviour. This function:
        1. Attempts to retrieve the record of the app from the kvstore
        2. Creates a new record if one does not already exist

    :param app_name: Name of app in kvstore
    :param authtoken: System level auth token (in case new record needs to be created)
    :return:
    """

    # Attempts to retrieve the record of the app from the kvstore
    kvstore = KvStore(constants.APPLICATION_TYPES_COLLECTION_NAME, authtoken, owner=NOBODY)
    r, app_record = kvstore.get_items_by_query({'application_name': app_name})
    app_record = json.loads(app_record)

    # Creates a new record if one does not already exist
    if not app_record:
        kvstore.insert_single_item({'application_name': app_name, 'application_enabled': False})
        return False
    return app_record[0][APPLICATION_ENABLED_LABEL]


def set_state_of_app(app_name, authtoken, system_authtoken, new_state):
    """
    Updates whether the specified app is enabled or not. This function:
        1. Validates the app_type for correctness
        2. If app is being disabled, delete all registered devices
        3. Attempts to retrieve the record of the app from the kvstore
        4. Updates or creates the new kvstore entry depending if one exists already
        5. Returns the state of the app_type

    :param app_name: Name of app in kvstore
    :param authtoken: User's authorization token
    :param system_authtoken: System authorization token
    :param new_state: Boolean signifying whether to enable the app
    :return: Success message
    """

    # Validates the app_type for correctness
    if app_name not in APP_TYPES:
        raise Errors.SpacebridgeRestError('Error: Invalid app_type=%s' % app_name, 400)

    # If app is being disabled, delete all registered devices
    if not new_state:
        delete_all_devices_of_type(app_name, authtoken, system_authtoken)

    # Attempts to retrieve the record of the app from the kvstore
    kvstore = KvStore(constants.APPLICATION_TYPES_COLLECTION_NAME, authtoken, owner=NOBODY)
    r, app_record = kvstore.get_items_by_query({'application_name': app_name})
    app_record = json.loads(app_record)
    new_app = {'application_name': app_name, 'application_enabled': new_state}

    # Updates or creates the new kvstore entry depending if one exists already
    if app_record:
        kvstore.update_item_by_key(app_record[0]['_key'], new_app)
    else:
        kvstore.insert_single_item(new_app)

    result_string = 'Application app_type=%s is now new_state=%s' % (app_name, 'enabled' if new_state else 'disabled')

    LOGGER.info(result_string)

    # Returns the state of the app_type
    return {
        'payload': result_string,
        'status': 200,
    }


def delete_all_devices_of_type(app_type, authtoken, system_authtoken):
    """
    Removes all devices of a given type from all users in the kvstore
    """
    users = get_all_users(authtoken) + [NOBODY]
    for user in users:
        delete_all_devices_of_type_for_user(user, app_type, authtoken, system_authtoken)


def delete_all_devices_of_type_for_user(user, app_type, authtoken, system_authtoken):
    """
    Removes all devices of a given type from a single user in the kvstore
    """
    kvstore = KvStore(constants.REGISTERED_DEVICES_COLLECTION_NAME, authtoken, owner=user)
    r, devices = kvstore.get_all_items()
    devices = json.loads(devices)
    kvstore.delete_items_by_query({'device_type': app_type})

    for device in devices:
        if device['device_type'] == app_type:
            delete_device_from_spacebridge(device['device_id'], system_authtoken)
