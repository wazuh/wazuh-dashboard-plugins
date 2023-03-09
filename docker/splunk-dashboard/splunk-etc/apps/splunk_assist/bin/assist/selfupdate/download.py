import logging
import subprocess
import sys
from http import HTTPStatus
from typing import Dict, Tuple, Optional

import requests
from assist import constants
from assist.logging import log_process_output
from assist.serverinfo import environment_for_subprocess
from assist.supervisor.supervisor_cmd import DownloadCmd

_HEADER_ETAG = 'etag'

def _test_download_url(log: logging.Logger, url: str, s: requests.Session, headers: Dict) -> Tuple[int, str]:
    res = s.head(url, headers=headers)
    etag = res.headers.get(_HEADER_ETAG)
    log.debug("Download test finished, status_code=%s, etag=%s", res.status_code, etag)
    return res.status_code, etag

class Downloader:
    log :logging.Logger
    url: str
    etag: str


    def __init__(self, log: logging.Logger, url: str, etag: str):
        self.log = log
        self.url = url
        self.etag = etag

    def build_headers(self):
        return {
            'If-None-Match': f'{self.etag}'
        }

    def update_required(self, s: requests.Session) -> Tuple[bool, str]:
        headers = self.build_headers()
        self.log.debug("Download test started, headers=%s", headers)

        try:
            status_code, etag = _test_download_url(self.log, self.url, s, headers)
        except requests.RequestException as e:
            self.log.info("Download test failed to connect, error=%s", str(e))
            return False, self.etag

        update = (status_code == HTTPStatus.OK)
        return update, etag

    def run(self, cmd: DownloadCmd) -> Optional[str]:
        self.log.info("Download command started")
        cmd_env = environment_for_subprocess(self.log)
        p = subprocess.run(cmd.to_args(), capture_output=True, timeout=constants.PROCESS_TIMEOUT_SECONDS, env=cmd_env)
        log_process_output(self.log, p.stderr)

        self.log.info("Download command complete, return_code=%s", p.returncode)
        if p.returncode == constants.PROCESS_RETURNCODE_OK:
            return p.stdout.decode(constants.CHARSET_UTF8)
