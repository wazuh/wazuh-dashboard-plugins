"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import json
import requests
import splunk
import splunk.rest as rest
from spacebridgeapp.util import constants
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore
from http import HTTPStatus

from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_splunk_service.log", "splunk_service")


def authenticate_splunk_credentials(username, password):
    """
    Checks whether a supplied username/password pair are valid Splunk credentials. Throws an error otherwise.

    :param username: User-supplied username
    :param password: User-supplied password
    :return: None
    """
    request_url = '%s/services/auth/login' % rest.makeSplunkdUri()
    body = {
        'username': username,
        'password': password
    }
    response, _ = rest.simpleRequest(request_url, postargs=body, raiseAllErrors=False)

    return response


def user_is_administrator(authtoken):
    """
    Checks if the given user is a Splunk admin. This is necessary for satisfying some of the UI
    feature requirements.

    :param authtoken: Token to allow checking of user permissions
    :return: Boolean
    """

    return constants.ADMIN_ALL_OBJECTS in get_current_context(authtoken)[constants.CAPABILITIES]


def get_all_users(authtoken):
    """
    Returns a list of all Splunk users viewable using the permissions of the supplied authtoken

    :param authtoken: Authorization token
    :return: List of users
    """

    request_url = '%s/services/authentication/users' % rest.makeSplunkdUri()
    query_args = {
        'count': 0,
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=authtoken,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    # Parse just the list of usernames from the response
    return [x['name'] for x in json.loads(content)['entry']]


def get_app_list_request(authtoken, app_name="", params=None):
    """
    Returns a list of all splunk apps viewable using the permissions of the supplied authtoken

    :param authtoken: Authorization token
    :return: List of Splunk apps
    """

    request_url = '{}services/apps/local/{}'.format(rest.makeSplunkdUri(), app_name)
    params = params if params is not None else {'output_mode': 'json'}
    response, content = rest.simpleRequest(
        request_url,
        sessionKey=authtoken,
        method='GET',
        getargs=params,
        raiseAllErrors=True
    )

    if response.status != HTTPStatus.OK:
        return None

    return json.loads(content)


def get_all_mobile_users(authtoken):
    """
    Returns a list of all Splunk users with registered mobile devices

    :param authtoken: Authorization token
    :return: List of users
    """
    kvstore = KvStore(constants.REGISTERED_USERS_COLLECTION_NAME, authtoken)
    _, content = kvstore.get_collection_keys()
    registered_user_records = json.loads(content)
    return [registered_user_record[u'_key'] for registered_user_record in registered_user_records]


def get_devices_for_user(user, authtoken):
    """
    Gets devices belonging to a user from the kvstore
    :param user: Username to retrieve devices for
    :param authtoken: Authorization token to supply to the kvstore interface
    :return: List of devices
    """
    kvstore = KvStore(constants.REGISTERED_DEVICES_COLLECTION_NAME, authtoken, owner=user)
    _, devices_record = kvstore.get_items_by_query(query={}, sort="device_name")
    LOGGER.debug("user={}, devices={}".format(user, devices_record))
    return json.loads(devices_record)


def get_devices_metadata(authtoken):
    """
    Gets all devices metadata from kvstore
    :param authtoken: Authorization token to supply to the kvstore interface
    :return: List of device metadata
    """
    kvstore = KvStore(constants.REGISTERED_DEVICES_META_COLLECTION_NAME, authtoken)
    _, devices_meta = kvstore.get_all_items()
    LOGGER.debug("devices_meta=%s", devices_meta)
    return json.loads(devices_meta)


def user_has_registered_devices(user, authtoken):
    """
    Returns true if a user has at least one registered device
    :param user: Username to check
    :param authtoken: Authorization token to supply to the kvstore interface
    :return: Boolean result
    """
    return len(get_devices_for_user(user, authtoken)) > 0


def get_splunk_auth_type(authtoken):
    """
    Returns authentication type for Splunk instance (Splunk, LDAP, or SAML)
    :return: String
    """
    LOGGER.debug("Getting Splunk authentication type")
    query_args = {
        'output_mode': 'json',
    }
    request_url = "{}services/properties/authentication/authentication/authType".format(rest.makeSplunkdUri())
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=authtoken,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    return content


def get_all_secure_gateway_tokens(authtoken):
    """
    Returns all Splunk tokens
    :return: String
    """
    LOGGER.debug("Getting Splunk tokens")
    query_args = {
        'output_mode': 'json',
        'sort_key': 'claims.exp',
        'sort_dir': 'asc',
        'search': f"claims.aud={constants.CLOUDGATEWAY}",
        'count': 0
    }
    request_url = "{}services/authorization/tokens".format(rest.makeSplunkdUri())
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=authtoken,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )

    all_tokens = json.loads(content)['entry']
    cloudgateway_tokens = [token for token in all_tokens if token['content']['claims']['aud'] == constants.CLOUDGATEWAY
                           and token['content']['claims']['exp'] != 0]
    return cloudgateway_tokens


