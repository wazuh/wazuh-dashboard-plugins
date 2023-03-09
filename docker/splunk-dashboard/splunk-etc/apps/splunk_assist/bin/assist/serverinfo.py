import base64
import enum
import functools
import hashlib
import json
import logging
import os
import tempfile
from dataclasses import dataclass
from typing import List, Dict, Optional, IO

import requests
import splunk
from assist import secret_ids, constants
from assist.clients.config import load_config_setting
from assist.clients.secrets import SplunkSecretsClient
from assist.context import Context
from assist.util import epoch_minutes
from httplib2 import ServerNotFoundError
from splunk import rest
from splunk.clilib import cli_common as cli
from splunk.util import normalizeBoolean

_CLUSTER_MODE_MASTER = 'master'
_CLUSTER_MODE_DISABLED = 'disabled'
_CLUSTER_MODE_SEARCHHEAD = 'searchhead'
_ROLE_KV_STORE = 'kv_store'
_ROLE_SEARCH_PEER = 'search_peer'
_ROLE_SEARCH_HEAD = 'search_head'
_ROLE_SHC_DEPLOYER = 'shc_deployer'
_ROLE_SHC_MEMBER = 'shc_member'
_ROLE_SHC_CAPTAIN = 'shc_captain'
_ROLE_LICENSE_MANAGER = 'license_manager'
_ROLE_LICENSE_MASTER = 'license_master'
_ROLE_CLUSTER_MANAGER = 'cluster_manager'
_ROLE_CLUSTER_MASTER = 'cluster_master'
_ROLE_DEPLOYMENT_SERVER = 'deployment_server'

_ACCEPTED_CLUSTER_MODES = [_CLUSTER_MODE_DISABLED, _CLUSTER_MODE_MASTER, _CLUSTER_MODE_SEARCHHEAD]
_ACCEPTED_SERVER_ROLES = [_ROLE_SEARCH_HEAD, _ROLE_KV_STORE, _ROLE_SHC_DEPLOYER, _ROLE_LICENSE_MANAGER, _ROLE_LICENSE_MASTER, _ROLE_CLUSTER_MANAGER, _ROLE_CLUSTER_MASTER, _ROLE_DEPLOYMENT_SERVER]

_SERVER_ROLES_SHC = [_ROLE_SHC_MEMBER, _ROLE_SHC_CAPTAIN]
_LOCALHOST='127.0.0.1'

_LICENSE_FIELD_KEYS = 'license_keys'
_LICENSE_FIELD_GUID = 'guid'
_LICENSE_STATUS_VALID = 'VALID'


class _SupervisorCertificate:
    ca: bytes
    file_name: Optional[str]

    def __init__(self, ca: bytes):
        self.ca = ca

    def __enter__(self) -> str:
        # I didn't want to do this, but requests requires that the CA be passed as a file path :(
        # Because of windows, the file has to be closed between writing the certificate and using it elsewhere.
        # Using __enter__ and __exit_ ensures that the file gets cleaned up after use.
        f = tempfile.NamedTemporaryFile(suffix=".pem", delete=False)
        self.file_name = f.name

        f.write(self.ca)
        f.flush()
        f.close()
        return f.name

    def __exit__(self, exc_type, exc_val, exc_tb):
        os.remove(self.file_name)

@dataclass
class SupervisorHttp:
    port_raw: str
    ca_raw: str
    shared_secret: bytes

    @property
    def port(self):
        if self.port_raw == constants.CONFIG_VALUE_UNDEFINED:
            return None

        parsed = int(self.port_raw)
        return parsed

    @property
    def ca(self):
        if self.ca_raw == constants.CONFIG_VALUE_UNDEFINED:
            return None

        decoded = base64.b64decode(self.ca_raw)
        return decoded

    def is_running(self):
        return self.port and self.ca

    def temp_ca_file(self) -> _SupervisorCertificate:
        return _SupervisorCertificate(self.ca)

    @property
    def host(self):
        return _LOCALHOST


