"""
(C) 2019 Splunk Inc. All rights reserved.
"""

import json
import splunk.rest as rest
from cloudgateway.private.util import constants


def fetch_license_info(session_key):
    base_uri = rest.makeSplunkdUri()

    uri = '{}/services/licenser/licenses'.format(base_uri )

    params = {
        'output_mode': 'json'
    }

    r, content = rest.simpleRequest(
        uri,
        sessionKey=session_key,
        getargs=params,
        method='GET',
        raiseAllErrors=True
    )

    parsed = json.loads(content)
    return parsed


def create_sensitive_data(session_key, key, data, app_name = None):
    """
    :param session_key: A raw system auth token
    :param key: the string key to fetch the sensitive data for
    :param data: String data representing the secret
    :param app_name: Optional name of splunk app
    :return:
    """
    base_uri = rest.makeSplunkdUri()
    if app_name:
        uri = '{}servicesNS/nobody/{}/storage/passwords'.format(base_uri, app_name)
    else:
        uri = '%s/services/storage/passwords' % base_uri

    form_data = {
        constants.NAME: key,
        constants.PASSWORD: data
    }

    return _mutate_sensitive_data(session_key, uri, form_data)


def update_sensitive_data(session_key, key, data, app_name=None):
    """
    :param session_key: A raw system auth token
    :param key: the string key to fetch the sensitive data for
    :param data: String data representing the secret
    :param app_name: Optional name of splunk app
    :return:
    """
    base_uri = rest.makeSplunkdUri()

    if app_name:
        uri = '{}servicesNS/nobody/{}/storage/passwords/{}'.format(base_uri, app_name, key)
    else:
        uri = '%s/services/storage/passwords/%s' % (base_uri, key)

    form_data = {
        constants.PASSWORD: data
    }

    return _mutate_sensitive_data(session_key, uri, form_data)


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


def fetch_sensitive_data(session_key, key, app_name=None):
    """
    :param session_key: A raw system auth token
    :param key: the string key to fetch the sensitive data for
    :param app_name: Optional name of splunk app
    :return: string representation of the secret
    """
    base_uri = rest.makeSplunkdUri()
    if app_name:
        uri = '{}servicesNS/nobody/{}/storage/passwords/{}'.format(base_uri, app_name, key)
    else:
        uri = '%s/services/storage/passwords/%s' % (base_uri, key)

    params = {
        'output_mode': 'json'
    }

    r, content = rest.simpleRequest(
        uri,
        sessionKey=session_key,
        getargs=params,
        method='GET',
        raiseAllErrors=True
    )

    parsed = json.loads(content)
    clear_password = parsed['entry'][0]['content']['clear_password']
    return clear_password