def delete_token_by_id(authtoken, user, id):
    """
    Deletes token for given id
    :param authtoken:
    :param id:
    :return:
    """
    LOGGER.debug("Deleting token for id={}".format(id))
    delete_args = {
        'id': id
    }
    request_url = "{}services/authorization/tokens/{}".format(rest.makeSplunkdUri(), user)
    response, _ = rest.simpleRequest(
        request_url,
        sessionKey=authtoken,
        method='DELETE',
        getargs=delete_args,
        raiseAllErrors=True
    )

    return response


def authenticate_saml(authtoken):
    """
    Gets SAML authentication
    :param authtoken:
    :return:
    """
    LOGGER.debug("Getting SAML authentication")
    params = {constants.OUTPUT_MODE: constants.JSON}
    request_url = "{}/services/authentication/providers/SAML".format(rest.makeSplunkdUri())
    response, content = rest.simpleRequest(
        request_url,
        sessionKey=authtoken,
        method='GET',
        getargs=params,
        raiseAllErrors=True
    )

    if response.status != HTTPStatus.OK:
        return None

    return json.loads(content)


def create_sensitive_data(session_key, key, data):
    """
    :param session_key: A raw system auth token
    :param key: the string key to fetch the sensitive data for
    :param data: String data representing the secret
    :return:
    """
    LOGGER.debug("Updating sensitive data, key={}".format(key))
    base_uri = rest.makeSplunkdUri()
    uri = '{}servicesNS/nobody/{}/storage/passwords'.format(base_uri, constants.SPACEBRIDGE_APP_NAME)

    form_data = {
        constants.NAME: key,
        constants.PASSWORD: data
    }

    return _mutate_sensitive_data(session_key, uri, form_data)


def update_sensitive_data(session_key, key, data):
    """
    :param session_key: A raw system auth token
    :param key: the string key to fetch the sensitive data for
    :param data: String data representing the secret
    :return:
    """
    LOGGER.debug("Updating sensitive data, key={}".format(key))
    base_uri = rest.makeSplunkdUri()
    uri = '{}servicesNS/nobody/{}/storage/passwords/{}'.format(base_uri, constants.SPACEBRIDGE_APP_NAME, key)

    form_data = {
        constants.PASSWORD: data
    }

    return _mutate_sensitive_data(session_key, uri, form_data)


def update_or_create_sensitive_data(session_key, key, data):
    """
    Method that tries to update, and if that fails, tries to create
    an entry in storage/passwords.
    Function inspiration from:
    https://docs.djangoproject.com/en/2.2/ref/models/querysets/#update-or-create
    :param session_key: A raw system auth token
    :param key: the string key to fetch the sensitive data for
    :param data: String data representing the secret
    :return [response, created]: Response + true if data created else false
    """
    try:
        return [update_sensitive_data(session_key, key, data), False]
    except splunk.ResourceNotFound:
        return [create_sensitive_data(session_key, key, data), True]


def _mutate_sensitive_data(session_key, uri, form_data):
    """
    :param session_key: A raw system auth token
    :param uri: The uri to act on
    :param form_data: a dict containing the key 'password' and optionally 'name' if you are creating
    :return:
    """
    params = {
        'output_mode': 'json'
    }

    rest.simpleRequest(
        uri,
        sessionKey=session_key,
        getargs=params,
        postargs=form_data,
        method='POST',
        raiseAllErrors=True
    )


