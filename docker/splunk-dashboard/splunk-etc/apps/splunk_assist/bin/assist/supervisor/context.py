import base64
import genericpath
import logging
import os
import platform
import tempfile

import splunk
from assist import secret_ids, constants
from assist.clients.config import load_config_setting
from assist.clients.secrets import SplunkSecretsClient
from assist.constants import APP_NAME, CONFIG_INSTANCE_ID, STANZA_METADATA, CONF_ASSIST, CONFIG_HEARTBEAT_INTERVAL_SECONDS, \
    STANZA_CLOUD, CONFIG_SCS_ENVIRONMENT
from assist.serverinfo import get_server_roles, fetch_server_labels, get_cluster_mode, shared_http_secret_b64, \
    load_https_ca_b64
from assist.supervisor.supervisor_cmd import DaemonCmd, SupervisorSecrets, OnboardingSecrets, OnboardCmd, DownloadCmd
from assist.util import get_platform
from splunk import rest
from splunk.clilib.bundle_paths import make_splunkhome_path

_BINARY_NAME = 'assistsup'

class SecretError(Exception):
    secret_id: str

    def __init__(self, secret_id: str):
        super().__init__(f'secret not found, secret_id={secret_id}')
        self.secret_id = secret_id

def _splunk_api():
    api = rest.makeSplunkdUri()
    if api.endswith('/'):
        api = api[:-1]

    return api



def _test_supervisory_binary(full_path):
    if not genericpath.isfile(full_path):
        raise RuntimeError(f'assist binary not found, path={full_path}')

    if not _is_executable(full_path):
        raise RuntimeError(f'assist binary not executable, path={full_path}')

    return full_path


def _binary_path_default(log: logging.Logger) -> str:
    os = platform.system().lower()
    leaf_dir = f'{os}_x86_64' # need to figure out how to make this work for ARM at some point

    full_path = make_splunkhome_path(['etc', 'apps', constants.APP_NAME, 'bin', leaf_dir, _BINARY_NAME])
    return full_path


def _binary_path_override(log: logging.Logger, base_path: str) -> str:
    full_path = os.path.join(base_path, _BINARY_NAME)
    return full_path

def binary_path(log: logging.Logger):
    supervisor_path = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_SUPERVISOR,
                                          constants.CONFIG_LOCAL_PATH)

    if supervisor_path == constants.CONFIG_VALUE_UNDEFINED:
        base_path = _binary_path_default(log)
        log.debug("Supervisor binary default, path=%s", base_path)
    else:
        base_path = _binary_path_override(log, supervisor_path)
        log.debug("Supervisor binary override, path=%s", base_path)

    if get_platform() == constants.WINDOWS:
        base_path = f'{base_path}{constants.WINDOWS_EXE}'

    _test_supervisory_binary(base_path)

    return base_path


def package_home():
    package_root = make_splunkhome_path(['var', constants.APP_NAME, 'packages'])
    os.makedirs(package_root, exist_ok=True)
    return package_root


def _is_executable(path):
    executable = os.access(path, os.X_OK)
    return executable


def build_onboarding_cmd(log: logging.Logger, session_key: str) -> OnboardCmd:
    root = binary_path(log)

    api = rest.makeSplunkdUri()

    cmd = OnboardCmd(root, api, APP_NAME)
    return cmd


def build_download_cmd_url(log: logging.Logger, session_key: str,
                       file_url: str, sig_url: str, download_root: str) -> DownloadCmd:
    root = binary_path(log)

    api = _splunk_api()

    cmd = DownloadCmd(root, api, APP_NAME, file_url, download_root, sig_url=sig_url)
    return cmd


def build_download_cmd_pem(log: logging.Logger,
                           file_url: str, sig_pem: str, download_root: str) -> DownloadCmd:
    root = binary_path(log)

    api = _splunk_api()

    sig_pem_b64 = base64.b64encode(sig_pem.encode(constants.CHARSET_UTF8))

    cmd = DownloadCmd(root, api, APP_NAME, file_url, download_root, sig_pem=sig_pem_b64.decode(constants.CHARSET_UTF8))
    return cmd


def build_daemon_cmd(log: logging.Logger, session_key: str, supervisor_home: str) -> DaemonCmd:
    labels = fetch_server_labels(log, session_key)

    root = binary_path(log)

    api = _splunk_api()

    supervisor_id = load_config_setting(log, CONF_ASSIST, STANZA_METADATA, CONFIG_INSTANCE_ID)
    roles = get_server_roles(log, session_key)
    splunk_version = labels['version']
    cluster_mode = get_cluster_mode(log, session_key)
    heartbeat_interval_seconds = int(load_config_setting(log, CONF_ASSIST, STANZA_CLOUD, CONFIG_HEARTBEAT_INTERVAL_SECONDS))

    cmd = DaemonCmd(root, api, APP_NAME, supervisor_id, supervisor_home, roles, splunk_version, cluster_mode, heartbeat_interval_seconds)
    return cmd


def build_onboarding_secrets(log: logging.Logger, session_key: str,
                             license_id: str, registration_code: str, deployment_id: str) -> OnboardingSecrets:
    environment = load_config_setting(log, CONF_ASSIST, STANZA_CLOUD, CONFIG_SCS_ENVIRONMENT)

    splunk_ca_pem = load_https_ca_b64(log)

    secret_values = OnboardingSecrets(deployment_id=deployment_id,
                                      license_id=license_id,
                                      registration_code=registration_code,
                                      splunk_ca_pem=splunk_ca_pem,
                                      splunk_session_token=session_key,
                                      splunk_session_token_type=constants.SESSION_TOKEN_TYPE_SPLUNK,
                                      scs_environment=environment)
    return secret_values



def build_supervisor_secrets(log: logging.Logger, session_key: str) -> SupervisorSecrets:
    sc = SplunkSecretsClient(APP_NAME, log)

    secret_values = {}
    required_secrets = [
        ('tenant_id',                           secret_ids.TENANT_ID),
        ('service_principal_id',                secret_ids.SERVICE_PRINCIPAL_ID),
        ('service_principal_private_key_id',    secret_ids.PRIVATE_KEY_ID),
        ('service_principal_private_key_pem',   secret_ids.PRIVATE_KEY),
        ('supervisor_group_id',                 secret_ids.SUPERVISOR_GROUP_ID)
    ]


    environment = load_config_setting(log, CONF_ASSIST, STANZA_CLOUD, CONFIG_SCS_ENVIRONMENT)

    for (key_name, secret_id) in required_secrets:
        try:
            secret_value = sc.fetch_sensitive_data(session_key, secret_id)
            secret_values[key_name] = secret_value
        except splunk.ResourceNotFound as e:
            log.info("Secret not found, key=%s, cause=%s", secret_id, str(e))
            raise SecretError(secret_id)

    http_shared_secret = shared_http_secret_b64(log)
    splunk_ca_pem = load_https_ca_b64(log)

    secret_values = SupervisorSecrets(session_key,
                                      constants.SESSION_TOKEN_TYPE_SPLUNK,
                                      splunk_ca_pem,
                                      http_shared_secret,
                                      environment,
                                      **secret_values)
    return secret_values
