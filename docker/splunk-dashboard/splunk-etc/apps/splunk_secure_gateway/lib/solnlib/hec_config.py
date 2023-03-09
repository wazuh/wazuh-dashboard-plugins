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

from splunklib import binding

from . import splunk_rest_client as rest_client
from .utils import retry

__all__ = ["HECConfig"]


class HECConfig:
    """HTTP Event Collector configuration."""

    input_type = "http"

    def __init__(
        self,
        session_key: str,
        scheme: str = None,
        host: str = None,
        port: int = None,
        **context: dict
    ):
        """Initializes HECConfig.

        Arguments:
            session_key: Splunk access token.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            context: Other configurations for Splunk rest client.
        """
        self._rest_client = rest_client.SplunkRestClient(
            session_key,
            "splunk_httpinput",
            scheme=scheme,
            host=host,
            port=port,
            **context
        )

    @retry(exceptions=[binding.HTTPError])
    def get_settings(self) -> dict:
        """Get http data input global settings.

        Returns:
            HTTP global settings, for example:

                {
                    'enableSSL': 1,
                    'disabled': 0,
                    'useDeploymentServer': 0,
                    'port': 8088
                }
        """

        return self._do_get_input(self.input_type).content

    @retry(exceptions=[binding.HTTPError])
    def update_settings(self, settings: dict):
        """Update http data input global settings.

        Arguments:
            settings: HTTP global settings.
        """

        res = self._do_get_input(self.input_type)
        res.update(**settings)

    @retry(exceptions=[binding.HTTPError])
    def create_input(self, name: str, stanza: dict) -> dict:
        """Create http data input.

        Arguments:
            name: HTTP data input name.
            stanza: Data input stanza content.

        Returns:
            Created input.

        Examples:
           >>> from solnlib.hec_config import HECConfig
           >>> hec = HECConfig(session_key)
           >>> hec.create_input('my_hec_data_input',
                                {'index': 'main', 'sourcetype': 'hec'})
        """

        res = self._rest_client.inputs.create(name, self.input_type, **stanza)
        return res.content

    @retry(exceptions=[binding.HTTPError])
    def update_input(self, name: str, stanza: dict):
        """Update http data input.

        It will create if the data input doesn't exist.

        Arguments:
            name: HTTP data input name.
            stanza: Data input stanza.

        Examples:
           >>> from solnlib import HEConfig
           >>> hec = HECConfig(session_key)
           >>> hec.update_input('my_hec_data_input',
                                {'index': 'main', 'sourcetype': 'hec2'})
        """

        res = self._do_get_input(name)
        if res is None:
            return self.create_input(name, stanza)
        res.update(**stanza)

    @retry(exceptions=[binding.HTTPError])
    def delete_input(self, name: str):
        """Delete http data input.

        Arguments:
            name: HTTP data input name.
        """

        try:
            self._rest_client.inputs.delete(name, self.input_type)
        except KeyError:
            pass

    @retry(exceptions=[binding.HTTPError])
    def get_input(self, name: str) -> dict:
        """Get http data input.

        Arguments:
            name: HTTP event collector data input name.

        Returns:
            HTTP event collector data input config dict.
        """

        res = self._do_get_input(name)
        if res:
            return res.content
        else:
            return None

    def _do_get_input(self, name):
        try:
            return self._rest_client.inputs[(name, self.input_type)]
        except KeyError:
            return None

    @retry(exceptions=[binding.HTTPError])
    def get_limits(self) -> dict:
        """Get HTTP input limits.

        Returns:
            HTTP input limits.
        """

        return self._rest_client.confs["limits"]["http_input"].content

    @retry(exceptions=[binding.HTTPError])
    def set_limits(self, limits: dict):
        """Set HTTP input limits.

        Arguments:
            limits: HTTP input limits.
        """

        res = self._rest_client.confs["limits"]["http_input"]
        res.submit(limits)
