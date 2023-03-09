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

"""Splunk platform related utilities."""

import os
import os.path as op
import socket
import subprocess
from configparser import ConfigParser
from io import StringIO
from typing import List, Optional, Tuple, Union

__all__ = [
    "make_splunkhome_path",
    "get_splunk_host_info",
    "get_splunk_bin",
    "get_splunkd_access_info",
    "get_splunkd_uri",
    "get_conf_key_value",
    "get_conf_stanza",
    "get_conf_stanzas",
]

ETC_LEAF = "etc"

# See validateSearchHeadPooling() in src/libbundle/ConfSettings.cpp
on_shared_storage = [
    os.path.join(ETC_LEAF, "apps"),
    os.path.join(ETC_LEAF, "users"),
    os.path.join("var", "run", "splunk", "dispatch"),
    os.path.join("var", "run", "splunk", "srtemp"),
    os.path.join("var", "run", "splunk", "rss"),
    os.path.join("var", "run", "splunk", "scheduler"),
    os.path.join("var", "run", "splunk", "lookup_tmp"),
]


def _splunk_home():
    return os.path.normpath(os.environ["SPLUNK_HOME"])


def _splunk_etc():
    try:
        result = os.environ["SPLUNK_ETC"]
    except KeyError:
        result = op.join(_splunk_home(), ETC_LEAF)

    return os.path.normpath(result)


def _get_shared_storage() -> Optional[str]:
    """Get splunk shared storage name.

    Returns:
        Splunk shared storage name.
    """

    try:
        state = get_conf_key_value("server", "pooling", "state")
        storage = get_conf_key_value("server", "pooling", "storage")
    except KeyError:
        state = "disabled"
        storage = None

    if state == "enabled" and storage:
        return storage

    return None


# Verify path prefix and return true if both paths have drives
def _verify_path_prefix(path, start):
    path_drive = os.path.splitdrive(path)[0]
    start_drive = os.path.splitdrive(start)[0]
    return len(path_drive) == len(start_drive)


def make_splunkhome_path(parts: Union[List, Tuple]) -> str:
    """Construct absolute path by $SPLUNK_HOME and `parts`.

    Concatenate $SPLUNK_HOME and `parts` to an absolute path.
    For example, `parts` is ['etc', 'apps', 'Splunk_TA_test'],
    the return path will be $SPLUNK_HOME/etc/apps/Splunk_TA_test.
    Note: this function assumed SPLUNK_HOME is in environment varialbes.

    Arguments:
        parts: Path parts.

    Returns:
        Absolute path.

    Raises:
        ValueError: Escape from intended parent directories.
    """

    relpath = os.path.normpath(os.path.join(*parts))

    basepath = None
    shared_storage = _get_shared_storage()
    if shared_storage:
        for candidate in on_shared_storage:
            # SPL-100508 On windows if the path is missing the drive letter,
            # construct fullpath manually and call relpath
            if os.name == "nt" and not _verify_path_prefix(relpath, candidate):
                break

            if os.path.relpath(relpath, candidate)[0:2] != "..":
                basepath = shared_storage
                break

    if basepath is None:
        etc_with_trailing_sep = os.path.join(ETC_LEAF, "")
        if relpath == ETC_LEAF or relpath.startswith(etc_with_trailing_sep):
            # Redirect $SPLUNK_HOME/etc to $SPLUNK_ETC.
            basepath = _splunk_etc()
            # Remove leading etc (and path separator, if present). Note: when
            # emitting $SPLUNK_ETC exactly, with no additional path parts, we
            # set <relpath> to the empty string.
            relpath = relpath[4:]
        else:
            basepath = _splunk_home()

    fullpath = os.path.normpath(os.path.join(basepath, relpath))

    # Check that we haven't escaped from intended parent directories.
    if os.path.relpath(fullpath, basepath)[0:2] == "..":
        raise ValueError(
            f'Illegal escape from parent directory "{basepath}": {fullpath}'
        )
    return fullpath


def get_splunk_host_info() -> Tuple:
    """Get splunk host info.

    Returns:
        Tuple of (server_name, host_name).
    """

    server_name = get_conf_key_value("server", "general", "serverName")
    host_name = socket.gethostname()
    return server_name, host_name


def get_splunk_bin() -> str:
    """Get absolute path of splunk CLI.

    Returns:
        Absolute path of splunk CLI.
    """

    if os.name == "nt":
        splunk_bin = "splunk.exe"
    else:
        splunk_bin = "splunk"
    return make_splunkhome_path(("bin", splunk_bin))


def get_splunkd_access_info() -> Tuple[str, str, int]:
    """Get splunkd server access info.

    Returns:
        Tuple of (scheme, host, port).
    """

    if get_conf_key_value("server", "sslConfig", "enableSplunkdSSL") == "true":
        scheme = "https"
    else:
        scheme = "http"

    host_port = get_conf_key_value("web", "settings", "mgmtHostPort")
    host_port = host_port.strip()
    host_port_split_parts = host_port.split(":")
    host = ":".join(host_port_split_parts[:-1])
    port = int(host_port_split_parts[-1])

    if "SPLUNK_BINDIP" in os.environ:
        bindip = os.environ["SPLUNK_BINDIP"]
        port_idx = bindip.rfind(":")
        host = bindip[:port_idx] if port_idx > 0 else bindip

    return scheme, host, port


def get_splunkd_uri() -> str:
    """Get splunkd uri.

    Returns:
        Splunkd uri.
    """

    if os.environ.get("SPLUNKD_URI"):
        return os.environ["SPLUNKD_URI"]

    scheme, host, port = get_splunkd_access_info()
    return f"{scheme}://{host}:{port}"


def get_conf_key_value(conf_name: str, stanza: str, key: str) -> Union[str, List, dict]:
    """Get value of `key` of `stanza` in `conf_name`.

    Arguments:
        conf_name: Config file.
        stanza: Stanza name.
        key: Key name.

    Returns:
        Config value.

    Raises:
        KeyError: If `stanza` or `key` doesn't exist.
    """

    stanzas = get_conf_stanzas(conf_name)
    return stanzas[stanza][key]


def get_conf_stanza(conf_name: str, stanza: str) -> dict:
    """Get `stanza` in `conf_name`.

    Arguments:
        conf_name: Config file.
        stanza: Stanza name.

    Returns:
        Config stanza.

    Raises:
         KeyError: If stanza doesn't exist.
    """

    stanzas = get_conf_stanzas(conf_name)
    return stanzas[stanza]


def get_conf_stanzas(conf_name: str) -> dict:
    """Get stanzas of `conf_name`

    Arguments:
        conf_name: Config file.

    Returns:
        Config stanzas.

    Examples:
       >>> stanzas = get_conf_stanzas('server')
       >>> return: {'serverName': 'testServer', 'sessionTimeout': '1h', ...}
    """

    if conf_name.endswith(".conf"):
        conf_name = conf_name[:-5]

    # TODO: dynamically calculate SPLUNK_HOME
    btool_cli = [
        op.join(os.environ["SPLUNK_HOME"], "bin", "splunk"),
        "cmd",
        "btool",
        conf_name,
        "list",
    ]
    p = subprocess.Popen(  # nosemgrep: python.lang.security.audit.dangerous-subprocess-use.dangerous-subprocess-use
        btool_cli, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    out, _ = p.communicate()

    if isinstance(out, bytes):
        out = out.decode()

    parser = ConfigParser(**{"strict": False})
    parser.optionxform = str
    parser.readfp(StringIO(out))

    out = {}
    for section in parser.sections():
        out[section] = {item[0]: item[1] for item in parser.items(section, raw=True)}
    return out
