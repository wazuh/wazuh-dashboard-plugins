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

"""Net utilities."""
import re
import socket

__all__ = ["resolve_hostname", "validate_scheme_host_port"]

from typing import Optional, Union


def resolve_hostname(addr: str) -> Optional[str]:
    """Try to resolve an IP to a host name and returns None on common failures.

    Arguments:
        addr: IP address to resolve.

    Returns:
        Host name if success else None.

    Raises:
        ValueError: If `addr` is not a valid address.
    """

    if is_valid_ip(addr):
        try:
            name, _, _ = socket.gethostbyaddr(addr)
            return name
        except socket.gaierror:
            # [Errno 8] nodename nor servname provided, or not known
            pass
        except socket.herror:
            # [Errno 1] Unknown host
            pass
        except socket.timeout:
            # Timeout.
            pass

        return None
    else:
        raise ValueError("Invalid ip address.")


def is_valid_ip(addr: str) -> bool:
    """Validate an IPV4 address.

    Arguments:
        addr: IP address to validate.

    Returns:
        True if is valid else False.
    """

    ip_rx = re.compile(
        r"""
        ^(((
              [0-1]\d{2}                  # matches 000-199
            | 2[0-4]\d                    # matches 200-249
            | 25[0-5]                     # matches 250-255
            | \d{1,2}                     # matches 0-9, 00-99
        )\.){3})                          # 3 of the preceding stanzas
        ([0-1]\d{2}|2[0-4]\d|25[0-5]|\d{1,2})$     # final octet
    """,
        re.VERBOSE,
    )

    try:
        return ip_rx.match(addr.strip())
    except AttributeError:
        # Value was not a string
        return False


def is_valid_hostname(hostname: str) -> bool:
    """Validate a host name.

    Arguments:
        hostname: host name to validate.

    Returns:
        True if is valid else False.
    """

    if len(hostname) > 255:
        return False
    if hostname[-1:] == ".":
        hostname = hostname[:-1]
    allowed = re.compile(r"(?!-)(::)?[A-Z\d-]{1,63}(?<!-)$", re.IGNORECASE)
    return all(allowed.match(x) for x in hostname.split("."))


def is_valid_port(port: Union[str, int]) -> bool:
    """Validate a port.

    Arguments:
        port: port to validate.

    Returns:
        True if is valid else False.
    """

    try:
        return 0 < int(port) <= 65535
    except ValueError:
        return False


def is_valid_scheme(scheme: str) -> bool:
    """Validate a scheme.

    Arguments:
        scheme: scheme to validate.

    Returns:
        True if is valid else False.
    """

    return scheme.lower() in ("http", "https")


def validate_scheme_host_port(scheme: str, host: str, port: Union[str, int]):
    """Validates scheme, host and port.

    Arguments:
        scheme: scheme to validate.
        host: hostname to validate.
        port: port to validate.

    Raises:
        ValueError: if scheme, host or port are invalid.
    """
    if scheme is not None and not is_valid_scheme(scheme):
        raise ValueError("Invalid scheme")
    if host is not None and not is_valid_hostname(host):
        raise ValueError("Invalid host")
    if port is not None and not is_valid_port(port):
        raise ValueError("Invalid port")
