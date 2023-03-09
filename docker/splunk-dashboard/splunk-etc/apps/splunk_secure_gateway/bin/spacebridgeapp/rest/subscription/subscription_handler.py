"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Hosts APIs for CRUD operations on subscriptions
"""
import sys
import json
import splunk
from http import HTTPStatus

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

import jsonpickle
from spacebridgeapp.data.subscription_data import Subscription, SubscriptionCredential
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KVStore
from spacebridgeapp.util import constants
from spacebridgeapp.util.kvstore import build_containedin_clause
from spacebridgeapp.util.time_utils import get_expiration_timestamp_str, get_current_timestamp_str

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_subscription_handler")

KEYS = 'keys'
PATH_INFO = 'path_info'
SUBSCRIPTION_TYPES = 'subscription_types'
USERS = 'users'
DEVICE_IDS = 'device_ids'


class SubscriptionHandler(BaseRestHandler, PersistentServerConnectionApplication):

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Lists one or more subscriptions based on provided json/query payload parameters, OR key provided on path

        Request Parameters
            users                   optional list of user to fetch subscriptions for
            subscription_types      optional list of subscription types to filter on
            device_ids              optional list of device_ids to filter on

            You can either pass these in the json body, or pass them in like
            https://localhost:8089/services/ssg/subscription/?users=user1&users=user2

        Returns:
            list of subscriptions found

            Example:
                [
                    {
                        "device_id": "3",
                        "expired_time": "12345678",
                        "last_update_time": "123456",
                        "shard_id": "shard",
                        "subscription_key": "keyy",
                        "subscription_type": "Splunk TV",
                        "ttl_seconds": "10",
                        "user": "pasadi",
                        "version": 2,
                        "visualization_id": "",
                        "_user": "nobody",
                        "_key": "5f04e4d1ed7a6aab3e6f2e91"
                    }
                ]
        """
        session_key = request[constants.SESSION][constants.AUTHTOKEN]
        path = request.get(PATH_INFO)
        kvstore_object = KVStore(collection=constants.SUBSCRIPTIONS_COLLECTION_NAME, session_key=session_key)
        if path:  # search using path as key
            LOGGER.debug('Fetching subscription with key %s', path)
            try:
                response_header, response = kvstore_object.get_item_by_key(path)
            except splunk.RESTException as e:
                if e.statusCode == HTTPStatus.NOT_FOUND:
                    return {
                        constants.PAYLOAD: {'Error': 'Not found'},
                        constants.STATUS: HTTPStatus.NOT_FOUND,
                    }
                raise e

        else:  # use json parameters or search for all
            payload = json.loads(request.get(constants.PAYLOAD, '{}'))
            query_params = request.get(constants.QUERY)
            users = payload.get(USERS)
            subscription_types = payload.get(SUBSCRIPTION_TYPES)
            device_ids = payload.get(DEVICE_IDS)

            # if not in json, try to pull from query params
            if not users and query_params:
                users = get_list_from_query(query_params, USERS)
            if not subscription_types and query_params:
                subscription_types = get_list_from_query(query_params, SUBSCRIPTION_TYPES)
            if not device_ids and query_params:
                device_ids = get_list_from_query(query_params, DEVICE_IDS)

            query = {}
            if users:
                query = build_containedin_clause(constants.USER, users)
            if subscription_types:
                query = {constants.AND_OPERATOR: [
                    build_containedin_clause(constants.SUBSCRIPTION_TYPE, subscription_types),
                    query
                ]}
            if device_ids:
                query = {constants.AND_OPERATOR: [
                    build_containedin_clause(constants.DEVICE_ID, device_ids),
                    query
                ]}
            if query:
                LOGGER.debug('Fetching subscription(s) with query %s', query)
                response_header, response = kvstore_object.get_items_by_query(query)
            else:
                LOGGER.debug('Fetching all subscriptions')
                response_header, response = kvstore_object.get_all_items()

        payload = json.loads(response)
        return {
            constants.PAYLOAD: payload,
            constants.STATUS: response_header.status,
        }

    def post(self, request):
        """
        Creates/updates a subscription

        Request Parameters
            json version of a subscription collection object. Contains required fields
                _key (required for update, must be empty for create)
                ttl_seconds
                subscription_key
                subscription_type
                device_id
                shard_id
                user

            Example:
                {
                    "ttl_seconds": "10",
                    "subscription_key": "key"
                    "subscription_type": "Splunk TV",
                    "device_id": "device_id",
                    "shard_id": "shard_id",
                    "user": "pasadi",
                }

        Returns:
            id of created/update subscription

            Example:
                {
                    "message": "5f04e4d1ed7a6aab3e6f2e91",
                    "status": 201
                }
        """
        session_key = request[constants.SESSION][constants.AUTHTOKEN]
        payload = json.loads(request[constants.PAYLOAD])
        if not payload:
            return {
                constants.PAYLOAD: {'Error', 'You must provide subscription information to update/create'},
                constants.STATUS: HTTPStatus.BAD_REQUEST
            }

        kvstore_object = KVStore(collection=constants.SUBSCRIPTIONS_COLLECTION_NAME, session_key=session_key)

        # Verification of provided fields
        required_fields = (
            Subscription.TTL_SECONDS, Subscription.SUBSCRIPTION_KEY, Subscription.SUBSCRIPTION_TYPE,
            Subscription.DEVICE_ID, Subscription.SHARD_ID, Subscription.USER
        )
        missing_fields = []
        for field in required_fields:
            if field not in payload:
                missing_fields.append(field)

        if missing_fields:
            return {
                constants.PAYLOAD: {'Error': f'Missing field(s) {missing_fields}'},
                constants.STATUS: HTTPStatus.BAD_REQUEST
            }

        # Setting default fields
        subscription = Subscription.from_json(payload)
        subscription.expired_time = get_expiration_timestamp_str(ttl_seconds=int(subscription.ttl_seconds))
        subscription.version = constants.SUBSCRIPTION_VERSION_2
        subscription.last_update_time = get_current_timestamp_str()

        if subscription.key():  # update case
            return update_subscription(kvstore_object=kvstore_object, subscription=subscription)
        else:  # create case
            return create_subscription(
                kvstore_object=kvstore_object,
                subscription=subscription,
                session_key=session_key,
            )

    def delete(self, request):
        """
        Deletes a subscription

        Request Parameters
            keys           list of urlsafe base64 encoded subscription keys to delete on

            Example:
                {
                    "keys": ["key1", "key2"]
                }
        Returns
            list of delete keys

            Example:
                [ "key1", "key2" ]
        """
        session_key = request[constants.SESSION][constants.AUTHTOKEN]
        path = request.get(PATH_INFO)
        kvstore_object = KVStore(collection=constants.SUBSCRIPTIONS_COLLECTION_NAME, session_key=session_key)

        if path:  # delete by path as key
            return delete_subscription_by_keys(kvstore_object=kvstore_object, keys=[path])

        # Otherwise fetch from payload or query params
        payload = json.loads(request.get(constants.PAYLOAD, '{}'))
        query_params = request.get(constants.QUERY)
        keys = payload.get(KEYS)
        # if not in json, try to pull from query params
        if not keys and query_params:
            keys = get_list_from_query(query_params, KEYS)

        if not isinstance(keys, list):
            return {
                constants.PAYLOAD: {'Error': '"keys" parameter must be a list'},
                constants.STATUS: HTTPStatus.BAD_REQUEST
            }

        return delete_subscription_by_keys(kvstore_object, keys)