def load_proxy_settings(log: logging.Logger) -> Dict:
    proxy_settings = cli.getMergedConf(constants.CONF_SERVER).get(constants.STANZA_PROXYCONFIG, {})

    if 'http_proxy' in proxy_settings and 'https_proxy' not in proxy_settings:
        proxy_settings['https_proxy'] = proxy_settings['http_proxy']

    log.debug("Splunk proxy settings, config=%s", proxy_settings)

    return proxy_settings


def load_supervisor_http(log: logging.Logger) -> SupervisorHttp:
    local_port = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_SUPERVISOR,
                                     constants.CONFIG_LOCAL_PORT)
    ca_cert = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_SUPERVISOR,
                                  constants.CONFIG_CA_CERT)
    shared_secret = shared_http_secret(log)

    return SupervisorHttp(local_port, ca_cert, shared_secret)

def shared_http_secret(log: logging.Logger) -> bytes:
    # this setting has restricted access on the file system
    # and it's consistent over time so it's a good base for the secret
    base = cli.getMergedConf(constants.CONF_SERVER)[constants.STANZA_GENERAL][constants.CONFIG_PASS4SYMMKEY]
    d = hashlib.sha256(base.encode(constants.CHARSET_UTF8))
    b = d.digest()
    return b


def load_https_ca_b64(log: logging.Logger) -> str:
    b = load_https_ca(log)
    return base64.b64encode(b).decode(constants.CHARSET_UTF8)

def load_https_ca(log: logging.Logger) -> bytes:
    ca_file = cli.getMergedConf(constants.CONF_SERVER)[constants.STANZA_SSLCONFIG][constants.CONFIG_CACERTFILE]
    with open(os.path.expandvars(ca_file), 'rb') as f:
        content = f.read()
        return content


def shared_http_secret_b64(log: logging.Logger) -> str:
    b = shared_http_secret(log)
    return base64.b64encode(b).decode(constants.CHARSET_UTF8)


def is_search_head(log: logging.Logger, session_key: str) -> bool:
    try:
        server_roles = get_server_roles(log, session_key)
        cluster_mode = get_cluster_mode(log, session_key)
    except (ServerNotFoundError, splunk.SplunkdConnectionException) as e:
        log.info("Search head query failed, error=%s", str(e))
        return False

    cluster_test = cluster_mode in _ACCEPTED_CLUSTER_MODES

    if not cluster_test:
        return False

    if _has_role(_SERVER_ROLES_SHC, server_roles):
        return False

    if _has_role(_ACCEPTED_SERVER_ROLES, server_roles):
        return True

    return False

def fetch_server_info(log: logging.Logger, session_key, filter_keys=None):
    """
    Return server info
    https://docs.splunk.com/Documentation/Splunk/8.2.4/RESTREF/RESTintrospect#server.2Finfo
    :param log:
    :param filter_keys:
    :param session_key:
    :return:
    """
    request_url = f'{rest.makeSplunkdUri()}/services/server/info'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    info = json.loads(content)
    server_info = info['entry'][0]['content']

    if filter_keys is not None:
        server_info = {k: server_info[k] for k in filter_keys if k in server_info}

    log.info("Server info fetched, filter_keys=%s", filter_keys)
    return server_info


def is_management_port_enabled(log: logging.Logger) -> bool:
    result = cli.getMergedConf(constants.CONF_SERVER).get(constants.STANZA_HTTPSERVER, {}).get(constants.CONFIG_DISABLE_DEFAULT_PORT, False)
    parsed = normalizeBoolean(result)
    log.debug("Management port query result=%s", parsed)
    return parsed != True


def fetch_server_labels(log: logging.Logger, session_key: str):
    _RELEVANT_KEYS = ['version', 'os_name', 'fips_mode', 'cpu_arch']
    return fetch_server_info(log, session_key, _RELEVANT_KEYS)


def get_server_roles(log: logging.Logger, session_key) -> List[str]:
    """
    Return server-roles
    https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTsystem#server.2Froles
    :param session_key:
    :return:
    """
    request_url = f'{rest.makeSplunkdUri()}/services/server/roles'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    info = json.loads(content)
    roles = info['entry'][0]['content']['role_list']
    log.debug("Fetched server roles, roles=%s", roles)
    return roles


