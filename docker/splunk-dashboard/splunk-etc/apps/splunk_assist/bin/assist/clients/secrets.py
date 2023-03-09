
import json
import logging
from typing import Any, Coroutine

import splunk
from splunk import rest
from enum import Enum

_NAME = 'name'
_PASSWORD = 'password'


class SecretStoreResult(Enum):
    OK = 0,
    ERROR = 1


def _mutate_sensitive_data(session_key, uri, form_data):
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


class SplunkSecretsClient:

    def __init__(self, app_name: str, log: logging.Logger):
        self.app_name = app_name
        self.log = log

        base_uri = rest.makeSplunkdUri()
        self.uri = f'{base_uri}servicesNS/nobody/{self.app_name}/storage/passwords'

    def fetch_sensitive_data(self, session_key, key) -> str:
        """
        :param session_key: A raw system auth token
        :param key: the string key to fetch the sensitive data for
        :return: string representation of the secret
        """
        self.log.debug("retrieving sensitive data, key=%s", key)
        uri = f'{self.uri}/{key}'

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

    def create_sensitive_data(self, session_key, key, data):
        """
        :param session_key: A raw system auth token
        :param key: the string key to fetch the sensitive data for
        :param data: String data representing the secret
        :return:
        """
        self.log.debug("Updating sensitive data, key=%s", key)

        form_data = {
            _NAME: key,
            _PASSWORD: data
        }

        return _mutate_sensitive_data(session_key, self.uri, form_data)


    def update_sensitive_data(self, session_key, key, data):
        """
        :param session_key: A raw system auth token
        :param key: the string key to fetch the sensitive data for
        :param data: String data representing the secret
        :return:
        """
        self.log.debug("Updating sensitive data, key=%s", key)
        uri = f'{self.uri}/{key}'

        form_data = {
            _PASSWORD: data
        }

        return _mutate_sensitive_data(session_key, uri, form_data)

    def upsert_sensitive_data(self, session_key, key, data):
        try:
            self.update_sensitive_data(session_key, key, data)
            return SecretStoreResult.OK
        except splunk.ResourceNotFound:
            self.create_sensitive_data(session_key, key, data)
            return SecretStoreResult.ERROR
