import json
import logging
import sys
from http import HTTPStatus
from typing import Dict
from urllib.parse import urlencode

import requests
import splunk
from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_assist', 'bin']))
from assist.util import append_lib_to_pythonpath

append_lib_to_pythonpath()

from assist import constants, secret_ids
from assist.clients.secrets import SplunkSecretsClient
from assist.serverinfo import load_supervisor_http, SupervisorHttp
from assist.splunkrest.jwt import encode_jwt, PKG_CLAIM_PACKAGE
from assist.splunkrest.base_handler import BaseRestHandler, HttpResponse, HttpResult

_PKG_PROXY_PATH_PREFIX = 'v1/proxy'

def handle(log: logging.Logger, method: str, path_info: str, query: Dict, body: bytes, supervisor: SupervisorHttp) -> HttpResponse:
    parts = path_info.split('/')

    if len(parts) <= 1:
        return HttpResponse(HTTPStatus.BAD_REQUEST, HttpResult.ERROR, {}, {"message": 'invalid package path'})

    pkg_name = parts[0]
    rest = parts[1:]
    package_path = '/'.join(rest)

    if not supervisor.is_running():
        message = "Package request failed, supervisor is not running"
        log.info(message)
        return HttpResponse(HTTPStatus.BAD_GATEWAY, HttpResult.ERROR, {}, {"message": message})

    qs = urlencode(query)
    package_url = f'https://{supervisor.host}:{supervisor.port}/{_PKG_PROXY_PATH_PREFIX}/{pkg_name}/{package_path}'
    bearer_token = encode_jwt(log, supervisor.shared_secret, {PKG_CLAIM_PACKAGE: pkg_name})

    log.info("Package request started, %s url=%s", method, package_url)

    if qs:
        package_url = f'{package_url}?{qs}'

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {bearer_token}'
    }

    with supervisor.temp_ca_file() as file_name:
        r = requests.request(method, package_url, headers=headers, verify=file_name, data=body)
        body = {}
        result = HttpResult.OK

        log.info("Package request complete, status_code=%s, body=%s", r.status_code, r.content)

        if 200 <= r.status_code < 300:
            body = r.json()

        return HttpResponse(r.status_code, result, {}, body)


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

        body = None
        if constants.REQUEST_KEY_PAYLOAD in request:
            body = request[constants.REQUEST_KEY_PAYLOAD].encode(constants.CHARSET_UTF8)

        return handle(self.LOGGER, http_method, path_info, query, body, supervisor)

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

