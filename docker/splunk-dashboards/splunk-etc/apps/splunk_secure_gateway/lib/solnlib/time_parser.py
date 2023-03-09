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

"""This module provides interfaces to parse and convert timestamp."""

import datetime
import json
from typing import Any

from splunklib import binding

from . import splunk_rest_client as rest_client
from .utils import retry

__all__ = ["TimeParser"]


class InvalidTimeFormatException(Exception):
    """Exception for invalid time format."""

    pass


class TimeParser:
    """Datetime parser.

    Use splunkd rest to parse datetime.

    Examples:
       >>> from solnlib import time_parser
       >>> tp = time_parser.TimeParser(session_key)
       >>> tp.to_seconds('2011-07-06T21:54:23.000-07:00')
       >>> tp.to_utc('2011-07-06T21:54:23.000-07:00')
       >>> tp.to_local('2011-07-06T21:54:23.000-07:00')
    """

    URL = "/services/search/timeparser"

    def __init__(
        self,
        session_key: str,
        scheme: str = None,
        host: str = None,
        port: int = None,
        **context: Any,
    ):
        """Initializes TimeParser.

        Arguments:
            session_key: Splunk access token.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            context: Other configurations for Splunk rest client.

        Raises:
            ValueError: if scheme, host or port are invalid.
        """
        self._rest_client = rest_client.SplunkRestClient(
            session_key, "-", scheme=scheme, host=host, port=port, **context
        )

    @retry(exceptions=[binding.HTTPError])
    def to_seconds(self, time_str: str) -> float:
        """Parse `time_str` and convert to seconds since epoch.

        Arguments:
            time_str: ISO8601 format timestamp, example: 2011-07-06T21:54:23.000-07:00.

        Raises:
            binding.HTTPError: rest client returns an exception (everything
                else than 400 code).
            InvalidTimeFormatException: when time format is invalid (rest
                client returns 400 code).

        Returns:
            Seconds since epoch.
        """

        try:
            response = self._rest_client.get(
                self.URL, output_mode="json", time=time_str, output_time_format="%s"
            ).body.read()
        except binding.HTTPError as e:
            if e.status != 400:
                raise

            raise InvalidTimeFormatException(f"Invalid time format: {time_str}.")

        seconds = json.loads(response)[time_str]
        return float(seconds)

    def to_utc(self, time_str: str) -> datetime.datetime:
        """Parse `time_str` and convert to UTC timestamp.

        Arguments:
            time_str: ISO8601 format timestamp, example: 2011-07-06T21:54:23.000-07:00.

        Raises:
            binding.HTTPError: rest client returns an exception (everything
                else than 400 code).
            InvalidTimeFormatException: when time format is invalid (rest
                client returns 400 code).

        Returns:
            UTC timestamp.
        """

        return datetime.datetime.utcfromtimestamp(self.to_seconds(time_str))

    @retry(exceptions=[binding.HTTPError])
    def to_local(self, time_str: str) -> str:
        """Parse `time_str` and convert to local timestamp.

        Arguments:
            time_str: ISO8601 format timestamp, example: 2011-07-06T21:54:23.000-07:00.

        Raises:
            binding.HTTPError: rest client returns an exception (everything
                else than 400 code).
            InvalidTimeFormatException: when time format is invalid (rest
                client returns 400 code).

        Returns:
            Local timestamp in ISO8601 format.
        """

        try:
            response = self._rest_client.get(
                self.URL, output_mode="json", time=time_str
            ).body.read()
        except binding.HTTPError as e:
            if e.status != 400:
                raise

            raise InvalidTimeFormatException(f"Invalid time format: {time_str}.")

        return json.loads(response)[time_str]
