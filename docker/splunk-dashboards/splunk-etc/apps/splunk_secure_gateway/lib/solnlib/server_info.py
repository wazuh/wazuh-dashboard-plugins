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

"""This module contains Splunk server info related functionalities."""

import json
from typing import Any, Dict, Optional

from splunklib import binding

from solnlib import splunk_rest_client as rest_client
from solnlib import utils

__all__ = ["ServerInfo", "ServerInfoException"]


class ServerInfoException(Exception):
    """Exception raised by ServerInfo class."""

    pass


class ServerInfo:
    """This class is a wrapper of Splunk server info."""

    SHC_MEMBER_ENDPOINT = "/services/shcluster/member/members"
    SHC_CAPTAIN_INFO_ENDPOINT = "/services/shcluster/captain/info"

    def __init__(
        self,
        session_key: str,
        scheme: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = None,
        **context: Any
    ):
        """Initializes ServerInfo.

        Arguments:
            session_key: Splunk access token.
            scheme: The access scheme, default is None.
            host: The host name, default is None.
            port: The port number, default is None.
            context: Other configurations for Splunk rest client.
        """
        self._rest_client = rest_client.SplunkRestClient(
            session_key, "-", scheme=scheme, host=host, port=port, **context
        )

    @classmethod
    def from_server_uri(
        cls, server_uri: str, session_key: str, **context: Any
    ) -> "ServerInfo":
        """Creates ServerInfo class using server_uri and session_key.

        Note: splunktalib uses these parameters to create it's ServerInfo class,
        so this method should ease the transition from splunktalib to solnlib.

        Arguments:
            server_uri: splunkd URI.
            session_key: Splunk access token.
            context: Other configurations for Splunk rest client.

        Returns:
            An instance of `ServerInfo`.

        Raises:
            ValueError: server_uri is in the wrong format.
        """
        scheme, host, port = utils.extract_http_scheme_host_port(server_uri)
        return ServerInfo(
            session_key,
            scheme=scheme,
            host=host,
            port=port,
            **context,
        )

    def to_dict(self) -> Dict:
        """Returns server information in a form dictionary.

        Note: This method is implemented here to have compatibility with splunktalib's
        analogue.

        Returns:
            Server information in a dictionary format.
        """
        return self._server_info()

    @utils.retry(exceptions=[binding.HTTPError])
    def _server_info(self):
        return self._rest_client.info

    @property
    def server_name(self) -> str:
        """Get server name.

        Returns:
            Server name.
        """
        return self._server_info()["serverName"]

    @property
    def guid(self) -> str:
        """Get guid for the server.

        Returns:
            Server GUID.
        """
        return self._server_info()["guid"]

    @property
    def version(self) -> str:
        """Get Splunk server version.

        Returns:
            Splunk version.
        """
        return self._server_info()["version"]

    def is_captain(self) -> bool:
        """Check if this server is SHC captain.

        Note during a rolling start of SH members, the captain may be changed
        from machine to machine. To avoid the race condition, client may need
        do necessary sleep and then poll `is_captain_ready() == True` and then
        check `is_captain()`. See `is_captain_ready()` for more details.

        Returns:
            True if this server is SHC captain else False.
        """

        return "shc_captain" in self._server_info()["server_roles"]

    def is_cloud_instance(self) -> bool:
        """Check if this server is a cloud instance.

        Returns:
            True if this server is a cloud instance else False.
        """

        try:
            return self._server_info()["instance_type"] == "cloud"
        except KeyError:
            return False

    def is_search_head(self) -> bool:
        """Check if this server is a search head.

        Returns:
            True if this server is a search head else False.
        """

        server_info = self._server_info()
        for sh in ("search_head", "cluster_search_head"):
            if sh in server_info["server_roles"]:
                return True

        return False

    def is_shc_member(self) -> bool:
        """Check if this server is a SHC member.

        Returns:
            True if this server is a SHC member else False.
        """

        server_info = self._server_info()
        for sh in ("shc_member", "shc_captain"):
            if sh in server_info["server_roles"]:
                return True

        return False

    @utils.retry(exceptions=[binding.HTTPError])
    def get_shc_members(self) -> list:
        """Get SHC members.

        Raises:
            ServerInfoException: If this server has no SHC members.

        Returns:
            List of SHC members [(label, peer_scheme_host_port) ...].
        """
        try:
            content = self._rest_client.get(
                self.SHC_MEMBER_ENDPOINT, output_mode="json"
            ).body.read()
        except binding.HTTPError as e:
            if e.status != 404 and e.status != 503:
                raise

            raise ServerInfoException(
                "This server is not a SHC member and has no SHC members."
            )

        members = []
        for member in json.loads(content)["entry"]:
            content = member["content"]
            members.append((content["label"], content["peer_scheme_host_port"]))

        return members

    @utils.retry(exceptions=[binding.HTTPError])
    def is_captain_ready(self) -> bool:
        """Check if captain is ready.

        Client usually first polls this function until captain is ready
        and then call is_captain to detect current captain machine

        Returns:
            True if captain is ready else False.

        Examples:
            >>> from solnlib import server_info
            >>> serverinfo = server_info.ServerInfo(session_key)
            >>> while 1:
            >>>    if serverinfo.is_captain_ready():
            >>>        break
            >>>    time.sleep(2)
            >>>
            >>> # If do_stuff can only be executed in SH captain
            >>> if serverinfo.is_captain():
            >>>    do_stuff()
        """

        cap_info = self.captain_info()
        return utils.is_true(cap_info["service_ready_flag"]) and utils.is_false(
            cap_info["maintenance_mode"]
        )

    @utils.retry(exceptions=[binding.HTTPError])
    def captain_info(self) -> dict:
        """Get captain information.

        Raises:
            ServerInfoException: If there is SHC is not enabled.

        Returns:
            Captain information.
        """

        try:
            content = self._rest_client.get(
                self.SHC_CAPTAIN_INFO_ENDPOINT, output_mode="json"
            ).body.read()
        except binding.HTTPError as e:
            if e.status == 503 and "not available" in str(e):
                raise ServerInfoException(str(e))
            raise

        return json.loads(content)["entry"][0]["content"]
