# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import absolute_import
import os
import sys
import subprocess
from datetime import datetime
import json
import time
import math
import getpass
import struct
from functools import wraps
from typing import Optional, List, Union, Callable, Type, Any, Dict
from types import SimpleNamespace
from logging import Logger

# local imports
from rapid_diag.serializable import Serializable
from rapid_diag.serializable import JsonObject

# splunk imports
from splunk import entity
from splunk.rest import simpleRequest


BUILD_FORMAT = "%Y-%m-%dT%Hh%Mm%Ss%fus"
IS_LINUX = sys.platform.startswith('linux')
SPLUNK_COM_API = 'https://api.splunk.com'

SERVER_NAME : Optional[str] = None
def get_server_name(session_key : str) -> str:
    global SERVER_NAME # pylint: disable=global-statement
    if SERVER_NAME is not None:
        return SERVER_NAME # type: ignore
    uri = entity.buildEndpoint(['server', 'info'])
    _, body = simpleRequest(uri, method='GET', getargs={'output_mode':'json'}, sessionKey=session_key)
    info = json.loads(body)
    content = info['entry'][0]['content']
    SERVER_NAME = content.get('serverName')
    return SERVER_NAME

def build_rapid_diag_timestamp(when : Optional[datetime] = None) -> str:
    if when is None:
        when = datetime.utcnow()
    return when.strftime(BUILD_FORMAT)

def remove_empty_directories(path : str, remove_root : bool = True) -> None:
    for root, dirs, _ in os.walk(path, topdown=False):
        for name in dirs:
            dir_path = os.path.join(root, name)
            try:
                if time.time() - os.stat(dir_path).st_mtime > 600:
                    os.rmdir(dir_path)
            except EnvironmentError:
                pass

    if remove_root and os.path.exists(path) and len(os.listdir(path)) == 0:
        try:
            os.rmdir(path)
        except EnvironmentError:
            pass

def get_splunkhome_path(parts : List[str]) -> str:
    """
    This method will try to import the `make_splunkhome_path` function.
    """
    try:
        from splunk.clilib.bundle_paths import make_splunkhome_path
        ret : str = make_splunkhome_path(parts)
        return ret
    except ImportError as e:
        raise Exception("Error importing make_splunkhome_path from clilib, splunk version should be 8+") from e

def get_log_files() -> List[str]:
    base_path = get_splunkhome_path(['var', 'log'])
    log_files = []
    for root, _, files in os.walk(base_path):
        for log_file in files:
            if log_file.endswith(".log"):
                # We intentionally do not employ os.path.join() here as we want
                # to generate paths that will work on both Linux and Windows.
                full_path = root + "/" + log_file
                rel_path = full_path[len(base_path)+1:]
                log_files.append(rel_path)
    return sorted(log_files)


def get_conf_stanza(conf_name : str, stanza_name : str) -> Optional[Any]:
    try:
        from splunk.clilib.cli_common import getConfStanza
        ret : Any = getConfStanza(conf_name, stanza_name)
        return ret
    except ImportError:
        return None


def splunk_get_username() -> str:
    return input("Splunk username: ")

def splunk_login(read_token : bool) -> Optional[str]:
    if read_token:
        return getpass.getpass(prompt='Authentication token: ')
    try:
        import splunklib.client as client
        import splunk

        service = client.Service(host=splunk.getDefault('host'),
                            port=splunk.getDefault('port'),
                            scheme=splunk.getDefault('protocol'),
                            username=splunk_get_username(),
                            password=getpass.getpass())
        service.login()
        return str(service.token)

    except Exception: # pylint: disable=broad-except
        return None

def get_app_conf(conf_name : str, app : str, use_btool : bool = True, app_path : Optional[str] = None) -> Dict[str, Any]:
    try:
        from splunk.clilib.cli_common import getAppConf
        ret : Dict[str, Any] = getAppConf(conf_name, app, use_btool, app_path)
        return ret
    except ImportError as e:
        raise Exception("Error importing getAppConf from clilib, splunk version should be 8+") from e


def get_json_validated(json_data : Union[str, bytes]) -> JsonObject:
    try:
        json.loads(json_data, object_hook=Serializable.json_decode)
        return {"valid": True, "reason": None}
    except KeyError as e:
        return {"valid": False, "reason": str(e) + " : Key required"}
    except (ValueError, TypeError, NotImplementedError) as e:
        return {"valid": False, "reason": str(e)}


