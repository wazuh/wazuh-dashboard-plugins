import logging
import uuid

from assist.util import append_lib_to_pythonpath

append_lib_to_pythonpath()

from assist.clients.config import SplunkNodeConfigClient
from assist.clients.secrets import SplunkSecretsClient
from assist.instance_id import ensure_instance_id
from assist.serverinfo import is_search_head, is_management_port_enabled
from assist.logging import setup_logging, logger_name
from assist import constants, secret_ids
from assist.modular_input import BaseModularInput


def _exec(session_key: str, config_client: SplunkNodeConfigClient, log: logging.Logger) -> str:
    instance_id = str(uuid.uuid4())
    node_instance_id = ensure_instance_id(session_key, instance_id, config_client, log)
    node_config = config_client.load_config()
    log.debug("Current instance id, instance_id=%s", node_instance_id)
    return node_instance_id


def should_run(log: logging.Logger, session_key: str):
    if not is_management_port_enabled(log):
        return False

    sh = is_search_head(log, session_key)
    log.debug("should run test, sh=%s", sh)
    return sh


class BeamInstanceIdModularInput(BaseModularInput):
    """ Main entry path for launching the Spacebridge Application
    Modular Input
    Arguments:
        modular_input {[type]} -- [description]
    """

    title = 'Splunk Assist Instance Identifier'
    description = 'Assigns a random identifier to each Beam node'
    app = constants.APP_NAME
    name = 'Beam'
    logger: logging.Logger = setup_logging(name=logger_name(__file__))

    def __init__(self):
        super().__init__()
        self.secrets_client = SplunkSecretsClient(constants.APP_NAME, self.logger)
        self.config_client = SplunkNodeConfigClient(self.logger)

    def extra_arguments(self):
        return [
        ]

    def do_test(self):
        is_cpt = should_run(self.logger, self.session_key)
        config = self.config_client.load_config()
        instance_id = config.instance_id

        self.logger.info("instance_id status, is_captain=%s, instance_id=%s", is_cpt, instance_id)

    def do_run(self, input_config):
        if not should_run(self.logger, self.session_key):
            return

        instance_id = _exec(self.session_key, self.config_client, self.logger)
        self.logger.debug("instance_id status, instance_id=%s", instance_id)



if __name__ == '__main__':
    worker = BeamInstanceIdModularInput()
    worker.execute()
