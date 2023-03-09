"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import splunk
import sys

from spacebridgeapp.util.constants import OR_OPERATOR, AND_OPERATOR, NOT_EQUAL
from spacebridgeapp.util.splunk_utils.statestore import StateStore
import splunk.rest as rest
from spacebridgeapp.util import constants

from spacebridgeapp.logging import setup_logging
logger = setup_logging(constants.SPACEBRIDGE_APP_NAME + '_kvstore_writer.log', 'kvstore_writer.app')


def build_containedin_clause(key, values):
    return {OR_OPERATOR: [{key: value} for value in values]}


def build_not_containedin_clause(key, values):
    return {AND_OPERATOR: [{key: {NOT_EQUAL: value}} for value in values]}


class KVStoreBatchWriter(StateStore):
    """
    Class extending ITSI's KV Store batch writer but customizing it to support injecting our own app name
    """

    def __init__(self, **kwargs):
        super(KVStoreBatchWriter, self).__init__(**kwargs)

    def _set_batch_save_size_limit(self, session_key, host_base_uri=''):
        """
        Fetches the max size per batch save if not already fetched

        @param session_key: splunkd session key
        @type session_key: string
        """
        # Sets static variable from limits conf file if not already set
        if StateStore._max_size_per_batch_save is None:
            resp = get_conf_stanza_single_entry(session_key, 'limits', 'kvstore', 'max_size_per_batch_save_mb',
                                                namespace=self.app)
            StateStore._max_size_per_batch_save = int(resp.get('content', 50)) * 1024 * 1024
        if StateStore._max_documents_per_batch_save is None:
            resp = get_conf_stanza_single_entry(session_key, 'limits', 'kvstore', 'max_documents_per_batch_save',
                                                namespace=self.app)
            StateStore._max_documents_per_batch_save = int(resp.get('content', 1000))


def get_conf_stanza_single_entry(session_key, conf_name, stanza_name, entry_name,
                                 namespace=constants.SPACEBRIDGE_APP_NAME):
    uri = '/servicesNS/nobody/' + namespace + '/properties/' + conf_name + '/' + stanza_name + '/' + entry_name
    response, content = rest.simpleRequest(
        uri,
        method="GET",
        sessionKey=session_key,
        getargs={'output_mode': 'json'},
        raiseAllErrors=False
    )
    return {'response': response, 'content': content}


def retry_until_ready_sync(operation, n=None):
    """
    Do an operation, ideally against kvstore, until it returns a non-503 http status code. All other types of errors
    must be handled by the operation function.
    :param operation: a zero-argument function
    :param n: the number of times to retry, default sys.maxint
    :return: the result of operation, or throws an exception
    """

    if not n:
        n = sys.maxint if sys.version_info < (3,0) else sys.maxsize

    while n > 0:
        try:
            return operation()
        except splunk.RESTException as e:
            if e.statusCode != 503:
                raise e
        n -= 1
