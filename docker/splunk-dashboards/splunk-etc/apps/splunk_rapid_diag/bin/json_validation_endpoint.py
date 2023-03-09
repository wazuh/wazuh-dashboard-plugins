# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
import os
import sys
import json
from typing import Optional, Union

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from splunk.persistconn.application import PersistentServerConnectionApplication

# local imports
import logger_manager as log
from splunklib.six.moves.urllib import parse
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload
from rapid_diag.serializable import JsonObject
from rapid_diag.util import get_json_validated
from rapid_diag.collector.trigger import * # pylint: disable=wildcard-import
from rapid_diag.collector import * # pylint: disable=wildcard-import
from rapid_diag import task # pylint: disable=unused-import

_LOGGER = log.setup_logging("json_validation_endpoint")


class JsonValidationEndpoint(PersistentServerConnectionApplication):
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None):
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        return persistent_handler_wrap_handle(self._handle, args)

    def _handle(self, args : JsonObject) -> JsonObject:
        raw_json_data = next((arg[1] for arg in args['query'] if arg[0]=='payload'), '')
        json_data = json.loads(parse.unquote(raw_json_data))
        if 'task' in json_data:
            json_data = json_data['task']
        json_data = json.dumps(json_data)
        is_valid = get_json_validated(json_data)
        return create_rapiddiag_payload(data={"valid": is_valid["valid"], "message": is_valid["reason"]})
