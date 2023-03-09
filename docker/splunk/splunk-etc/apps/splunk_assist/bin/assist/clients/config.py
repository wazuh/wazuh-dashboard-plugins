import dataclasses
import logging

from splunk import rest
from assist import constants
from splunk.clilib import cli_common as cli

_METADATA_STANZA = 'metadata'
_INSTANCE_ID = 'instance_id'

@dataclasses.dataclass(init=False)
class NodeConfig:
    instance_id: str


def update_config_setting(log: logging.Logger, session_key: str, file: str, stanza: str, key: str, value: str):
    update_url = f'{rest.makeSplunkdUri()}/servicesNS/nobody/{constants.APP_NAME}/configs/conf-{file}/{stanza}'
    return _set_app_config(log, session_key, update_url, key, value)


def _set_app_config(log: logging.Logger, session_token: str, url, key, value):

    log.info("Updating local node config, key=%s, value=%s", key, value)

    data = {key: value}

    rest.simpleRequest(url,
                       sessionKey=session_token,
                       postargs=data,
                       method='POST',
                       raiseAllErrors=True)


def load_config_setting(log: logging.Logger, conf_file, conf_stanza, conf_name) -> str:
    conf = cli.getAppConf(conf_file, constants.APP_NAME)
    setting_value = conf.get(conf_stanza, {})\
        .get(conf_name)
    return setting_value


class SplunkNodeConfigClient:
    update_url = f'{rest.makeSplunkdUri()}/servicesNS/nobody/{constants.APP_NAME}/configs/conf-{constants.CONF_ASSIST}'

    log: logging.Logger

    def __init__(self, log: logging.Logger):
        self.log = log

    def set_instance_id(self, session_token, value):
        stanza_url = f'{self.update_url}/{_METADATA_STANZA}'
        return _set_app_config(self.log, session_token, stanza_url, _INSTANCE_ID, value)

    def load_config(self) -> NodeConfig:
        conf = cli.getMergedConf(constants.CONF_ASSIST)
        parsed = NodeConfig()
        parsed.instance_id = conf.get(_METADATA_STANZA, {})\
                                 .get(_INSTANCE_ID)
        return parsed
