import logging
import sys
from http import HTTPStatus
from typing import List, Optional, Dict
from dataclasses import dataclass

import requests
from assist import constants, secret_ids
from assist.clients.config import load_config_setting
from assist.util import get_platform

_RESPONSE_FIELD_SUPERVISORS='supervisors'
_RESPONSE_FIELD_BINARYURL='binaryUrl'
_RESPONSE_FIELD_SIGNATURE='signature'

@dataclass
class SupervisorUpdate:
    platform: str
    url: str
    signature_pem: str


def _query_supervisor_metadata(log: logging.Logger, s: requests.Session, url: str) -> requests.Response:
    try:
        return s.get(url)
    except requests.RequestException as e:
        log.info("Self update failed, url=%s, error=%s", url, str(e))

def _metadata_from_response(log: logging.Logger, meta: Dict) -> Optional[SupervisorUpdate]:
    platform = get_platform()
    update = None
    if _RESPONSE_FIELD_SUPERVISORS in meta and platform in meta[_RESPONSE_FIELD_SUPERVISORS]:
        log.info("Supervisor metadata found, platform=%s", sys.platform)
        match = meta[_RESPONSE_FIELD_SUPERVISORS][platform]
        update = SupervisorUpdate(platform, match[_RESPONSE_FIELD_BINARYURL], match[_RESPONSE_FIELD_SIGNATURE])
    else:
        log.info("Supervisor metadata missing, platform=%s", platform)

    return update


class UrlResolver:
    tenant_id: str
    supervisor_id: str
    url_templates: List[str]

    def __init__(self, tenant_id: str, supervisor_id: str, urls: List[str]):
        self.tenant_id = tenant_id
        self.supervisor_id = supervisor_id
        self.url_templates = urls

    def _urls(self):
        template_values = {'tenant_id': self.tenant_id, 'supervisor_id': self.supervisor_id}

        return [v.format(**template_values) for v in self.url_templates]

    def find(self, log: logging.Logger, s: requests.Session) -> Optional[SupervisorUpdate]:
        for u in self._urls():
            resp = _query_supervisor_metadata(log, s, u)
            if not resp:
                continue
            log.info("Supervisor metadata query, url=%s, status_code=%s", u, resp.status_code)
            if resp and resp.status_code == HTTPStatus.OK:
                meta = resp.json()
                update = _metadata_from_response(log, meta)
                if update is not None:
                    return update


def load_resolver(log: logging.Logger, tenant_id: str) -> UrlResolver:
    supervisor_id = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_METADATA, constants.CONFIG_INSTANCE_ID)

    global_url = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_UPDATES, constants.CONFIG_GLOBAL_URL)

    urls = [global_url]

    if tenant_id is not None:
        tenant_url = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_UPDATES, constants.CONFIG_TENANT_URL)
        supervisor_url = load_config_setting(log, constants.CONF_ASSIST, constants.STANZA_UPDATES, constants.CONFIG_SUPERVISOR_URL)
        urls = [supervisor_url, tenant_url, global_url]

    return UrlResolver(tenant_id, supervisor_id, urls)