def get_cluster_mode(log: logging.Logger, session_key):
    """
    Return the cluster mode
    https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTcluster#cluster.2Fconfig

    Valid values: (master | slave | searchhead | disabled) Defaults to disabled.
    Sets operational mode for this cluster node. Only one master may exist per cluster.

    :param session_key:
    :return: mode: (master | slave | searchhead | disabled | manager | peer)
    """
    request_url = f'{rest.makeSplunkdUri()}/services/cluster/config'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    config = json.loads(content)
    mode = config['entry'][0]['content']['mode']
    log.debug("Fetched cluster mode, mode=%s", mode)
    return mode


def get_telemetry_sud_optin(log: logging.Logger, session_key: str):
    """
    https://localhost:8089/services/properties/telemetry/general/sendSupportUsage
    :param log:
    :param session_key:
    :return:
    """
    rest_uri = rest.makeSplunkdUri()
    support_usage_uri = f"{rest_uri}services/properties/telemetry/general/sendSupportUsage"

    _, content = rest.simpleRequest(
        support_usage_uri,
        sessionKey=session_key,
        method='GET',
        raiseAllErrors=True
    )

    sud_value = content.decode('utf8')

    log.debug("Telemetry SUD opt-in status fetched, status=%s", sud_value)

    return normalizeBoolean(sud_value) == True


def get_telemetry_deployment_id(log: logging.Logger, session_key: str):
    """
    https://localhost:8089/services/properties/telemetry/general/deploymentID
    :param c:
    :param session_key:
    :return:
    """
    rest_uri = rest.makeSplunkdUri()
    support_usage_uri = f"{rest_uri}services/properties/telemetry/general/deploymentID"

    _, content = rest.simpleRequest(
        support_usage_uri,
        sessionKey=session_key,
        method='GET',
        raiseAllErrors=True
    )

    deployment_id = content.decode('utf8')

    log.info("Telemetry deploymentID value=%s", deployment_id)
    return deployment_id


def _has_role(reference_role_list, current_server_roles):
    return len([role for role in reference_role_list if role in current_server_roles]) > 0


def is_fips_enabled(log: logging.Logger, session_key: str) -> bool:
    server_labels = fetch_server_labels(log, session_key)
    fips_mode = server_labels.get('fips_mode')
    log.info("Fips mode test, result=%s", fips_mode)
    return fips_mode


class OptinResult(enum.Enum):
    UNKNOWN = 'unknown'
    ENABLED = 'enabled'
    DISABLED = 'disabled'
    PENDING = 'pending'

    def __str__(self):
        return self.value

    def is_enabled(self):
        return self == self.ENABLED


def is_assist_optin(log: logging.Logger, session_key: str, s: SplunkSecretsClient) -> OptinResult:
    """
    Checks to see if Assist has been through the opt-in
    process.
    :param log:
    :param s:
    :param session_key:
    :return:
    """
    try:
        private_key = s.fetch_sensitive_data(session_key, secret_ids.PRIVATE_KEY)
        private_key_id = s.fetch_sensitive_data(session_key, secret_ids.PRIVATE_KEY_ID)
        tenant = s.fetch_sensitive_data(session_key, secret_ids.TENANT_ID)
        service_principal_id = s.fetch_sensitive_data(session_key, secret_ids.SERVICE_PRINCIPAL_ID)
        supervisor_group_id = s.fetch_sensitive_data(session_key, secret_ids.SUPERVISOR_GROUP_ID)
    except splunk.ResourceNotFound:
        return OptinResult.DISABLED

    optin = True

    for item in [private_key, private_key_id, tenant, service_principal_id, supervisor_group_id]:
        optin = optin and (len(item) > 0)

    if optin:
        return OptinResult.ENABLED
    else:
        return OptinResult.DISABLED


