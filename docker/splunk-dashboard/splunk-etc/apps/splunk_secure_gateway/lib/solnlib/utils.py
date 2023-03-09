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

"""Common utilities."""

import datetime
import logging
import os
import signal
import time
import traceback
from functools import wraps
from typing import Any, Callable, List, Tuple, Union
from urllib import parse as urlparse

__all__ = [
    "handle_teardown_signals",
    "datetime_to_seconds",
    "is_true",
    "is_false",
    "retry",
    "extract_http_scheme_host_port",
    "remove_http_proxy_env_vars",
]


def remove_http_proxy_env_vars() -> None:
    """Removes HTTP(s) proxies from environment variables.

    Removes the following environment variables:
        * http_proxy
        * https_proxy
        * HTTP_PROXY
        * HTTPS_PROXY

    This function can be used in Splunk modular inputs code before starting the
    ingestion to ensure that no proxy is going to be used when doing requests.
    In case of proxy is needed, it can be defined in the modular inputs code.
    """
    env_vars_to_remove = (
        "http_proxy",
        "https_proxy",
        "HTTP_PROXY",
        "HTTPS_PROXY",
    )
    for env_var in env_vars_to_remove:
        if env_var in os.environ:
            del os.environ[env_var]


def handle_teardown_signals(callback: Callable):
    """Register handler for SIGTERM/SIGINT/SIGBREAK signal.

    Catch SIGTERM/SIGINT/SIGBREAK signals, and invoke callback
    Note: this should be called in main thread since Python only catches
    signals in main thread.

    Arguments:
        callback: Callback for tear down signals.
    """

    signal.signal(signal.SIGTERM, callback)
    signal.signal(signal.SIGINT, callback)

    if os.name == "nt":
        signal.signal(signal.SIGBREAK, callback)


def datetime_to_seconds(dt: datetime.datetime) -> float:
    """Convert UTC datetime to seconds since epoch.

    Arguments:
        dt: Date time.

    Returns:
        Seconds since epoch.
    """

    epoch_time = datetime.datetime.utcfromtimestamp(0)
    return (dt - epoch_time).total_seconds()


def is_true(val: Union[str, int]) -> bool:
    """Decide if `val` is true.

    Arguments:
        val: Value to check.

    Returns:
        True or False.
    """

    value = str(val).strip().upper()
    if value in ("1", "TRUE", "T", "Y", "YES"):
        return True
    return False


def is_false(val: Union[str, int]) -> bool:
    """Decide if `val` is false.

    Arguments:
        val: Value to check.

    Returns:
        True or False.
    """

    value = str(val).strip().upper()
    if value in ("0", "FALSE", "F", "N", "NO", "NONE", ""):
        return True
    return False


def retry(
    retries: int = 3,
    reraise: bool = True,
    default_return: Any = None,
    exceptions: List = None,
):
    """A decorator to run function with max `retries` times if there is
    exception.

    Arguments:
        retries: (optional) Max retries times, default is 3.
        reraise: Whether exception should be reraised, default is True.
        default_return: (optional) Default return value for function
            run after max retries and reraise is False.
        exceptions: (optional) List of exceptions that should retry.
    """

    max_tries = max(retries, 0) + 1

    def do_retry(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_ex = None
            for i in range(max_tries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    logging.warning(
                        "Run function: %s failed: %s.",
                        func.__name__,
                        traceback.format_exc(),
                    )
                    if not exceptions or any(
                        isinstance(e, exception) for exception in exceptions
                    ):
                        last_ex = e
                        if i < max_tries - 1:
                            time.sleep(2**i)
                    else:
                        raise

            if reraise:
                raise last_ex
            else:
                return default_return

        return wrapper

    return do_retry


def extract_http_scheme_host_port(http_url: str) -> Tuple:
    """Extract scheme, host and port from a HTTP URL.

    Arguments:
        http_url: HTTP URL to extract.

    Returns:
        A tuple of scheme, host and port

    Raises:
        ValueError: If `http_url` is not in http(s)://hostname:port format.
    """

    http_info = urlparse.urlparse(http_url)
    if not http_info.scheme or not http_info.hostname or not http_info.port:
        raise ValueError(http_url + " is not in http(s)://hostname:port format")
    return http_info.scheme, http_info.hostname, http_info.port
