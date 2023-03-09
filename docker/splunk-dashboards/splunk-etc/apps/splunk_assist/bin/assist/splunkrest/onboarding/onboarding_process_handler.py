import json
import logging
import os
import subprocess
import sys
from http import HTTPStatus
from typing import Dict, Optional

from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_assist', 'bin']))

from assist.util import append_lib_to_pythonpath
append_lib_to_pythonpath()

from assist.clients.config import load_config_setting
from assist.logging import setup_logging, logger_name, LogOutput, log_process_output
from assist import constants
from assist.supervisor.supervisor_cmd import OnboardingSecrets, OnboardCmd
from assist.splunkrest.onboarding.data import TenantStatus
from assist.supervisor.context import build_onboarding_secrets, build_onboarding_cmd
from assist.serverinfo import load_proxy_settings, \
    fetch_active_licenses, get_telemetry_deployment_id, environment_for_subprocess, fetch_server_info
from assist.splunkrest.base_handler import BaseRestHandler, HttpResponse, HttpResult
from assist.serverinfo import is_assist_enabled, is_search_head

_RETURNCODE_NOT_FOUND = 2
_RETURNCODE_THROTTLED = 3
_RETURNCODE_CONFLICT = 4
_RETURNCODE_UNAUTHORIZED = 5

def _handle_subprocess_output(p: subprocess.CompletedProcess) -> HttpResponse:
    http_status = HTTPStatus.ACCEPTED
    status_result = TenantStatus.CREATING

    if p.returncode != 0:
        http_status = HTTPStatus.INTERNAL_SERVER_ERROR
        status_result = TenantStatus.CREATE_FAILED

        if p.returncode == _RETURNCODE_NOT_FOUND:
            http_status = HTTPStatus.NOT_FOUND
        elif p.returncode == _RETURNCODE_THROTTLED:
            http_status = HTTPStatus.TOO_MANY_REQUESTS
        elif p.returncode == _RETURNCODE_CONFLICT:
            http_status = HTTPStatus.CONFLICT
        elif p.returncode == _RETURNCODE_UNAUTHORIZED:
            http_status = HTTPStatus.UNAUTHORIZED

    return HttpResponse(http_status, HttpResult.OK, {}, {"status": str(status_result)})

def _run_cmd(log: logging.Logger, cmd: OnboardCmd, secrets: OnboardingSecrets, env: Dict) -> subprocess.CompletedProcess:
    exec_cmd = cmd.to_args()
    log.info("Onboarding command=%s", exec_cmd)
    input = json.dumps(secrets.to_json()).encode(constants.CHARSET_UTF8)
    p = subprocess.run(exec_cmd, input=input, capture_output=True, env=env, timeout=constants.PROCESS_TIMEOUT_SECONDS)
    log_process_output(log, p.stderr)
    return p

def _resolve_license_id(log: logging.Logger, session_key: str, input_license_id: str) -> Optional[str]:
    if input_license_id:
        log.info('Onboarding using supplied license_id=%s', input_license_id)
        return input_license_id

    active_licenses = fetch_active_licenses(log, session_key)

    log.info("Onboarding active_licenses=%s", active_licenses)

    if len(active_licenses) == 0:
        log.info('Onboarding process cannot continue, no valid licenses')
        return

    return active_licenses[0]

def should_run(log: logging.Logger, session_key: str):
    sud = is_assist_enabled(log, session_key)
    sh = is_search_head(log, session_key)
    log.debug("onboading should run , sh=%s, sud=%s", sh, sud)
    return sh and sud

def _handle_onboarding(log: logging.Logger, session_key: str, registration_code: str, deployment_id: str, license_id: Optional[str]) -> HttpResponse:
    license_id = _resolve_license_id(log, session_key, license_id)

    if not license_id:
        return HttpResponse(HTTPStatus.FORBIDDEN, HttpResult.ERROR, {}, {'message': 'no valid license'})

    secrets = build_onboarding_secrets(log, session_key, license_id,
                                       registration_code, deployment_id)

    log.info("Onboarding secrets=%s", secrets.to_json().keys())

    env = environment_for_subprocess(log)
    cmd = build_onboarding_cmd(log, session_key)

    p = _run_cmd(log, cmd, secrets, env)

    log.info("Onboarding command, return_code=%s", p.returncode)
    return _handle_subprocess_output(p)


class OnboardingProcessHandler(BaseRestHandler, PersistentServerConnectionApplication):
    LOGGER = setup_logging(name=logger_name(__file__), output=LogOutput.FILE)

    def handleStream(self, handle, in_bytes):
        pass

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def post(self, request) -> HttpResponse :
        user_token = request['session']['authtoken']
        if not should_run(self.LOGGER, user_token):
            self.LOGGER.debug("Onboarding not supported on this node")
            return HttpResponse(HTTPStatus.BAD_REQUEST, HttpResult.ERROR, {}, {"message":"Onboarding not supported on this node"})

        self.LOGGER.info('Onboarding process started')

        body = json.loads(request[constants.REQUEST_KEY_PAYLOAD])


        license_id = body.get(constants.LICENSE_ID)

        if constants.ONBOARDING_FIELD_CODE not in body:
            return HttpResponse(HTTPStatus.BAD_REQUEST, HttpResult.ERROR, {}, {"message":"code missing"})

        registration_code = body[constants.ONBOARDING_FIELD_CODE]
        supervisor_id = load_config_setting(self.LOGGER, constants.CONF_ASSIST, constants.STANZA_METADATA,
                                            constants.CONFIG_INSTANCE_ID)

        return _handle_onboarding(self.LOGGER, user_token, registration_code, supervisor_id, license_id)

