import functools
import json
import logging
import sys
from abc import ABC
from http import HTTPStatus
from os import path

from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_assist', 'bin']))
from assist.util import append_lib_to_pythonpath

append_lib_to_pythonpath()

from assist.clients.config import load_config_setting
from assist.logging import setup_logging, logger_name
from assist import constants, secret_ids
from assist.clients.secrets import SplunkSecretsClient
from assist.splunkrest.jwt import encode_jwt, CLOUD_CLAIM_TENANT
from assist.serverinfo import SupervisorHttp, load_supervisor_http
from assist.splunkrest.base_handler import BaseRestHandler, HttpResponse, HttpResult
from assist.splunkrest import constants as http_constants

CONTENT_TYPE_TEXT = 'application/text'

FILE_EXTENSION_CONTENT_TYPE_MAP = {
    http_constants.FILE_EXT_JS: http_constants.CONTENT_TYPE_JAVASCRIPT,
    http_constants.FILE_EXT_JSON: http_constants.CONTENT_TYPE_APPLICATION_JSON,
    http_constants.FILE_EXT_MAP: http_constants.CONTENT_TYPE_APPLICATION_JSON,
    http_constants.FILE_EXT_PNG: http_constants.CONTENT_TYPE_PNG,
    http_constants.FILE_EXT_SVG: http_constants.CONTENT_TYPE_SVG,
    http_constants.FILE_EXP_CSS: http_constants.CONTENT_TYPE_CSS,
    http_constants.FILE_EXT_JPEG: http_constants.CONTENT_TYPE_JPEG,
    http_constants.FILE_EXT_JPG: http_constants.CONTENT_TYPE_JPEG
}

def content_type_from_file(asset_path: str):
    asset_type = http_constants.CONTENT_TYPE_TEXT

    for ext, content_type in FILE_EXTENSION_CONTENT_TYPE_MAP.items():
        if asset_path.endswith(ext):
            asset_type = content_type
            break

    return asset_type


def _is_file(filepath: str):
    return path.isfile(filepath)


@functools.lru_cache()
def _read_file(asset_file: str) -> str:
    with open(asset_file) as asset_file:
        contents = asset_file.read()
        return contents

def handle_get(log: logging.Logger, asset_root: str, asset_path: str) -> HttpResponse:
    if asset_root == constants.CONFIG_VALUE_UNDEFINED:
        return HttpResponse(HTTPStatus.INTERNAL_SERVER_ERROR, HttpResult.ERROR, {}, {'message': f'assets not available'})

    asset_file = f'{asset_root}/{asset_path}'

    if not _is_file(asset_file):
        log.info("Asset not found, file=%s", asset_file)
        return HttpResponse(HTTPStatus.NOT_FOUND, HttpResult.ERROR, {}, {'message':f'not found, file={asset_path}'})

    content_type = content_type_from_file(asset_path)
    contents = _read_file(asset_file)

    return HttpResponse(HTTPStatus.OK, HttpResult.OK, {http_constants.CONTENT_TYPE: content_type}, contents, raw=True)


class UiAssetsHandler(BaseRestHandler, PersistentServerConnectionApplication):
    def handleStream(self, handle, in_bytes):
        pass

    def __init__(self, command_line, command_arg):
        super(PersistentServerConnectionApplication, self).__init__()

    def get(self, request) -> HttpResponse:
        path_info = request.get('path_info')

        asset_root = load_config_setting(self.LOGGER, constants.CONF_ASSIST, constants.STANZA_UI, constants.CONFIG_ASSETS_ROOT)

        return handle_get(self.LOGGER, asset_root, path_info)



