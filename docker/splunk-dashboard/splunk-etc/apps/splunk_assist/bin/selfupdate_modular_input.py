import asyncio
import logging
import os
from typing import Dict

import requests
import splunk.util
from assist.util import append_lib_to_pythonpath
from splunk.clilib.bundle_paths import make_splunkhome_path

append_lib_to_pythonpath()

from assist.supervisor.context import build_download_cmd_pem
from assist import secret_ids
from assist.clients.secrets import SplunkSecretsClient
from assist.clients.config import load_config_setting, update_config_setting
from assist.selfupdate.download import Downloader
from assist.context import Context
from assist import supervisor, constants
from assist.selfupdate.supervisor_meta import load_resolver, SupervisorUpdate
from assist.serverinfo import is_assist_prerequisites_met, environment_for_subprocess, \
    requests_session, is_assist_enabled, is_search_head, is_management_port_enabled
from assist.logging import setup_logging, logger_name, LogOutput
from assist.modular_input import BaseModularInput


def _apply_update(log: logging.Logger, session_key: str, update: SupervisorUpdate, session: requests.Session, etag: str, download_root: str):
    current_etag = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_UPDATES, constants.CONFIG_ETAG)
    download = Downloader(log, update.url, current_etag)


    update_required, etag = download.update_required(session)
    log.debug("Supervisor update test, etag=%s, result=%s", etag, update_required)

    if update_required:
        log.info("Supervisor update required, etag=%s, url=%s", etag, update.url)
        cmd = build_download_cmd_pem(log, update.url, update.signature_pem, download_root)
        local_path = download.run(cmd)
        if local_path:
            update_config_setting(log, session_key, constants.CONF_ASSIST, constants.STANZA_UPDATES, constants.CONFIG_ETAG, etag)
            update_config_setting(log, session_key, constants.CONF_ASSIST, constants.STANZA_SUPERVISOR, constants.CONFIG_LOCAL_PATH, local_path)


def _poll_for_update(log: logging.Logger, session_key: str, tenant_id: str, etag: str, download_root: str):
    query = load_resolver(log, tenant_id)
    session = requests_session(log)

    update = query.find(log, session)
    if update is not None:
        _apply_update(log, session_key, update, session, etag, download_root)


def should_run(log: logging.Logger, session_key: str):
    if not is_management_port_enabled(log):
        return False

    sud = is_assist_enabled(log, session_key)
    sh = is_search_head(log, session_key)
    log.debug("should run test, sh=%s, sud=%s", sh, sud)
    return sh and sud


def make_supervisor_home():
    asset_root = make_splunkhome_path(['var', constants.APP_NAME, 'supervisor', 'updates'])
    os.makedirs(asset_root, exist_ok=True)
    return asset_root

class SplunkAssistSelfUpdate(BaseModularInput):
    title = 'Splunk Assist Self-Update'
    description = 'Detects and Downloads Assist Supervisor Updates'
    app = 'Splunk Assist'
    name = 'Splunk Assist'
    logger: logging.Logger = setup_logging(name=logger_name(__file__), output=LogOutput.FILE)

    def extra_arguments(self):
        return [
        ]


    def do_test(self):
        self.logger.info("Test executed")

    def do_run(self, input_config):
        if not should_run(self.logger, self.session_key):
            self.logger.debug("Assist Self-update will not run")
            return

        s = SplunkSecretsClient(constants.CONF_ASSIST, self.logger)
        tenant_id = None

        try:
            tenant_id = s.fetch_sensitive_data(self.session_key, secret_ids.TENANT_ID)
        except splunk.RESTException:
            self.logger.debug("Tenant id not available")

        supervisor_home = make_supervisor_home()
        etag = load_config_setting(self.logger, constants.CONF_ASSIST, constants.STANZA_UPDATES, constants.CONFIG_ETAG)
        _poll_for_update(self.logger, self.session_key, tenant_id, etag, supervisor_home)


if __name__ == '__main__':
    worker = SplunkAssistSelfUpdate()
    worker.execute()