def fetch_sensitive_data(session_key, key, app=constants.SPACEBRIDGE_APP_NAME):
    """
    :param session_key: A raw system auth token
    :param key: the string key to fetch the sensitive data for
    :return: string representation of the secret
    """
    LOGGER.debug("retrieving sensitive data, key={}".format(key))
    base_uri = rest.makeSplunkdUri()
    uri = '{}servicesNS/nobody/{}/storage/passwords/{}'.format(base_uri, app, key)

    params = {
        'output_mode': 'json'
    }

    _, content = rest.simpleRequest(
        uri,
        sessionKey=session_key,
        getargs=params,
        method='GET',
        raiseAllErrors=True
    )

    parsed = json.loads(content)
    clear_password = parsed['entry'][0]['content']['clear_password']
    return clear_password


def restart_all_modular_inputs(authtoken, excluded_from_restart=None):
    if excluded_from_restart is None:
        excluded_from_restart = [constants.SSG_ENABLE_MODULAR_INPUT]

    inputs = get_ssg_mod_inputs(authtoken, excluded_from_restart)
    LOGGER.info("Restarting modular_inputs=%s", inputs)
    responses = {}

    for input in inputs:
        r = toggle_ssg_mod_input(input, authtoken)
        responses[input] = r.status

    LOGGER.info("Completed restart of inputs with responses=%s", responses)

    return responses


# Config methods follow the implementaion from these docs
# https://docs.splunk.com/Documentation/Splunk/8.2.2/RESTREF/RESTconf#properties.2F.7Bfile.7D.2F.7Bstanza.7D.2F.7Bkey.7D

def get_config_property(config_property_path, session_key):
    uri = f"{rest.makeSplunkdUri()}services/properties/{config_property_path}"
    try:
        r, content = rest.simpleRequest(uri,
                                        sessionKey=session_key,
                                        method='GET',
                                        raiseAllErrors=True)

        return content.decode("utf-8")
    except Exception as e:
        LOGGER.warn("Exception fetching config_property=%s with error=%s" % (config_property_path, str(e)))
        return None


def update_config_property(config_property_path, value, session_key):
    data = {constants.VALUE: value}
    uri = f"{rest.makeSplunkdUri()}servicesNS/nobody/{constants.SPACEBRIDGE_APP_NAME}/properties/{config_property_path}"

    rest.simpleRequest(uri,
                       sessionKey=session_key,
                       postargs=data,
                       method='POST',
                       raiseAllErrors=True)

    LOGGER.info("Updated config value %s = %s" % (config_property_path, value))


def get_deployment_info(session_key, default_value=""):
    base_uri = rest.makeSplunkdUri()
    uri = '{}services/ssg/kvstore/deployment_info'.format(base_uri)

    try:
        r, content = rest.simpleRequest(
            uri,
            sessionKey=session_key,
            method='GET',
            raiseAllErrors=False
        )

        parsed = json.loads(content)
        return parsed

    except Exception as e:
        LOGGER.exception("Exception fetching ssg meta info")
        return default_value


def _get_inputs_uri():
    base_uri = rest.makeSplunkdUri()
    return f"{base_uri}/servicesNS/nobody/splunk_secure_gateway/data/inputs"


def get_ssg_mod_inputs(session_key, excluded=None):
    """
     Get list of SSG modular inputs
    :param session_key:
    :param excluded: Add any modular_inputs you want to exclude from list
    :return: list of SSG modular_input_names
    """
    if excluded is None:
        excluded = []

    uri = _get_inputs_uri() + '?output_mode=json'

    r, content = rest.simpleRequest(
        uri,
        sessionKey=session_key,
        method='GET',
        raiseAllErrors=False
    )

    parsed = json.loads(content)
    return [entry['name'] for entry in parsed['entry']
            if (entry['name'].startswith('ssg') or entry['name'].startswith('secure_gateway'))
            and entry['name'] not in excluded]


def _get_mod_input_uri(modular_input_name):
    inputs_uri = _get_inputs_uri()
    return inputs_uri + f'/{modular_input_name}/default/'


def toggle_ssg_mod_input(modular_input_name, session_key):
    """
    Toggle SSG modular_input by name
    :param modular_input_name:
    :param session_key:
    :return:
    """
    LOGGER.info("Restarting input={}".format(modular_input_name))
    disable_resp, disable_resp_content = disable_ssg_mod_input(modular_input_name, session_key)
    enable_resp, enable_resp_content = enable_ssg_mod_input(modular_input_name, session_key)
    return enable_resp


