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

"""This module contains Splunk credential related interfaces."""

import json
import re
import warnings
from typing import Dict, List

from splunklib import binding, client

from . import splunk_rest_client as rest_client
from .net_utils import validate_scheme_host_port
from .splunkenv import get_splunkd_access_info
from .utils import retry

__all__ = [
    "CredentialException",
    "CredentialNotExistException",
    "CredentialManager",
    "get_session_key",
]


class CredentialException(Exception):
    """General exception regarding credentials."""

    pass


class CredentialNotExistException(Exception):
    """Exception is raised when credentials do not exist."""

    pass


class CredentialManager:
    """Credential manager.

    Examples:
       >>> from solnlib import credentials
       >>> cm = credentials.CredentialManager(session_key,
                                              'Splunk_TA_test',
                                              realm='realm_test')
    """

    # Splunk can only encrypt string with length <=255
    SPLUNK_CRED_LEN_LIMIT = 255

    # Splunk credential separator
    SEP = "``splunk_cred_sep``"

    # Splunk credential end mark
    END_MARK = (
        "``splunk_cred_sep``S``splunk_cred_sep``P``splunk_cred_sep``L``splunk_cred_sep``"
        "U``splunk_cred_sep``N``splunk_cred_sep``K``splunk_cred_sep``"
    )

    def __init__(
        self,
        session_key: str,
        app: str,
        owner: str = "nobody",
        realm: str = None,
        scheme: str = None,
        host: str = None,
        port: int = None,
        **context: dict,
    ):
        """Initializes CredentialManager.

        Arguments:
            session_key: Splunk access token.
            app: App name of namespace.
            owner: (optional) Owner of namespace, default is `nobody`.
            realm: (optional) Realm of credential, default is None.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            context: Other configurations for Splunk rest client.
        """
        self._realm = realm
        self.service = rest_client.SplunkRestClient(
            session_key,
            app,
            owner=owner,
            scheme=scheme,
            host=host,
            port=port,
            **context,
        )
        self._storage_passwords = self.service.storage_passwords

    @retry(exceptions=[binding.HTTPError])
    def get_password(self, user: str) -> str:
        """Get password.

        Arguments:
            user: User name.

        Returns:
            Clear user password.

        Raises:
            CredentialNotExistException: If password for 'realm:user' doesn't exist.

        Examples:
           >>> from solnlib import credentials
           >>> cm = credentials.CredentialManager(session_key,
                                                  'Splunk_TA_test',
                                                  realm='realm_test')
           >>> cm.get_password('testuser2')
        """
        if self._realm is not None:
            passwords = self.get_clear_passwords_in_realm()
        else:
            passwords = self.get_clear_passwords()
        for password in passwords:
            if password["username"] == user and password["realm"] == self._realm:
                return password["clear_password"]

        raise CredentialNotExistException(
            f"Failed to get password of realm={self._realm}, user={user}."
        )

    @retry(exceptions=[binding.HTTPError])
    def set_password(self, user: str, password: str):
        """Set password.

        Arguments:
            user: User name.
            password: User password.

        Examples:
           >>> from solnlib import credentials
           >>> cm = credentials.CredentialManager(session_key,
                                                  'Splunk_TA_test',
                                                  realm='realm_test')
           >>> cm.set_password('testuser1', 'password1')
        """
        length = 0
        index = 1
        while length < len(password):
            curr_str = password[
                length : length + self.SPLUNK_CRED_LEN_LIMIT  # noqa: E203
            ]
            partial_user = self.SEP.join([user, str(index)])
            self._update_password(partial_user, curr_str)
            length += self.SPLUNK_CRED_LEN_LIMIT
            index += 1

        # Append another stanza to mark the end of the password
        partial_user = self.SEP.join([user, str(index)])
        self._update_password(partial_user, self.END_MARK)

    @retry(exceptions=[binding.HTTPError])
    def _update_password(self, user: str, password: str):
        """Update password.

        Arguments:
            user: User name.
            password: User password.

        Examples:
           >>> from solnlib import credentials
           >>> cm = credentials.CredentialManager(session_key,
                                                  'Splunk_TA_test',
                                                  realm='realm_test')
           >>> cm._update_password('testuser1', 'password1')
        """
        try:
            self._storage_passwords.create(password, user, self._realm)
        except binding.HTTPError as ex:
            if ex.status == 409:
                if self._realm is not None:
                    passwords = self.get_raw_passwords_in_realm()
                else:
                    passwords = self.get_raw_passwords()
                for pwd_stanza in passwords:
                    if pwd_stanza.realm == self._realm and pwd_stanza.username == user:
                        pwd_stanza.update(password=password)
                        return
                raise ValueError(
                    f"Can not get the password object for realm: {self._realm} user: {user}"
                )
            else:
                raise ex

    @retry(exceptions=[binding.HTTPError])
    def delete_password(self, user: str):
        """Delete password.

        Arguments:
            user: User name.

        Raises:
             CredentialNotExistException: If password of realm:user doesn't exist.

        Examples:
           >>> from solnlib import credentials
           >>> cm = credentials.CredentialManager(session_key,
                                                  'Splunk_TA_test',
                                                  realm='realm_test')
           >>> cm.delete_password('testuser1')
        """
        if self._realm is not None:
            passwords = self.get_raw_passwords_in_realm()
        else:
            passwords = self.get_raw_passwords()
        deleted = False
        ent_pattern = re.compile(
            r"({}{}\d+)".format(user.replace("\\", "\\\\"), self.SEP)
        )
        for password in passwords:
            match = (user == password.username) or ent_pattern.match(password.username)
            if match and password.realm == self._realm:
                password.delete()
                deleted = True

        if not deleted:
            raise CredentialNotExistException(
                f"Failed to delete password of realm={self._realm}, user={user}"
            )

    def get_raw_passwords(self) -> List[client.StoragePassword]:
        """Returns all passwords in the "raw" format."""
        warnings.warn(
            "Please pass realm to the CredentialManager, "
            "so it can utilize get_raw_passwords_in_realm method instead."
        )
        return self._storage_passwords.list(count=-1)

    def get_raw_passwords_in_realm(self) -> List[client.StoragePassword]:
        """Returns all passwords within the realm in the "raw" format."""
        if self._realm is None:
            raise ValueError("No realm was specified")
        return self._storage_passwords.list(count=-1, search=f"realm={self._realm}")

    def get_clear_passwords(self) -> List[Dict[str, str]]:
        """Returns all passwords in the "clear" format."""
        warnings.warn(
            "Please pass realm to the CredentialManager, "
            "so it can utilize get_clear_passwords_in_realm method instead."
        )
        raw_passwords = self.get_raw_passwords()
        return self._get_clear_passwords(raw_passwords)

    def get_clear_passwords_in_realm(self) -> List[Dict[str, str]]:
        """Returns all passwords within the realm in the "clear" format."""
        if self._realm is None:
            raise ValueError("No realm was specified")
        raw_passwords = self.get_raw_passwords_in_realm()
        return self._get_clear_passwords(raw_passwords)

    def _get_all_passwords_in_realm(self) -> List[client.StoragePassword]:
        warnings.warn(
            "_get_all_passwords_in_realm is deprecated, "
            "please use get_raw_passwords_in_realm instead.",
            stacklevel=2,
        )
        if self._realm:
            all_passwords = self._storage_passwords.list(
                count=-1, search=f"realm={self._realm}"
            )
        else:
            all_passwords = self._storage_passwords.list(count=-1, search="")
        return all_passwords

    def _get_clear_passwords(
        self, passwords: List[client.StoragePassword]
    ) -> List[Dict[str, str]]:
        results = {}
        ptn = re.compile(rf"(.+){self.SEP}(\d+)")
        for password in passwords:
            match = ptn.match(password.name)
            if match:
                actual_name = match.group(1) + ":"
                index = int(match.group(2))
                if actual_name in results:
                    exist_stanza = results[actual_name]
                else:
                    exist_stanza = {}
                    exist_stanza["name"] = actual_name
                    exist_stanza["realm"] = password.realm
                    exist_stanza["username"] = password.username.split(self.SEP)[0]
                    exist_stanza["clears"] = {}
                    results[actual_name] = exist_stanza

                exist_stanza["clears"][index] = password.clear_password

        # Backward compatibility
        # To deal with the password with only one stanza which is generated by the old version.
        for password in passwords:
            match = ptn.match(password.name)
            if (not match) and (password.name not in results):
                results[password.name] = {
                    "name": password.name,
                    "realm": password.realm,
                    "username": password.username,
                    "clear_password": password.clear_password,
                }

        # Merge password by index
        for name, values in list(results.items()):
            field_clear = values.get("clears")
            if field_clear:
                clear_password = ""
                for index in sorted(field_clear.keys()):
                    if field_clear[index] != self.END_MARK:
                        clear_password += field_clear[index]
                    else:
                        break
                values["clear_password"] = clear_password

                del values["clears"]

        return list(results.values())

    @retry(exceptions=[binding.HTTPError])
    def _get_all_passwords(self) -> List[Dict[str, str]]:
        warnings.warn(
            "_get_all_passwords is deprecated, "
            "please use get_all_passwords_in_realm instead.",
            stacklevel=2,
        )
        passwords = self._storage_passwords.list(count=-1)
        return self._get_clear_passwords(passwords)


