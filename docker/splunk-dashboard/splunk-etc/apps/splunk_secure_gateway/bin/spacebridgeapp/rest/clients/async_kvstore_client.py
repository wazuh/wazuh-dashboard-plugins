"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module providing client for making asynchronous get requests to KV Store using Twisted
"""
import json
from http import HTTPStatus

from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.util.config import secure_gateway_config
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, KEY, NOBODY, BATCH_SAVE
from splunk import rest
from spacebridgeapp.rest.clients.async_non_ssl_client import AsyncNonSslClient
import urllib.parse as urllib


# Default Timeout for calls to KVStore
TIMEOUT_SEC = secure_gateway_config.get_async_timeout_secs(default='5')
BATCH_UPLOAD_DOC_LIMIT = 1000


class AsyncKvStoreClient(AsyncNonSslClient):
    """
    Client for handling asynchronous requests to KV Store
    """

    def __init__(self):
        super(AsyncKvStoreClient, self).__init__()

    def async_kvstore_get_request(self, collection, auth_header, key_id=None, owner=NOBODY, params=None,
                                  app=SPACEBRIDGE_APP_NAME):
        """
        Makes a get request to a KV Store collection
        :param collection: KV Store collection name
        :param auth_header: Value for the Authorization header
        :param key_id: collection _key id
        :param owner: KV Store params such as query, sort, etc.
        :param params:
        :param app: app namespace in collection
        :return: results from KV Store
        """
        uri = self.get_kvstore_uri(owner, collection, key_id, app=app)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header, timeout=TIMEOUT_SEC)

    def async_kvstore_post_request(self, collection, data, auth_header, key_id=None, owner=NOBODY, params=None):
        """
        Makes a post request to a KV Store collection
        :param collection: KV Store collection name
        :param data: data to store
        :param auth_header: Value for the Authorization header
        :param key_id: _key of collection row
        :param owner: KV Store params such as query, sort, etc.
        :param params:
        :return: results from KV Store
        """
        uri = self.get_kvstore_uri(owner, collection, key_id)
        return self.async_post_request(uri=uri, data=data, params=params, auth_header=auth_header, timeout=TIMEOUT_SEC)

    async def async_kvstore_post_or_update_request(self, collection, data, auth_header, key_id=None, owner=NOBODY,
                                                   params=None):
        """
        Makes a post/update request to a KV Store collection
        :param collection: KV Store collection name
        :param data: data to store
        :param auth_header: Value for the Authorization header
        :param key_id: _key of collection row
        :param owner: KV Store params such as query, sort, etc.
        :param params:
        :return: results from KV Store
        """
        uri = self.get_kvstore_uri(owner, collection, key_id)
        response = await self.async_post_request(uri=uri, data=data, params=params, auth_header=auth_header,
                                                 timeout=TIMEOUT_SEC)
        if response.code == HTTPStatus.NOT_FOUND and key_id is not None:
            data_dict = json.loads(data)
            # Ensure that key is in post data
            if KEY not in data_dict:
                data_dict[KEY] = key_id
            elif KEY in data_dict and data_dict[KEY] != key_id:
                raise ValueError('key_id parameter and key in post data do not match')

            data = json.dumps(data_dict)
            uri = self.get_kvstore_uri(owner, collection, None)
            response = await self.async_post_request(uri=uri, data=data, params=params, auth_header=auth_header,
                                                     timeout=TIMEOUT_SEC)
        return response

    def async_kvstore_delete_request(self, collection, auth_header, key_id=None, owner=NOBODY, params=None):
        """
        Makes a delete request to a KV Store collection
        :param collection: KV Store collection name
        :param auth_header: Value for the Authorization header
        :param key_id: collection _key id
        :param owner: KV Store params such as query, sort, etc.
        :param params:
        :return: results from KV Store
        """
        uri = self.get_kvstore_uri(owner, collection, key_id)
        return self.async_delete_request(uri=uri, params=params, auth_header=auth_header, timeout=TIMEOUT_SEC)

    async def async_batch_save_request(self, auth_header, collection, entries, owner=NOBODY,
                                       batch_size=BATCH_UPLOAD_DOC_LIMIT):
        """
        Creates or updates multiple entries in a collection using the batch save API.

        :param auth_header: the session token as an authorization header
        :param collection: the name of the KV store collection to update
        :param entries: list of objects to create or update
        :param owner: the namespace of the collection to update

        :param batch_size: the number of documents to be batch uploaded per request.
                           This is checked against the max configured limit set in the
                           limits.conf file.
        :returns a list of the affected document IDs
        """
        if batch_size > BATCH_UPLOAD_DOC_LIMIT:
            raise ValueError('KV store does not allow uploads of over 1000 documents.')
        start_entry = 0
        end_entry = batch_size

        uri = self.get_kvstore_uri(owner, collection, None, batch_save=True)
        affected_ids = []
        while start_entry < len(entries):
            data = json.dumps(entries[start_entry:end_entry])

            batch_upload_response = await self.async_post_request(
                uri=uri, auth_header=auth_header, data=data)

            if batch_upload_response.code != HTTPStatus.OK:
                message = await batch_upload_response.text()
                raise SpacebridgeApiRequestError(
                    'Failed to bulk update collection={} message={} status_code={} but already updated ids={}'.format(
                        collection, message, batch_upload_response.code, affected_ids),
                    status_code=batch_upload_response.code)

            ids_from_this_batch = await batch_upload_response.json()
            affected_ids.extend(ids_from_this_batch)

            start_entry += batch_size
            end_entry += batch_size

        return affected_ids

    def get_kvstore_uri(self, owner, collection, key_id, app=SPACEBRIDGE_APP_NAME, batch_save=False):
        """
        Use the Splunk Rest library get URI for KV Store
        :param owner: owner of the KV Store collection. Should generally be 'nobody'
        :param collection: name of KV Store collection
        :param key_id: _key of object in collection
        :param app: app namespace in collection
        :param batch_save: boolean representing if this is a batch post uri
        :return: string representing uri path
        """

        collection = urllib.quote(collection)
        if key_id and batch_save:
            raise ValueError('Cannot call batch save with a specific kvstore key')
        elif key_id:
            url_suffix = '{}/{}'.format(collection, key_id)
        elif batch_save:
            url_suffix = '{}/{}'.format(collection, BATCH_SAVE)
        else:
            url_suffix = collection

        return '{rest_uri}servicesNS/{owner}/{app}/storage/collections/data/{url_suffix}'.format(
            rest_uri=self.get_splunkd_uri(),
            owner=urllib.quote(owner if owner else NOBODY),  # default owner to NOBODY if none specified
            app=app,
            url_suffix=url_suffix
        )

    def get_splunkd_uri(self):
        return rest.makeSplunkdUri()