def enable_ssg_mod_input(modular_input_name, session_key):
    """
    Action on SSG modular_input_name
    :param modular_input_name:
    :param session_key:
    :return:
    """
    uri = _get_mod_input_uri(modular_input_name)
    action_uri = uri + 'enable'
    resp, resp_content = rest.simpleRequest(
        action_uri,
        sessionKey=session_key,
        method='POST',
        raiseAllErrors=False
    )
    return resp, resp_content


def is_ssg_mod_input_enabled(modular_input_name, session_key):
    """
    Return if the provided modular input is enabled
    :param modular_input_name: the modular input to check
    :param session_key: auth to make the request
    :return: True if enabled, False otherwise
    """
    uri = _get_mod_input_uri(modular_input_name) + '?output_mode=json'
    resp, resp_content = rest.simpleRequest(
        uri,
        sessionKey=session_key,
        method='GET',
        raiseAllErrors=False
    )
    parsed = json.loads(resp_content)
    return not parsed['entry'][0]['content']['disabled']


def disable_ssg_mod_input(modular_input_name, session_key):
    """
    Action on SSG modular_input_name
    :param modular_input_name:
    :param session_key:
    :return:
    """
    uri = _get_mod_input_uri(modular_input_name)
    action_uri = uri + 'disable'
    resp, resp_content = rest.simpleRequest(
        action_uri,
        sessionKey=session_key,
        method='POST',
        raiseAllErrors=False
    )
    return resp, resp_content


def is_fips_mode(session_key):
    """
    Return true if Splunk is in fips mode
    """
    request_url = f'{rest.makeSplunkdUri()}/services/server/info'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    info = json.loads(content)
    return info['entry'][0]['content']['fips_mode']


def get_server_roles(session_key):
    """
    Return server-roles
    https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTsystem#server.2Froles
    :param session_key:
    :return:
    """
    request_url = f'{rest.makeSplunkdUri()}/services/server/roles'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    info = json.loads(content)
    return info['entry'][0]['content']['role_list']


def get_cluster_mode(session_key):
    """
    Return the cluster mode
    https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTcluster#cluster.2Fconfig

    Valid values: (master | slave | searchhead | disabled) Defaults to disabled.
    Sets operational mode for this cluster node. Only one master may exist per cluster.

    :param session_key:
    :return: mode: (master | slave | searchhead | disabled)
    """
    request_url = f'{rest.makeSplunkdUri()}/services/cluster/config'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    config = json.loads(content)
    return config['entry'][0]['content']['mode']


def get_current_context(session_key):
    """
    Return current context for the current session key
    :param session_key: The session key we want the context for.
    :return:
    """
    request_url = f'{rest.makeSplunkdUri()}/services/authentication/current-context'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    response = json.loads(content)
    return response['entry'][0]['content']


def get_tokens_enabled(session_key):
    """
    Returns if tokens are enabled
    :param session_key: A raw system auth token
    :return:
    """
    uri = f'{rest.makeSplunkdUri()}services/authorization/tokens'
    query_args = {
        'output_mode': 'json',
    }
    try:
        r, content = rest.simpleRequest(
            uri,
            sessionKey=session_key,
            method='GET',
            getargs=query_args,
            raiseAllErrors=True,
        )
        return r.status == HTTPStatus.OK
    except Exception as e:
        LOGGER.debug("Exception fetching tokens enabled data {}".format(e))
        return False


def is_app_enabled(auth_token, app_name):
    """
    Returns whether or not a given app is enabled
    :param auth_token: A raw system auth token
    :param app_name: App name to check enable status for
    :return:
    """
    app_info = {}
    try:
        app_info = get_app_list_request(auth_token, app_name)
    except splunk.RESTException as e:
        if e.statusCode != HTTPStatus.NOT_FOUND:
            raise e
    if not app_info:
        LOGGER.debug(f'No installation of {app_name} found')
        return False
    is_enabled = not app_info['entry'][0]['content']['disabled']
    if not is_enabled:
        LOGGER.debug(f'{app_name} is disabled')
    return is_enabled
