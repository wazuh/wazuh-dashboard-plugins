"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import json
import time
import splunk
import splunk.rest as rest
from spacebridgeapp.util import py23
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import NOBODY
from spacebridgeapp.util.string_utils import encode_whitespace, append_path_to_uri

import urllib.parse as urllib

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_kvstore_service.log", "kvstore_service")


class KVStoreCollectionAccessObject(object):
    def __init__(self, collection=None, session_key=None, app=constants.SPACEBRIDGE_APP_NAME,
                 owner=NOBODY, timestamp_attribute_name='timestamp', uri=None):
        rest_uri = uri if uri else rest.makeSplunkdUri()
        path = f'servicesNS/{owner}/{app}/storage/collections/data/{collection}'
        self.uri = append_path_to_uri(rest_uri, path)
        self.session_key = session_key
        self.timestamp_attribute_name = timestamp_attribute_name

    def get_collection_keys(self):
        jsonargs = {"fields": "_key"}

        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            getargs=jsonargs,
            method='GET',
            raiseAllErrors=True
        )

    def insert_single_item(self, new_item):
        """
        Insert an item into kvstore.
        :param new_item: a json-able object (such as a dict) indicating the new item
        :return: response, content (attribute "_key" stands for the key id of new item)
        """
        json_args = json.dumps(new_item)
        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            jsonargs=json_args,
            method='POST',
            raiseAllErrors=True
        )

    def insert_single_item_as_json(self, json_args):
        """
        Insert an item into kvstore.
        :param json_args: an already-formed json string, indicating the new item
        :return: response, content (attribute "_key" stands for the key id of new item)
        """
        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            jsonargs=json_args,
            method='POST',
            raiseAllErrors=True
        )

    def insert_multiple_items(self, items):
        """
        Insert a list of items into kvstore.
        :param items: a list of json-able objects (such as a dict) indicating the new item
        :return: response, content (attribute "_key" stands for the key id of new item)
        """
        json_args = json.dumps(items)
        request_url = '{}/{}'.format(self.uri, 'batch_save')
        return rest.simpleRequest(
            request_url,
            sessionKey=self.session_key,
            jsonargs=json_args,
            method='POST',
            raiseAllErrors=True
        )

    def get_item_by_key(self, key):
        """
        Get an item of kvstore.
        :param key: key id in kvstore
        :return: response, content
        """
        key = self.uri_encode(key)
        request_url = '{}/{}'.format(self.uri, key)
        LOGGER.debug("get_item_by_key url={}".format(request_url))
        return rest.simpleRequest(
            request_url,
            sessionKey=self.session_key,
            method='GET',
            raiseAllErrors=True
        )

    def get_items_by_query(self, query, sort=None, limit=0):
        """
        Get all items which match the given query object
        :param
        query: dict describing request's getargs
        sort: how the returned items should be sorted
        limit: number of items to return
        :return: response, content
        """
        query = {'query': json.dumps(query)}

        if sort is not None:
            query[constants.SORT] = sort

        query[constants.LIMIT] = limit

        LOGGER.debug("get_items_by_query, query={}".format(query))
        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            method='GET',
            getargs=query,
            raiseAllErrors=True
        )

    def get_all_items(self, sort=None, limit=0):
        """
        Get an item of kvstore.
        :param key: key id in kvstore
        :return: response, content
        """
        query = {}
        if sort is not None:
            query[constants.SORT] = sort

        query[constants.LIMIT] = limit



        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            method='GET',
            getargs=query,
            raiseAllErrors=True
        )

    def insert_or_update_item_containing_key(self, item):
        """
        If an item (with a given _key) exists in kvstore, update it. Otherwise,
        create a new entry under that key.
        :param item: a json-able object (such as a dict) containing new values of ALL attributes, including _key
        :return: response, content
        """

        key = item[u'_key']

        try:
            return self.update_item_by_key(key, updated_item=item)

        except splunk.RESTException as err:
            if err.statusCode != 404:
                raise err

        return self.insert_single_item(item)

    def update_item_by_key(self, key, updated_item):
        """
        Update an item of kvstore.
        :param key: key id in kvstore
        :param updated_item: a json-able object (such as a dict) containing new values of ALL attributes
        :return: response, content
        """
        json_args = json.dumps(updated_item)
        key = self.uri_encode(key)
        post_url = '%s/%s' % (self.uri, key)
        return rest.simpleRequest(
            post_url,
            sessionKey=self.session_key,
            jsonargs=json_args,
            method='POST',
            raiseAllErrors=True
        )

    def update_item_by_key_as_json(self, key, json_args):
        """
        Update an item of kvstore.
        :param key: key id in kvstore
        :param json_args: an already-formed json string containing new values of ALL attributes
        :return: response, content
        """
        key = self.uri_encode(key)
        post_url = '%s/%s' % (self.uri, key)
        return rest.simpleRequest(
            post_url,
            sessionKey=self.session_key,
            jsonargs=json_args,
            method='POST',
            raiseAllErrors=True
        )

    def delete_item_by_key(self, key):
        """
        Delete an item of kvstore.
        :param key: key id in kvstore
        :return: response, content
        """
        LOGGER.debug('deleting from kvstore. uri:{}'.format(self.uri))

        key = self.uri_encode(key)
        delete_url = '%s/%s' % (self.uri, key)
        return rest.simpleRequest(
            delete_url,
            sessionKey=self.session_key,
            method='DELETE',
            raiseAllErrors=True
        )

    def delete_items_by_query(self, query):
        """
        Delete all items which satisfy the given query
        :return: response, content
        """
        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            getargs={'query': json.dumps(query)},
            method='DELETE',
            raiseAllErrors=True
        )

    def delete_expired_items(self, expired_time=None, expiration_attribute_name=None):
        """
        Delete all items by a given expired time
        :param expired_time: a timestamp
        :param expiration_attribute_name:
        :return: response, content
        """
        timestamp_before = int(time.time()) - expired_time
        delete_args = {'query': '{"%s": {"$lt": "%d"}}' % (expiration_attribute_name if expiration_attribute_name
                                                           else self.timestamp_attribute_name, timestamp_before)}
        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            method='DELETE',
            getargs=delete_args,
            raiseAllErrors=True
        )

    def delete_all_items(self):
        """
        Delete all items.
        :return: response, content
        """
        return rest.simpleRequest(
            self.uri,
            sessionKey=self.session_key,
            method='DELETE',
            raiseAllErrors=True
        )

    @staticmethod
    def uri_encode(key):
        """
        Url encode and utf-encode the
        kvstore key
        :param key: key id in kvstore
        :return: utf encode and url encoded key
        """

        # To use 'key' in the url, it must be URL-encoded
        if py23.py2_check_unicode(key):
            key = key.encode('utf-8')
        return urllib.quote(key, safe='')

def get_all_collections(session_key, app_name=constants.SPACEBRIDGE_APP_NAME):
    uri = encode_whitespace('{}/servicesNS/nobody/{}/storage/collections/config'.format(rest.makeSplunkdUri(), app_name))
    params = {'output_mode': 'json'}
    return rest.simpleRequest(
        uri,
        sessionKey=session_key,
        method='GET',
        getargs=params,
        raiseAllErrors=True
    )