def is_ptrace_allowed() -> List[Union[bool, str]]:
    if IS_LINUX:
        try:
            command = ['sysctl', '-n', 'kernel.yama.ptrace_scope']
            output = subprocess.check_output(command)
            ptrace_value : str = ""
            if isinstance(output, (bytes)):
                ptrace_value = output.strip().decode("utf-8")
            else:
                ptrace_value = output.strip() # type: ignore
            # make sure ptrace is set to 0 as we want to attach processes to it
            if ptrace_value == '0':
                return [True, ""]
            return [False, "PTRACE is not allowed - cannot collect data. Make sure sysctl settings "
                    "of kernel.yama.ptrace_scope is 0. Current value: %s." % (ptrace_value)]
        except: # pylint: disable=bare-except
            return [True, "Not able to read kernel.yama.ptrace_scope value"]
    return [True, ""]


def bytes_to_str(msg : Union[str, bytes]) -> str:
    """decodes the bytes string to unicode string

    Parameters
    ----------
    msg : [str, bytes]
        data in str or bytes

    Raises
    ------
    UnicodeError
        if data is already decoded

    Returns
    -------
    [str]
        message string
    """
    if isinstance(msg, bytes):
        try:
            return msg.decode()
        except UnicodeError:
            return ""
    return msg


def str_to_bytes(msg : Union[str, bytes]) -> bytes:
    """encodes the bytes string to unicode string

    Parameters
    ----------
    msg : [str, bytes]
        data in str or unicode

    Raises
    ------
    TypeError
        if data is already encoded

    Returns
    -------
    [str]
        byte string
    """
    if isinstance(msg, str):
        try:
            return msg.encode('utf-8')
        except TypeError:
            return "".encode('utf-8')
    return msg


def retry(exception_to_check : Type[BaseException],
          tries : int = 3,
          delay : float = 0.5,
          backoff : int = 2,
          logger : Optional[Logger] = None) -> Any:
    """Retry calling the decorated function using an exponential backoff.

    Parameters
    ----------
    exception_to_check : Exception or tuple
        the exception to check. may be a tuple of exceptions to check
    tries : int, optional
        number of times to try (not retry) before giving up, by default 3
    delay : float, optional
        initial delay between retries in seconds, by default 0.5
    backoff : int, optional
        backoff multiplier e.g. value of 2 will double the delay
        each retry, by default 2
    logger : Logger instance, optional
        logger to use, by default None

    Raises
    ------
    ValueError
        In case of invalid values for tries, delays and backoff.
    """
    if backoff <= 1:
        raise ValueError("backoff must be greater than 1")

    tries = math.floor(tries)
    if tries < 0:
        raise ValueError("tries must be 0 or greater")

    if delay <= 0:
        raise ValueError("delay must be greater than 0")

    def deco_retry(func : Callable) -> Any:
        @wraps(func)
        def func_retry(*args : str, **kwargs : int) -> Any:
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return func(*args, **kwargs)
                except exception_to_check as e:
                    msg = "%s, Retrying in %.1f seconds..." % (str(e), mdelay)
                    if logger:
                        logger.warning(msg)
                    time.sleep(mdelay)
                    mtries -= 1
                    mdelay *= backoff
            return func(*args, **kwargs)
        return func_retry
    return deco_retry

def get_templates_path() -> str:
    """This function for now returns path relative to SPLUNK_HOME.
    Should be moved to conf settings at some point - for now mostly to provide a way to mock in tests.
    """
    return get_splunkhome_path(
    ["etc", "apps", "splunk_rapid_diag", "SampleTasks"])

def get_platform_maxint() -> int:
    """This function returns the maximum int size allowed on the current OS for setting csv field size
    """
    max_bits = struct.Struct('i').size * 8
    platform_c_maxint = 2**(max_bits - 1 ) - 1
    return int(platform_c_maxint)

def generate_splunkcom_payload(data: JsonObject) -> SimpleNamespace:
    """ Generates the payload to send to info_gather"""
    sn_upload = SimpleNamespace()
    sn_upload.upload_user = data['upload_user']
    sn_upload.upload_password = data['upload_password']
    sn_upload.upload_uri = SPLUNK_COM_API
    return sn_upload
