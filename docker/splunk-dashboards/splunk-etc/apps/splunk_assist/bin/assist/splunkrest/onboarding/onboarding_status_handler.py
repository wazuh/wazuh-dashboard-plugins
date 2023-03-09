import http

import enum
import logging
import sys
from http import HTTPStatus

import requests
import splunk
from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_assist', 'bin']))

from assist.util import append_lib_to_pythonpath
append_lib_to_pythonpath()

from assist.splunkrest.onboarding.data import TenantStatus
from assist import secret_ids
from assist.splunkrest.jwt import CLOUD_CLAIM_TENANT, encode_jwt
from assist.clients.util import requests_session
from assist.clients.config import load_config_setting
from assist.clients.connectivity import ConnectivityClient
from assist.clients.secrets import SplunkSecretsClient
from assist.constants import APP_NAME, CONFIG_CONNECTIVITY_TEST_URL, STANZA_CLOUD, CONF_ASSIST
from assist.serverinfo import is_assist_enabled, is_assist_optin, is_fips_enabled, SupervisorHttp, \
    load_supervisor_http
from assist.splunkrest.base_handler import BaseRestHandler, HttpResponse, HttpResult

_SUPERVISOR_RESPONSE_STATUS = 'status'


def _perform_connectivity_test(log: logging.Logger, auth_token: str) -> bool:
    url = load_config_setting(log, CONF_ASSIST, STANZA_CLOUD, CONFIG_CONNECTIVITY_TEST_URL)
    c = ConnectivityClient(log, url, requests_session(log))

    with c.call() as result:
        return result

def _fetch_tenant_status(log: logging.Logger, tenant_id: str, supervisor: SupervisorHttp) -> TenantStatus:
    if not supervisor.is_running():
        log.info("Tenant status query failed, supervisor is not running")
        return TenantStatus.UNKNOWN

    bearer_token = encode_jwt(log, supervisor.shared_secret, {CLOUD_CLAIM_TENANT: tenant_id})
    onboarding_url = f'https://{supervisor.host}:{supervisor.port}/v1/onboarding'

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {bearer_token}'
    }

    with supervisor.temp_ca_file() as file_name:
        resp = requests.get(onboarding_url, headers=headers, verify=file_name)

        if resp.status_code != HTTPStatus.OK:
            log.info("Tenant status query failed, supervisor http_status=%s", resp.status_code)
            return TenantStatus.UNKNOWN

        parsed = resp.json()

        if _SUPERVISOR_RESPONSE_STATUS not in parsed:
            log.info("Tenant status query failed, status field missing")
            return TenantStatus.UNKNOWN

        log.info("Tenant status query result, status=%s", parsed[_SUPERVISOR_RESPONSE_STATUS])
        return TenantStatus(parsed[_SUPERVISOR_RESPONSE_STATUS])


def _handle_onboarding_status_request(log: logging.Logger, auth_token: str, tenant_id: str,
                                      secrets: SplunkSecretsClient, supervisor: SupervisorHttp) -> HttpResponse:
    tenant_status = TenantStatus.UNKNOWN

    if tenant_id is not None:

        tenant_status = _fetch_tenant_status(log, tenant_id, supervisor)

    assist_optin = is_assist_optin(log, auth_token, secrets)
    sud_optin = is_assist_enabled(log, auth_token)
    network_connectivity = _perform_connectivity_test(log, auth_token)
    crypto_compatible = not is_fips_enabled(log, auth_token)


    assist_enabled = sud_optin and network_connectivity and assist_optin.is_enabled() and crypto_compatible and tenant_status.is_active()
    return HttpResponse(HTTPStatus.OK, HttpResult.OK, {}, {
        'assist_enabled': assist_enabled,
        'context': {
            'sud_optin': sud_optin,
            'assist_optin': str(assist_optin),
            'network_connectivity': network_connectivity,
            'crypto_compatible': crypto_compatible,
            'tenant_status': str(tenant_status)
        }})


class OnboardingStatusHandler(BaseRestHandler, PersistentServerConnectionApplication):

    def handleStream(self, handle, in_bytes):
        pass

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request) -> HttpResponse :
        self.LOGGER.info('Onboarding status query')
        user_token = request['session']['authtoken']

        secrets = SplunkSecretsClient(APP_NAME, self.LOGGER)
        supervisor = load_supervisor_http(self.LOGGER)

        try:
            tenant_id = secrets.fetch_sensitive_data(user_token, secret_ids.TENANT_ID)
        except splunk.RESTException:
            tenant_id = None

        return _handle_onboarding_status_request(self.LOGGER, user_token, tenant_id, secrets, supervisor)
