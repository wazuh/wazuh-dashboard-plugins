import logging
import sys
from urllib.parse import urlencode
from http import HTTPStatus
from typing import Dict

import requests

from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_assist', 'bin']))
from assist.util import append_lib_to_pythonpath

append_lib_to_pythonpath()

from assist import constants, secret_ids
from assist.clients.secrets import SplunkSecretsClient
from assist.splunkrest.jwt import encode_jwt, CLOUD_CLAIM_TENANT
from assist.serverinfo import SupervisorHttp, load_supervisor_http
from assist.splunkrest.base_handler import BaseRestHandler, HttpResponse, HttpResult

TENANT_ID_SYSTEM = 'system'
X_REQUEST_ID     = 'X-Request-Id'

_CLOUD_PROXY_PATH_PREFIX = 'v1/cloud'


def handle(log: logging.Logger, method: str, path_info: str, query: Dict, body: bytes, supervisor: SupervisorHttp, tenant_id: str) -> HttpResponse:

    if not supervisor.is_running():
        message = "Cloud request failed, supervisor is not running"
        log.info(message)
        return HttpResponse(HTTPStatus.BAD_GATEWAY, HttpResult.ERROR, {}, {"message": message})

    qs = urlencode(query)
    cloud_url = f'https://{supervisor.host}:{supervisor.port}/{_CLOUD_PROXY_PATH_PREFIX}/{path_info}'
    bearer_token = encode_jwt(log, supervisor.shared_secret, {CLOUD_CLAIM_TENANT: tenant_id})

    log.info("Cloud request started, %s url=%s", method, cloud_url)

    if qs:
        cloud_url = f'{cloud_url}?{qs}'

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {bearer_token}'
    }

    with supervisor.temp_ca_file() as file_name:
        r = requests.request(method, cloud_url, headers=headers, verify=file_name, data=body)
        body = {}
        result = HttpResult.OK

        log.info("cloud request complete, status_code=%s, body=%s, headers=%s", r.status_code, r.content, r.headers)

        if 200 <= r.status_code < 300:
            body = r.json()

        return HttpResponse(r.status_code, result, {X_REQUEST_ID: r.headers.get(X_REQUEST_ID)}, body)

class PackageProxyHandler(BaseRestHandler, PersistentServerConnectionApplication):

    def handleStream(self, handle, in_bytes):
        pass

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def _common(self, request, http_method: str):
        self.LOGGER.info("request=%s", request)
        path_info = request.get('path_info')
        query = request.get('query')
        supervisor = load_supervisor_http(self.LOGGER)

        user_token = request['session']['authtoken']
        s = SplunkSecretsClient(constants.APP_NAME, self.LOGGER)
        tenant_id = s.fetch_sensitive_data(user_token, secret_ids.TENANT_ID)

        body = None
        if constants.REQUEST_KEY_PAYLOAD in request:
            body = request[constants.REQUEST_KEY_PAYLOAD].encode(constants.CHARSET_UTF8)

        return handle(self.LOGGER, http_method, path_info, query, body, supervisor, tenant_id)

    def get(self, request) -> HttpResponse :
        return self._common(request, 'GET')

    def post(self, request) -> HttpResponse:
        return self._common(request, 'POST')

    def put(self, request) -> HttpResponse:
        return self._common(request, 'PUT')

    def delete(self, request) -> HttpResponse:
        return self._common(request, 'DELETE')

    def options(self, request) -> HttpResponse:
        return self._common(request, 'OPTIONS')




