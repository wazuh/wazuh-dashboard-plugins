import json
import logging
import sys
from http import HTTPStatus

import splunk
from splunk import rest
from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_assist', 'bin']))

from assist.clients.secrets import SplunkSecretsClient
from assist.splunkrest import constants as http_constants
from assist.splunkrest.base_handler import BaseRestHandler, HttpResponse, HttpResult
from assist import secret_ids, constants

SECRET_IDS = 'secret_ids'
__ALLOWED_SECRETS = [secret_ids.SERVICE_PRINCIPAL_ID,
                     secret_ids.TENANT_ID,
                     secret_ids.PRIVATE_KEY,
                     secret_ids.PRIVATE_KEY_ID,
                     secret_ids.SUPERVISOR_GROUP_ID]


def _handle_post(user_token, secrets: dict, client: SplunkSecretsClient, log: logging.Logger):
    log.info('Secret storage request received, ids=%s', [secret_id for (secret_id, _) in secrets.items()])
    for (secret_id, _) in secrets.items():
        if secret_id not in __ALLOWED_SECRETS:
            log.warning("invalid secret name secret_name=%s, allowed_secrets=%s", secret_id, __ALLOWED_SECRETS)
            return HttpResponse(HTTPStatus.BAD_REQUEST, HttpResult.ERROR, {},
                                {http_constants.MESSAGE: "invalid secret"})

    current_secret_id = None
    try:
        for (secret_id, secret_value) in secrets.items():
            current_secret_id = secret_id
            client.upsert_sensitive_data(user_token, secret_id, secret_value)
    except splunk.RESTException as e:
        msg = f'failed to set secret, id={current_secret_id}, error={e}'
        log.warning(msg)
        return HttpResponse(HTTPStatus.INTERNAL_SERVER_ERROR,
                            HttpResult.ERROR,
                            {},
                            {http_constants.MESSAGE: msg})

    return HttpResponse(HTTPStatus.OK, HttpResult.OK, {}, {'ids': [str(k) for k in secrets.keys()]})


def _handle_get(user_token, key_names: list, client: SplunkSecretsClient, log: logging.Logger):
    secrets_dict = dict()
    for name in key_names:
        try:
            value = client.fetch_sensitive_data(user_token, name)
        except splunk.ResourceNotFound:
            err = f"Secret not found, id={name}"
            log.warning(err)
            return HttpResponse(HTTPStatus.NOT_FOUND, HttpResult.ERROR, {}, {http_constants.MESSAGE: err})
        secrets_dict[name] = value

    return HttpResponse(HTTPStatus.OK, HttpResult.OK, {}, {'secrets':secrets_dict})

class SecretsHandler(BaseRestHandler, PersistentServerConnectionApplication):

    def handleStream(self, handle, in_bytes):
        pass

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.secrets_client = SplunkSecretsClient(constants.APP_NAME, self.LOGGER)

    def get(self, request) -> HttpResponse :
        query_params = request.get(http_constants.QUERY)
        user_token = request['session']['authtoken']
        secret_id_query = query_params.get(SECRET_IDS, '').split(',')
        self.LOGGER.info("query for secrets, ids=%s", secret_id_query)
        return _handle_get(user_token, secret_id_query, self.secrets_client, self.LOGGER)

    def post(self, request):
        global __ALLOWED_SECRETS
        self.LOGGER.info('updating secrets')
        user_token = request['session']['authtoken']
        secrets = json.loads(request['payload']).get('secrets', dict())
        return _handle_post(user_token, secrets, self.secrets_client, self.LOGGER)


