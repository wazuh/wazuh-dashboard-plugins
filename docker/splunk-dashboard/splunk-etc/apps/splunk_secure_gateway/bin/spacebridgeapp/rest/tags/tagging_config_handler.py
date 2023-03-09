"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for accessing and setting tagging config
"""
import sys
import json
import splunk
from http import HTTPStatus

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.services.splunk_service import get_app_list_request
from spacebridgeapp.rest.base_endpoint import BaseRestHandler, build_error_payload
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KVStore
from spacebridgeapp.util.kvstore import build_containedin_clause
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, SESSION, AUTHTOKEN, PAYLOAD, STATUS, KEY, QUERY, \
    TAGGING_CONFIG_COLLECTION_NAME, APP_ID

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "tagging_config_handler")

ENABLED = 'enabled'
TYPE_CHECK = {ENABLED: bool}
DEFAULT_VALUES = {ENABLED: False}


class TaggingConfigHandler(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the tagging_config endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Get the tagging_config.  Specify comma separated app_ids list to return tagging_config map for each specified
        app_id if available.  If no app_ids param passed then return whole tagging_config collection.

        GET ssg/tagging_config?app_ids=search,splunk_secure_gateway&app_ids=itsi

        :param request:
        :return:
        """
        try:
            auth_token = request[SESSION][AUTHTOKEN]
            app_ids = []
            # Accept a comma separated list or a list of items for GET API
            if APP_ID in request[QUERY] and request[QUERY].get(APP_ID):
                app_ids_param = request[QUERY].get(APP_ID)
                if isinstance(app_ids_param, list):
                    for param in app_ids_param:
                        app_ids.extend(param.split(','))
                elif isinstance(app_ids_param, str):
                    app_ids.extend(app_ids_param.split(','))

            payload = get_tagging_config_map(auth_token=auth_token, app_list=app_ids)
            return {
                PAYLOAD: payload,
                STATUS: HTTPStatus.OK
            }
        except splunk.RESTException as e:
            return build_error_payload(e)

    def post(self, request):
        """
        Handler for POST requests.  Accepts a json payload in POST body with the following schema.

        Example json POST body:
        {
            "search": {
                "enabled": true
            },
            "splunk_secure_gateway": {
                "enabled": false
            }
        }

        This endpoint will validate that app_id is a valid app, if valid will update or create new object in
        tagging_config collection.  Only valid field values will be updated.

        :param request:
        :return:
        """
        try:
            auth_token = request[SESSION][AUTHTOKEN]
            payload = json.loads(request[PAYLOAD])
            if not payload or not isinstance(payload, dict):
                raise splunk.RESTException(
                    msg='You must provide a non-empty, valid formatted tagging config to update/create',
                    statusCode=HTTPStatus.BAD_REQUEST)

            payload = set_tagging_config(auth_token=auth_token, request_body=payload)

            return {
                PAYLOAD: payload,
                STATUS: HTTPStatus.OK
            }
        except splunk.RESTException as e:
            LOGGER.info("Failed to set tags, error=%s", str(e))
            return build_error_payload(e)


def validate_app_list(auth_token, app_list):
    """
    Helper function to validate that all app_ids in list are from valid apps.  Exception is thrown if app_id is not
    valid
    :param auth_token:
    :param app_list:
    :return:
    """
    for app_id in app_list:
        try:
            get_app_list_request(authtoken=auth_token, app_name=app_id)
        except splunk.RESTException as e:
            if e.statusCode == HTTPStatus.NOT_FOUND:
                raise splunk.RESTException(msg=f'The app_id={app_id} is invalid.  No updates were processed.',
                                           statusCode=HTTPStatus.NOT_FOUND)


def validate_fields(request_body):
    """
    Helper method to validate the input fields and value types in json request_body.  An exception is raised if an
    invalid field or type is detected.
    :param request_body:
    :return:
    """
    for app_id, config_fields in request_body.items():
        for field, value in config_fields.items():
            if field not in TYPE_CHECK:
                raise splunk.RESTException(
                    statusCode=HTTPStatus.BAD_REQUEST,
                    msg=f'The field={field} is not a valid param for app_id={app_id}.')
            if not isinstance(value, TYPE_CHECK.get(field)):
                raise splunk.RESTException(
                    statusCode=HTTPStatus.BAD_REQUEST,
                    msg=f'The field={field} must be type={TYPE_CHECK.get(field).__name__} for app_id={app_id}.')


# Helpers to access KVStore
def get_tagging_config_map(auth_token, app_list):
    """
    KVStore Helper to get tagging_config collection
    :param auth_token:
    :param app_list:
    :return:
    """
    validate_app_list(auth_token=auth_token, app_list=app_list)
    kvstore_object = KVStore(collection=TAGGING_CONFIG_COLLECTION_NAME, session_key=auth_token)
    if app_list:
        query = build_containedin_clause(KEY, app_list)
        r, tagging_config = kvstore_object.get_items_by_query(query=query)
    else:
        r, tagging_config = kvstore_object.get_all_items()

    tagging_config_list = json.loads(tagging_config)
    tagging_config_map = {config[KEY]: {ENABLED: config[ENABLED]} for config in tagging_config_list}

    # Append DEFAULT_VALUES to app_ids without objects in collection
    for app_id in app_list:
        if app_id not in tagging_config_map:
            tagging_config_map[app_id] = DEFAULT_VALUES

    return tagging_config_map


def set_tagging_config(auth_token, request_body):
    """
    KVStore Helper to set tagging_config
    :param auth_token:
    :param request_body:
    :return:
    """
    validate_app_list(auth_token=auth_token, app_list=request_body.keys())
    validate_fields(request_body=request_body)
    kvstore_object = KVStore(collection=TAGGING_CONFIG_COLLECTION_NAME, session_key=auth_token)
    for app_id, config_fields in request_body.items():
        try:
            r, jsn = kvstore_object.get_item_by_key(key=app_id)
            record = json.loads(jsn)
        except splunk.RESTException as e:
            if e.statusCode == HTTPStatus.NOT_FOUND:
                record = {KEY: app_id}
            else:
                raise e

        # Fields and values should have been validated above
        for field, value in config_fields.items():
            record[field] = value

        kvstore_object.insert_or_update_item_containing_key(record)

    return get_tagging_config_map(auth_token=auth_token, app_list=request_body.keys())