@retry(exceptions=[binding.HTTPError])
def get_session_key(
    username: str,
    password: str,
    scheme: str = None,
    host: str = None,
    port: int = None,
    **context: dict,
) -> str:
    """Get splunkd access token.

    Arguments:
        username: The Splunk account username, which is used to authenticate the Splunk instance.
        password: The Splunk account password.
        scheme: (optional) The access scheme, default is None.
        host: (optional) The host name, default is None.
        port: (optional) The port number, default is None.
        context: Other configurations for Splunk rest client.

    Returns:
        Splunk session key.

    Raises:
        CredentialException: If username/password are invalid.
        ValueError: if scheme, host or port are invalid.

    Examples:
       >>> get_session_key('user', 'password')
    """
    validate_scheme_host_port(scheme, host, port)

    if any([scheme is None, host is None, port is None]):
        scheme, host, port = get_splunkd_access_info()

    uri = "{scheme}://{host}:{port}/{endpoint}".format(
        scheme=scheme, host=host, port=port, endpoint="services/auth/login"
    )
    _rest_client = rest_client.SplunkRestClient(
        None, "-", "nobody", scheme, host, port, **context
    )
    try:
        response = _rest_client.http.post(
            uri, username=username, password=password, output_mode="json"
        )
    except binding.HTTPError as e:
        if e.status != 401:
            raise

        raise CredentialException("Invalid username/password.")

    return json.loads(response.body.read())["sessionKey"]