def is_assist_enabled(log: logging.Logger, session_key: str) -> bool:
    """
    Checks to see if Splunk telemetry is enabled
    :param log:
    :param session_key:
    :return:
    """
    try:
        telemetry_sud_optin = get_telemetry_sud_optin(log, session_key)
    except (ServerNotFoundError, splunk.SplunkdConnectionException) as e:
        log.info("Telemetry sud optin query failed, error=%s", str(e))
        return False

    return telemetry_sud_optin

def _is_assist_prerequisites_met(c: Context, session_key: str) -> bool:
    """
    :param c:
    :param session_key:
    :param _epoch_minutes: A parameter solely used for facilitating time-based cache expiry
    :return:
    """
    secrets_client = SplunkSecretsClient(constants.APP_NAME, c.log)
    search_head = is_search_head(c.log, session_key)
    encryption_compatible = not is_fips_enabled(c.log, session_key)

    splunk_environment_compatible = (search_head and encryption_compatible)

    assist_enabled = is_assist_enabled(c.log, session_key)
    assist_optin = is_assist_optin(c.log, session_key, secrets_client)

    assist_prerequisites = (assist_enabled and assist_optin)

    current_server_roles = get_server_roles(c.log, session_key)

    c.log.info("Assist prerequisites check, splunk_environment_compatible=%s, assist_optin=%s, roles=%s",
                splunk_environment_compatible, assist_prerequisites, current_server_roles)

    return splunk_environment_compatible and assist_prerequisites


def is_assist_prerequisites_met(c: Context, session_key: str) -> bool:
    """
    Checks that the current splunk node is a search head member,
    that assist has been opted in, and that telemetry is enabled.
    :param c:
    :param session_key:
    :return:
    """
    return _is_assist_prerequisites_met(c, session_key)


@dataclass
class SplunkLicense:
    guid: str
    hash: str


def _parse_license(log: logging.Logger, license: Dict) -> Optional[SplunkLicense]:
    keys = license.get(_LICENSE_FIELD_KEYS, [])
    guids = license.get(_LICENSE_FIELD_GUID, [])
    result = None

    if keys and guids and len(keys) == 1 and len(guids) == 1:
        result = SplunkLicense(guids[0], keys[0])
    else:
        # this _shouldn't_ happen, but you know how that always works out
        log.info("License has non-deterministic identifiers, guid=%s, keys=%s",
            license.get(_LICENSE_FIELD_GUID),
            license.get(_LICENSE_FIELD_KEYS))
    return result

def raw_licenses(log: logging.Logger, session_key: str) -> List[SplunkLicense]:
    """
    Return server info
    https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTintrospect#server.2Finfo
    :param log:
    :param filter_keys:
    :param session_key:
    :return:
    """
    request_url = f'{rest.makeSplunkdUri()}/services/licenser/localslave'
    query_args = {
        'output_mode': 'json',
    }
    _, content = rest.simpleRequest(
        request_url,
        sessionKey=session_key,
        method='GET',
        getargs=query_args,
        raiseAllErrors=True
    )
    info = json.loads(content)
    licenses = [lic['content'] for lic in info.get('entry', []) if 'content' in lic]
    result = []

    for license in licenses:
        splunk_license = _parse_license(log, license)
        if splunk_license:
            result.append(splunk_license)


    log.info("Licenses fetched, count=%s", len(licenses))
    return result

def fetch_active_licenses(log: logging.Logger, session_key: str) -> List[str]:
    server_info = fetch_server_info(log, session_key, filter_keys=['licenseKeys'])
    license_keys = server_info['licenseKeys']
    all_licenses = raw_licenses(log, session_key)

    result = [lic.guid.lower() for lic in all_licenses if lic.hash in license_keys]

    return result

def environment_for_subprocess(log: logging.Logger):
    supervisor_env = os.environ.copy()

    supervisor_env.update(load_proxy_settings(log))

    return supervisor_env


def requests_session(log: logging.Logger) -> requests.Session:
    s = requests.Session()

    proxy_env = load_proxy_settings(log)
    requests_proxy = {
        'https': proxy_env.get('https_proxy'),
        'http': proxy_env.get('http_proxy')
    }
    s.proxies = requests_proxy

    return s