def create_subscription(kvstore_object, subscription, session_key):
    del subscription._key  # Need to remove default _key == null
    subscription_json = jsonpickle.encode(subscription, unpicklable=False)  # to capture defaults
    LOGGER.debug('Creating subscription with body: %s', subscription_json)

    try:
        response, content = kvstore_object.insert_single_item_as_json(json_args=subscription_json)
        response_json = json.loads(content)
        key = response_json.get(constants.KEY)
        LOGGER.debug('Created subscription with key %s', key)

        return {
            constants.PAYLOAD: key,
            constants.STATUS: response.status
        }
    except splunk.RESTException as e:
        LOGGER.debug('Failed to create subscription with error: %s', e)
        return {
            constants.PAYLOAD: {'Error': f'Failed to create subscription with error: {e}'},
            constants.STATUS: HTTPStatus.INTERNAL_SERVER_ERROR
        }


def update_subscription(kvstore_object, subscription):
    key = subscription.key()
    subscription_json = jsonpickle.encode(subscription, unpicklable=False)  # to capture defaults
    LOGGER.debug('Updating subscription with key %s and body %s', key, subscription_json)

    try:
        response, _ = kvstore_object.update_item_by_key_as_json(key=key, json_args=subscription_json)
        return {
            constants.PAYLOAD: key,
            constants.STATUS: response.status
        }
    except splunk.RESTException as e:
        LOGGER.debug('Failed to update subscription with error: %s', e)
        return {
            constants.PAYLOAD: {'Error': f'Failed to update subscription with error: {e}'},
            constants.STATUS: HTTPStatus.INTERNAL_SERVER_ERROR
        }


def delete_subscription_by_keys(kvstore_object, keys):
    query = build_containedin_clause(constants.KEY, keys)
    LOGGER.debug('Deleting subscriptions with query %s', query)
    _, subscriptions_to_delete = kvstore_object.get_items_by_query(query)
    subscriptions_to_delete = json.loads(subscriptions_to_delete)
    ids_to_delete = [subscription.get(constants.KEY) for subscription in subscriptions_to_delete]
    kvstore_object.delete_items_by_query(query)
    return {
        constants.PAYLOAD: ids_to_delete,
        constants.STATUS: HTTPStatus.OK
    }


def get_list_from_query(query, key):
    obj = query.get(key)
    if isinstance(obj, str):
        obj = [obj]
    return obj
