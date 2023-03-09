#
# Copyright 2021 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""This module contains simple interfaces for Splunk config file management,
you can update/get/delete stanzas and encrypt/decrypt some fields of stanza
automatically."""

import json
import logging
import traceback
from typing import List

from splunklib import binding, client

from . import splunk_rest_client as rest_client
from .credentials import CredentialManager, CredentialNotExistException
from .utils import retry

__all__ = [
    "ConfStanzaNotExistException",
    "ConfFile",
    "ConfManagerException",
    "ConfManager",
]


class ConfStanzaNotExistException(Exception):
    """Exception raised by ConfFile class."""

    pass


class ConfFile:
    """Configuration file."""

    ENCRYPTED_TOKEN = "******"

    reserved_keys = ("userName", "appName")

    def __init__(
        self,
        name: str,
        conf: client.ConfigurationFile,
        session_key: str,
        app: str,
        owner: str = "nobody",
        scheme: str = None,
        host: str = None,
        port: int = None,
        realm: str = None,
        **context: dict,
    ):
        """Initializes ConfFile.

        Arguments:
            name: Configuration file name.
            conf: Configuration file object.
            session_key: Splunk access token.
            app: App name of namespace.
            owner: (optional) Owner of namespace, default is `nobody`.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            realm: (optional) Realm of credential, default is None.
            context: Other configurations for Splunk rest client.
        """
        self._name = name
        self._conf = conf
        self._session_key = session_key
        self._app = app
        self._owner = owner
        self._scheme = scheme
        self._host = host
        self._port = port
        self._context = context
        self._cred_manager = None
        # 'realm' is set to provided 'realm' argument otherwise as default
        # behaviour it is set to 'APP_NAME'.
        if realm is None:
            self._realm = self._app
        else:
            self._realm = realm

    @property
    @retry(exceptions=[binding.HTTPError])
    def _cred_mgr(self):
        if self._cred_manager is None:
            self._cred_manager = CredentialManager(
                self._session_key,
                self._app,
                owner=self._owner,
                realm=self._realm,
                scheme=self._scheme,
                host=self._host,
                port=self._port,
                **self._context,
            )

        return self._cred_manager

    def _filter_stanza(self, stanza):
        for k in self.reserved_keys:
            if k in stanza:
                del stanza[k]

        return stanza

    def _encrypt_stanza(self, stanza_name, stanza, encrypt_keys):
        if not encrypt_keys:
            return stanza

        encrypt_stanza_keys = [k for k in encrypt_keys if k in stanza]
        encrypt_fields = {key: stanza[key] for key in encrypt_stanza_keys}
        if not encrypt_fields:
            return stanza
        self._cred_mgr.set_password(stanza_name, json.dumps(encrypt_fields))

        for key in encrypt_stanza_keys:
            stanza[key] = self.ENCRYPTED_TOKEN

        return stanza

    def _decrypt_stanza(self, stanza_name, encrypted_stanza):
        encrypted_keys = [
            key
            for key in encrypted_stanza
            if encrypted_stanza[key] == self.ENCRYPTED_TOKEN
        ]
        if encrypted_keys:
            encrypted_fields = json.loads(self._cred_mgr.get_password(stanza_name))
            for key in encrypted_keys:
                encrypted_stanza[key] = encrypted_fields[key]

        return encrypted_stanza

    def _delete_stanza_creds(self, stanza_name):
        self._cred_mgr.delete_password(stanza_name)

    @retry(exceptions=[binding.HTTPError])
    def stanza_exist(self, stanza_name: str) -> bool:
        """Check whether stanza exists.

        Arguments:
            stanza_name: Stanza name.

        Returns:
            True if stanza exists else False.

        Examples:
           >>> from solnlib import conf_manager
           >>> cfm = conf_manager.ConfManager(session_key,
                                              'Splunk_TA_test')
           >>> conf = cfm.get_conf('test')
           >>> conf.stanza_exist('test_stanza')
        """

        try:
            self._conf.list(name=stanza_name)[0]
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            return False

        return True

    @retry(exceptions=[binding.HTTPError])
    def get(self, stanza_name: str, only_current_app: bool = False) -> dict:
        """Get stanza from configuration file.

        Result is like:

            {
                'disabled': '0',
                'eai:appName': 'solnlib_demo',
                'eai:userName': 'nobody',
                'k1': '1',
                'k2': '2'
            }

        Arguments:
            stanza_name: Stanza name.
            only_current_app: Only include current app.

        Returns:
            Stanza.

        Raises:
            ConfStanzaNotExistException: If stanza does not exist.

        Examples:
           >>> from solnlib import conf_manager
           >>> cfm = conf_manager.ConfManager(session_key,
                                              'Splunk_TA_test')
           >>> conf = cfm.get_conf('test')
           >>> conf.get('test_stanza')
        """

        try:
            if only_current_app:
                stanza_mgrs = self._conf.list(
                    search="eai:acl.app={} name={}".format(
                        self._app, stanza_name.replace("=", r"\=")
                    )
                )
            else:
                stanza_mgrs = self._conf.list(name=stanza_name)
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            raise ConfStanzaNotExistException(
                f"Stanza: {stanza_name} does not exist in {self._name}.conf"
            )

        if len(stanza_mgrs) == 0:
            raise ConfStanzaNotExistException(
                f"Stanza: {stanza_name} does not exist in {self._name}.conf"
            )

        stanza = self._decrypt_stanza(stanza_mgrs[0].name, stanza_mgrs[0].content)
        stanza["eai:access"] = stanza_mgrs[0].access
        stanza["eai:appName"] = stanza_mgrs[0].access.app
        return stanza

    @retry(exceptions=[binding.HTTPError])
    def get_all(self, only_current_app: bool = False) -> dict:
        """Get all stanzas from configuration file.

        Result is like:

            {
                'test':
                    {
                        'disabled': '0',
                        'eai:appName': 'solnlib_demo',
                        'eai:userName': 'nobody',
                        'k1': '1',
                        'k2': '2'
                    }
            }

        Arguments:
            only_current_app: Only include current app.

        Returns:
            Dict of stanzas.

        Examples:
           >>> from solnlib import conf_manager
           >>> cfm = conf_manager.ConfManager(session_key,
                                              'Splunk_TA_test')
           >>> conf = cfm.get_conf('test')
           >>> conf.get_all()
        """

        if only_current_app:
            stanza_mgrs = self._conf.list(search=f"eai:acl.app={self._app}")
        else:
            stanza_mgrs = self._conf.list()
        res = {}
        for stanza_mgr in stanza_mgrs:
            name = stanza_mgr.name
            key_values = self._decrypt_stanza(name, stanza_mgr.content)
            key_values["eai:access"] = stanza_mgr.access
            key_values["eai:appName"] = stanza_mgr.access.app
            res[name] = key_values
        return res

    @retry(exceptions=[binding.HTTPError])
    def update(self, stanza_name: str, stanza: dict, encrypt_keys: List[str] = None):
        """Update stanza.

        It will try to encrypt the credential automatically fist if
        encrypt_keys are not None else keep stanza untouched.

        Arguments:
            stanza_name: Stanza name.
            stanza: Stanza to update.
            encrypt_keys: Field names to encrypt.

        Examples:
           >>> from solnlib import conf_manager
           >>> cfm = conf_manager.ConfManager(session_key,
                                              'Splunk_TA_test')
           >>> conf = cfm.get_conf('test')
           >>> conf.update('test_stanza', {'k1': 1, 'k2': 2}, ['k1'])
        """

        stanza = self._filter_stanza(stanza)
        encrypted_stanza = self._encrypt_stanza(stanza_name, stanza, encrypt_keys)

        try:
            stanza_mgr = self._conf.list(name=stanza_name)[0]
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            stanza_mgr = self._conf.create(stanza_name)

        stanza_mgr.submit(encrypted_stanza)

    @retry(exceptions=[binding.HTTPError])
    def delete(self, stanza_name: str):
        """Delete stanza.

        Arguments:
            stanza_name: Stanza name to delete.

        Raises:
            ConfStanzaNotExistException: If stanza does not exist.

        Examples:
           >>> from solnlib import conf_manager
           >>> cfm = conf_manager.ConfManager(session_key,
                                              'Splunk_TA_test')
           >>> conf = cfm.get_conf('test')
           >>> conf.delete('test_stanza')
        """

        try:
            self._cred_mgr.delete_password(stanza_name)
        except CredentialNotExistException:
            pass

        try:
            self._conf.delete(stanza_name)
        except KeyError:
            logging.error(
                "Delete stanza: %s error: %s.", stanza_name, traceback.format_exc()
            )
            raise ConfStanzaNotExistException(
                f"Stanza: {stanza_name} does not exist in {self._name}.conf"
            )

    @retry(exceptions=[binding.HTTPError])
    def reload(self):
        """Reload configuration file.

        Examples:
           >>> from solnlib import conf_manager
           >>> cfm = conf_manager.ConfManager(session_key,
                                              'Splunk_TA_test')
           >>> conf = cfm.get_conf('test')
           >>> conf.reload()
        """

        self._conf.get("_reload")


class ConfManagerException(Exception):
    """Exception raised by ConfManager class."""

    pass


class ConfManager:
    """Configuration file manager.

    Examples:

        >>> from solnlib import conf_manager
        >>> cfm = conf_manager.ConfManager(session_key,
                                          'Splunk_TA_test')

    Examples:
        If stanza in passwords.conf is formatted as below:

        `credential:__REST_CREDENTIAL__#Splunk_TA_test#configs/conf-CONF_FILENAME:STANZA_NAME``splunk_cred_sep``1:`

        >>> from solnlib import conf_manager
        >>> cfm = conf_manager.ConfManager(
                session_key,
                'Splunk_TA_test',
                realm='__REST_CREDENTIAL__#Splunk_TA_test#configs/conf-CONF_FILENAME'
            )
    """

    def __init__(
        self,
        session_key: str,
        app: str,
        owner: str = "nobody",
        scheme: str = None,
        host: str = None,
        port: int = None,
        realm: str = None,
        **context: dict,
    ):
        """Initializes ConfManager.

        Arguments:
            session_key: Splunk access token.
            app: App name of namespace.
            owner: (optional) Owner of namespace, default is `nobody`.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            realm: (optional) Realm of credential, default is None.
            context: Other configurations for Splunk rest client.
        """
        self._session_key = session_key
        self._app = app
        self._owner = owner
        self._scheme = scheme
        self._host = host
        self._port = port
        self._context = context
        self._rest_client = rest_client.SplunkRestClient(
            self._session_key,
            self._app,
            owner=self._owner,
            scheme=self._scheme,
            host=self._host,
            port=self._port,
            **self._context,
        )
        self._confs = None
        self._realm = realm

    @retry(exceptions=[binding.HTTPError])
    def get_conf(self, name: str, refresh: bool = False) -> ConfFile:
        """Get conf file.

        Arguments:
            name: Conf file name.
            refresh: (optional) Flag to refresh conf file list, default is False.

        Returns:
            Conf file object.

        Raises:
            ConfManagerException: If `conf_file` does not exist.
        """

        if self._confs is None or refresh:
            # Fix bug that can't pass `-` as app name.
            curr_app = self._rest_client.namespace.app
            self._rest_client.namespace.app = "dummy"
            self._confs = self._rest_client.confs
            self._rest_client.namespace.app = curr_app

        try:
            conf = self._confs[name]
        except KeyError:
            raise ConfManagerException(f"Config file: {name} does not exist.")

        return ConfFile(
            name,
            conf,
            self._session_key,
            self._app,
            self._owner,
            self._scheme,
            self._host,
            self._port,
            self._realm,
            **self._context,
        )

    @retry(exceptions=[binding.HTTPError])
    def create_conf(self, name: str) -> ConfFile:
        """Create conf file.

        Arguments:
            name: Conf file name.

        Returns:
            Conf file object.
        """

        if self._confs is None:
            self._confs = self._rest_client.confs

        conf = self._confs.create(name)
        return ConfFile(
            name,
            conf,
            self._session_key,
            self._app,
            self._owner,
            self._scheme,
            self._host,
            self._port,
            self._realm,
            **self._context,
        )


def get_log_level(
    *,
    logger: logging.Logger,
    session_key: str,
    app_name: str,
    conf_name: str,
    log_level_field: str = "loglevel",
    default_log_level: str = "INFO",
) -> str:
    """This function returns the log level for the addon from configuration
    file.

    Arguments:
        logger: Logger.
        session_key: Splunk access token.
        app_name: Add-on name.
        conf_name: Configuration file name where logging stanza is.
        log_level_field: Logging level field name under logging stanza.
        default_log_level: Default log level to return in case of errors.

    Returns:
        Log level defined under `logging.log_level_field` field in `conf_name`
        file. In case of any error, `default_log_level` will be returned.

    Examples:
        >>> from solnlib import conf_manager
        >>> log_level = conf_manager.get_log_level(
        >>>     logger,
        >>>     "session_key",
        >>>     "ADDON_NAME",
        >>>     "splunk_ta_addon_settings",
        >>> )
    """
    try:
        cfm = ConfManager(
            session_key,
            app_name,
            realm=f"__REST_CREDENTIAL__#{app_name}#configs/conf-{conf_name}",
        )
        conf = cfm.get_conf(conf_name)
    except ConfManagerException:
        logger.error(
            f"Failed to fetch configuration file {conf_name}, "
            f"taking {default_log_level} as log level."
        )
        return default_log_level
    try:
        logging_details = conf.get("logging")
        return logging_details.get(log_level_field, default_log_level)
    except ConfStanzaNotExistException:
        logger.error(
            f'"logging" stanza does not exist under {conf_name}, '
            f"taking {default_log_level} as log level."
        )
        return default_log_level
