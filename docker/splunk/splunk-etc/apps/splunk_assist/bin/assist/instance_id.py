import logging
import uuid
from assist.clients.config import SplunkNodeConfigClient

_DEFAULT_INSTANCE_ID = '_'

def ensure_instance_id(session_key: str, value: str, config_client: SplunkNodeConfigClient, log: logging.Logger):
    node_config = config_client.load_config()
    instance_id = node_config.instance_id
    while instance_id is None or instance_id == _DEFAULT_INSTANCE_ID:
        config_client.set_instance_id(session_key, value)
        node_config = config_client.load_config()
        instance_id = node_config.instance_id
        log.info("Updated instance_id, instance_id=%s", instance_id)

    return instance_id
