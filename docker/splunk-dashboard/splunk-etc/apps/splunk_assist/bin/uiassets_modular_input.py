import functools
import logging
import os
import subprocess
import sys

import requests
from splunk.clilib.bundle_paths import make_splunkhome_path
from assist.util import append_lib_to_pythonpath

append_lib_to_pythonpath()

from assist.selfupdate.download import Downloader
from assist.supervisor.context import build_download_cmd_url
from assist.clients.config import load_config_setting, update_config_setting
from assist import constants
from assist.logging import setup_logging, logger_name, LogOutput
from assist.modular_input import BaseModularInput
from assist.serverinfo import is_search_head, is_assist_enabled, requests_session, is_management_port_enabled


def should_run(log: logging.Logger, session_key: str):
    if not is_management_port_enabled(log):
        return False

    sud = is_assist_enabled(log, session_key)
    sh = is_search_head(log, session_key)
    log.debug("should run test, sh=%s, sud=%s", sh, sud)
    return sh and sud

def make_asset_dir():
    asset_root = make_splunkhome_path(['var', constants.APP_NAME, 'ui', 'assets'])
    os.makedirs(asset_root, exist_ok=True)
    return asset_root


def _run(log: logging.Logger, session_key: str, asset_url: str, sig_url: str, session: requests.Session, etag: str, download_root: str):
    download = Downloader(log, asset_url, etag)

    update_required, etag = download.update_required(session)
    log.debug("Supervisor ui update test, etag=%s, result=%s", etag, update_required)

    if update_required:
        log.info("Supervisor update required, etag=%s, url=%s", etag, asset_url)
        cmd = build_download_cmd_url(log, session_key, asset_url, sig_url, download_root)
        local_path = download.run(cmd)
        if local_path:
            update_config_setting(log, session_key, constants.CONF_ASSIST, constants.STANZA_UI,
                                  constants.CONFIG_ASSETS_ROOT, local_path)
            update_config_setting(log, session_key, constants.CONF_ASSIST, constants.STANZA_UI, constants.CONFIG_ETAG, etag)


class AssistAssetsModularInput(BaseModularInput):
    title = 'Splunk Assist Supervisor'
    description = 'Manages and Executes Splunk Assist Packages'
    app = 'Splunk Assist'
    name = 'Splunk Assist'
    logger: logging.Logger = setup_logging(name=logger_name(__file__), output=LogOutput.FILE)

    def extra_arguments(self):
        return [
        ]


    def do_run(self, inputs):
        if not should_run(self.logger, self.session_key):
            self.logger.debug("Assist assets will not be downloaded")
            return

        file_url = load_config_setting(self.logger, constants.CONF_ASSIST, constants.STANZA_UI, constants.CONFIG_ASSETS_URL)
        sig_url = load_config_setting(self.logger, constants.CONF_ASSIST, constants.STANZA_UI, constants.CONFIG_ASSETS_SIG_URL)
        etag = load_config_setting(self.logger, constants.CONF_ASSIST, constants.STANZA_UI, constants.CONFIG_ETAG)

        asset_dir = make_asset_dir()

        session = requests_session(self.logger)

        _run(self.logger, self.session_key, file_url, sig_url, session, etag, asset_dir)



if __name__ == '__main__':
    worker = AssistAssetsModularInput()
    worker.execute()
