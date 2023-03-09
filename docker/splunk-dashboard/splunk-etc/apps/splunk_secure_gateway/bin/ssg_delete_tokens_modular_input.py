"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Modular Input for deleting expired tokens created by Splunk Secure Gateway
"""
import json
import warnings

warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

import sys
from typing import Tuple
import os
from splunk.clilib.bundle_paths import make_splunkhome_path
from spacebridgeapp.util import py23, constants


os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import splunk
import time
from http import HTTPStatus
from spacebridgeapp.util.base_modular_input import BaseModularInput
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.splunk_utils.common import modular_input_should_run
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
from spacebridgeapp.rest.services.splunk_service import get_splunk_auth_type, get_all_secure_gateway_tokens, \
    delete_token_by_id
from spacebridgeapp.util.time_utils import get_current_timestamp
from cloudgateway.private.util.tokens_util import calculate_token_info
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.rest.services.splunk_service import get_all_mobile_users

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + '.log', 'ssg_delete_tokens_modular_input.app')

TIMEOUT_SECONDS = 5


class DeleteTokensModularInput(BaseModularInput):
    title = 'Splunk Secure Gateway Deleting Expired Tokens'
    description = 'Delete expired or invalid tokens created by Secure Gateway from Splunk'
    app = 'Splunk Secure Gateway'
    name = 'splunk_secure_gateway'
    use_kvstore_checkpointer = False
    use_hec_event_writer = False
    logger = LOGGER
    input_config_key = "ssg_delete_tokens_modular_input://default"

    def extra_arguments(self):
        """
        Override extra_arguments list for modular_input scheme
        :return:
        """
        return [
            {
                'name': 'param1',
                'description': 'No params required'
            }
        ]

    def do_run(self, input_config):
        """
        Executes the modular input
        :param input_config:
        :return:
        """
        if not super(DeleteTokensModularInput, self).do_run(input_config):
            return

        if not modular_input_should_run(self.session_key, logger=self.logger):
            self.logger.debug("Modular input will not run on this node.")
            return

        self.logger.info("Running Delete tokens modular input on search captain node")
        delete_tokens_sync = DeleteTokensSync(self.session_key)

        try:
            delete_tokens_sync.run()
        except:
            self.logger.exception("Failure encountered while running Delete Tokens sync")


class DeleteTokensSync(object):

    def __init__(self, session_key):
        """
        Delete Tokens Sync constructor
        :param session_key: session key passed by modular input
        """
        self.session_key = session_key
        self.system_auth_header = SplunkAuthHeader(self.session_key)

    def run(self):
        """
        Attempts to delete tokens that are expired or invalid created by Secure Gateway from Splunk. If the kvstore
        is not yet available, schedules a non-blocking retry attempt in 5 seconds
        """
        LOGGER.info("Attempting Deleting Invalid Tokens")
        try:
            self.sync()
        except splunk.RESTException as e:
            if e.statusCode == HTTPStatus.SERVICE_UNAVAILABLE:
                LOGGER.info("KVStore is not yet setup. Retrying user sync in 5 seconds")
                time.sleep(TIMEOUT_SECONDS)
                self.run()
            else:
                raise e

    def sync(self):
        """
        Cleans up tokens that are slated for deletion and expired tokens
        """

        try:
            self.remove_tokens_slated_for_deletion()
            self.remove_all_expired_tokens()
        except:
            LOGGER.exception("Exception performing DeleteTokensSync")
    
    def remove_tokens_slated_for_deletion(self):
        """
        Deletes all tokens slated for deletion past their deletion expiration
        """

        delete_tokens_kv_store = KvStore(constants.DELETE_TOKENS_COLLECTION_NAME, self.session_key)
        response_header, response_content = delete_tokens_kv_store.get_all_items()
        current_time = get_current_timestamp()
        delete_count = 0
        skip_count = 0
        delete_token_errors = []
        kv_errors = []

        if response_header.status != HTTPStatus.OK:
            LOGGER.error(f"Unable to retrieve any tokens from {constants.DELETE_TOKENS_COLLECTION_NAME}. Status: {response_header.status}, Message: {response_content}")
            return
      
        tokens_to_delete = json.loads(response_content)
        for token in tokens_to_delete:
            if current_time < token['expires_at']:
                skip_count += 1
                continue

            (success, http_status, err) = self.delete_token_from_splunk(token['user'], token['token_id'])            
            if success:
                delete_count += 1
            if err is not None:
                delete_token_errors.append(f"[token_id = {token['token_id']}, error={err}]")

            # Leave token in deletion queue if there was an error and token still exists in Splunk
            if http_status != HTTPStatus.OK and http_status != HTTPStatus.BAD_REQUEST:
                continue

            # Remove token from deletion queue
            delete_response, delete_content = delete_tokens_kv_store.delete_item_by_key(token['_key'])
            if delete_response.status != HTTPStatus.OK:
                kv_errors.append(f"[_key = {token['_key']}, status = {delete_response.status}, msg = {delete_content}]")

        # Summarize results of delete token queue processing
        error_count = len(delete_token_errors)        
        if delete_count > 0 or skip_count > 0 or error_count > 0:
            LOGGER.info(f"Token deletion queue status: {delete_count} deleted, {skip_count} skipped, {error_count} errors")
            if error_count > 0:
                errors_str = "\n".join(delete_token_errors)
                LOGGER.error(f"Failed to delete {error_count} tokens. Details:\n{errors_str}")
        
        kv_error_count = len(kv_errors)
        if kv_error_count > 0:
            errors_str = "\n".join(kv_error_count)
            LOGGER.error(f"Failed to remove {kv_error_count} from kv store. Details:\n{errors_str}")

    def remove_all_expired_tokens(self):
        """
        Deletes all expired ssg tokens
        """

        tokens = get_all_secure_gateway_tokens(self.session_key)
        current_time = get_current_timestamp()
        delete_count = 0
        delete_token_errors = []

        for token in tokens:
            if current_time > token['content']['claims']['exp']:
                (success, _, err) = self.delete_token_from_splunk(token['content']['claims']['sub'], token['name'])
                if success:
                    delete_count += 1
                if err:
                    delete_token_errors.append(f"[token_id = {token['name']}, error = {err}]")
                    
        # Summarize results of token processing
        if delete_count > 0:
            LOGGER.info(f"Deleted {delete_count} expired tokens")
        
        delete_errors_count = len(delete_token_errors)
        if delete_errors_count > 0:
            errors_str = "\n".join(delete_token_errors)
            LOGGER.error(f"Failed to delete {delete_errors_count} tokens. Details:\n{errors_str}")

    def delete_token_from_splunk(self, username, token_id) -> Tuple[bool, int, str]:
        """
        Attempts to delete a token from Splunk

        Returns success, response code and error message if any
        """
        try:
            response = delete_token_by_id(self.session_key, username, token_id)
            if response.status != HTTPStatus.OK:
                return (False, response.status, response.status)
            else:
                return (True, response.status, None)
        except splunk.BadRequest as error:
            return (False, HTTPStatus.BAD_REQUEST, str(error))
        except Exception as error:
            return (False, None, str(error))

if __name__ == "__main__":
    worker = DeleteTokensModularInput()
    worker.execute()
