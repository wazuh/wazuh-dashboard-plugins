"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process Alerts Requests
"""

import json
import jsonpickle
from http import HTTPStatus
from typing import Dict

from spacebridgeapp.data.alert_data import ScopedSnooze
from spacebridgeapp.util.constants import OR_OPERATOR, LESS_THAN_OPERATOR, GREATER_THAN_OPERATOR, SORT, LIMIT, QUERY, \
    KEY
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.rest.clients.async_kvstore_client import AsyncKvStoreClient
from spacebridgeapp.util import constants
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from splapp_protocol import request_pb2
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.time_utils import get_current_timestamp

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_alerts_request_processor.log", "alerts_request_processor")


async def process_alerts_list_request(request_context,
                                      client_single_request,
                                      server_single_response,
                                      async_kvstore_client):
    """
    This method will process alerts list requests

    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_kvstore_client:
    :return:
    """

    await populate_alerts_list_response(request_context,
                                        client_single_request,
                                        server_single_response,
                                        async_kvstore_client)


async def process_alert_get_request(request_context,
                                    client_single_request,
                                    server_single_response,
                                    async_kvstore_client):
    """
    This method will process an alert get request to fetch a single alert
    :param request_context:
    :param client_single_request: clientSingleRequest proto with alertGetRequest field
    :param server_single_response: ServerSingleResponse opbject with alertGetResponse field
    :param async_kvstore_client:
    :return: void (modifies the server single response proto)
    """

    LOGGER.info("Fetching alert get for alert=%s", client_single_request.alertGetRequest.alertId)

    alert_id = client_single_request.alertGetRequest.alertId

    alert = await fetch_alert(request_context=request_context,
                              alert_id=alert_id,
                              async_kvstore_client=async_kvstore_client)
    alert.set_protobuf(server_single_response.alertGetResponse.alert)
    LOGGER.info("Finished processing alert get request")


async def process_alerts_delete_request(request_context, client_single_request, server_single_response, async_kvstore_client):
    """
    This method will process alerts delete requests
    :param request_context:
    :param client_single_request: reference client request object
    :param server_single_response:  pass-by-reference return object
    :param async_kvstore_client:
    """
    LOGGER.info("Processing Alerts Delete Request")

    device_id = request_context.device_id
    alert_ids = client_single_request.alertsDeleteRequest.alertIds

    await delete_alerts_for_device(request_context, device_id, alert_ids, async_kvstore_client)

    server_single_response.alertsDeleteResponse.alertIds.extend(alert_ids)
    LOGGER.info("Finished processing Alerts Delete Request")


async def populate_alerts_list_response(request_context,
                                        client_single_request,
                                        single_server_response,
                                        async_kvstore_client):
    """
    Takes a client_single_request object and a device id and fetches the corresponding alert ids from kv store
    the single_server_response input proto with the fetched alerts.
    :param request_context:
    :param client_single_request: proto of client_single_request provided by the client
    :param single_server_response: server_single_response proto to be returned by splapp
    :param async_kvstore_client: client to make requests to kv store
    :return: No return. Single Server Response input is mutated with return values
    """

    continuation_id = client_single_request.alertsListRequest.continuationId
    max_results = client_single_request.alertsListRequest.maxResults
    order = client_single_request.alertsListRequest.order

    LOGGER.info("Start populate_alerts_list_response")

    # fetch alert ids for device and then fetch corresponding alert bodies
    alert_ids = await fetch_alert_ids(request_context=request_context,
                                      order=order,
                                      continuation_id=continuation_id,
                                      num_results=max_results,
                                      async_kvstore_client=async_kvstore_client)
    alert_bodies = await fetch_alert_bodies(request_context=request_context,
                                            alert_ids=alert_ids,
                                            async_kvstore_client=async_kvstore_client,
                                            order=order)
    alert_protos = []
    for alert in alert_bodies:
        alert.detail = None
        try:
            alert_protos.append(alert.to_protobuf())
        except TypeError as e:
            # in cases where the serialized alert was corrupted, converting it to a proto may fail.  See MSB-3060
            LOGGER.warn("Failed to serialize Alert cause=%s", str(e))

    # populate server response proto
    single_server_response.alertsListResponse.continuationId = continuation_id

    # for some reason, direct assignment for repeated fields throws an error, so we do it manually. First delete
    # any elements in the list and then add the fields we want.
    del single_server_response.alertsListResponse.alerts[:]
    single_server_response.alertsListResponse.alerts.extend(alert_protos)
    single_server_response.alertsListResponse.order = order

    if len(alert_protos) > 0:
        single_server_response.alertsListResponse.nextContinuationId = alert_protos[-1].notification.createdAt

    LOGGER.info("Finished populating response for alerts list request with num_alerts=%d", len(alert_protos))


async def process_snooze_request(request_context: RequestContext,
                                 client_single_request: request_pb2.ClientSingleRequest,
                                 server_single_response: request_pb2.ServerSingleResponse,
                                 async_kvstore_client: AsyncKvStoreClient):
    """
    Takes a client_single_request proto with a snoozeRequest proto set, and creates a snooze internally
    for the device_id in the request_context. This snooze will prevent push notifications from being sent to
    the device until the endTime specified in the proto. The push notifications which are silenced are specified
    in the request, current only SnoozeAll requests are supported, which snoozes all notifications

    :param request_context: RequestContext object with device_id and auth_header to use for create the snooze
    :param client_single_request: proto of client_single_request provided by the client
    :param server_single_response: server_single_response proto to be returned by splapp
    :param async_kvstore_client: AsyncKVStoreClient object to make requests to kv store
    :return: No return. Single Server Response input is mutated with return values
    """

    LOGGER.debug('Processing snooze request')
    end_time = client_single_request.snoozeRequest.endTime
    request_type = client_single_request.snoozeRequest.WhichOneof(constants.SNOOZE_REQUEST_TYPE)

    if request_type is None:
        raise SpacebridgeApiRequestError(
            'Need to provide requestType with snooze request',
            status_code=HTTPStatus.BAD_REQUEST)
    elif request_type == constants.SNOOZE_ALL_REQUEST_TYPE:
        post_data = await get_post_arguments_for_snooze(request_type=request_type,
                                                        device_id=request_context.device_id,
                                                        end_time=end_time)

        # Before we post the request, we check if it exists, and if it does we will just update it
        snooze_all = await fetch_snooze_all_for_device(request_context, async_kvstore_client)
        key_id = snooze_all[KEY] if snooze_all else None

        kvstore_response = await async_kvstore_client.async_kvstore_post_or_update_request(
            collection=constants.SNOOZED_SCOPES_COLLECTION_NAME,
            key_id=key_id,
            data=json.dumps(post_data),
            auth_header=request_context.auth_header
        )
        if kvstore_response.code not in {HTTPStatus.OK, HTTPStatus.CREATED}:
            message = await kvstore_response.text()
            raise SpacebridgeApiRequestError(
                f'Call to create snooze failed with message={message}',
                status_code=kvstore_response.code)
        kvstore_response_json = await kvstore_response.json()
        server_single_response.snoozeResponse.snoozeID = kvstore_response_json[KEY]
        server_single_response.snoozeResponse.snoozeAllResponse.SetInParent()
    else:
        raise SpacebridgeApiRequestError(
            f'Unable to process requestType {request_type}',
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR)
    LOGGER.debug('Finished processing snooze request')


async def process_unsnooze_request(request_context: RequestContext,
                                   client_single_request: request_pb2.ClientSingleRequest,
                                   server_single_response: request_pb2.ServerSingleResponse,
                                   async_kvstore_client: AsyncKvStoreClient):
    """
    Takes a client_single_request proto with a unsnoozeRequest proto set, and deletes a snooze internally
    for the device_id in the request_context.

    :param request_context: RequestContext object with device_id and auth_header to use for deleting the snooze
    :param client_single_request: proto of client_single_request provided by the client
    :param single_server_response: server_single_response proto to be returned by splapp
    :param async_kvstore_client: AsyncKVStoreClient object to make requests to kv store
    :return: No return. Single Server Response input is mutated with return values
    """

    LOGGER.debug('Processing unsnooze request')
    request_type = client_single_request.unsnoozeRequest.WhichOneof(constants.SNOOZE_TYPE)

    if request_type is None:
        raise SpacebridgeApiRequestError(
            'Need to provide requestType with unsnooze request',
            status_code=HTTPStatus.BAD_REQUEST)
    if request_type == constants.SNOOZE_ALL_REQUEST_TYPE:

        # We want to fetch this request_type before we delete it,
        # so we can return the ID of the snooze
        snooze_all = await fetch_snooze_all_for_device(request_context, async_kvstore_client)

        if not snooze_all:  # Don't need to delete if its not there
            server_single_response.unsnoozeResponse.snoozeIDs.extend([])
            return

        snooze_id = snooze_all[KEY]

        # Now that we've fetched it, we can delete it
        query = {KEY: snooze_id}
        scoped_snoozes_delete = await async_kvstore_client.async_kvstore_delete_request(
            collection=constants.SNOOZED_SCOPES_COLLECTION_NAME,
            params={QUERY: json.dumps(query)},
            auth_header=request_context.auth_header,
        )
        if scoped_snoozes_delete.code != HTTPStatus.OK:
            message = await scoped_snoozes_delete.text()
            raise SpacebridgeApiRequestError(
                f'Call to delete snooze failed with message={message}',
                status_code=scoped_snoozes_delete.code)

        # KVStore doesn't tell us what IDs we have deleted, so we assume that KVStore worked properly and deleted
        # all of the requested ids
        server_single_response.unsnoozeResponse.snoozeIDs.extend([snooze_id])
    else:
        raise SpacebridgeApiRequestError(
            f'Unable to process requestType {request_type}',
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR)
    LOGGER.debug('Finished processing unsnooze request')


async def process_get_snooze_request(request_context: RequestContext,
                                     client_single_request: request_pb2.ClientSingleRequest,
                                     server_single_response: request_pb2.ServerSingleResponse,
                                     async_kvstore_client: AsyncKvStoreClient):
    """
    Takes a client_single_request proto with a getSnoozeRequest proto set, and fetches
    a snooze for the device_id in the request_context.

    :param request_context: RequestContext object with device_id and auth_header to use for create the snooze
    :param client_single_request: proto of client_single_request provided by the client
    :param single_server_response: server_single_response proto to be returned by splapp
    :param async_kvstore_client: AsyncKVStoreClient object to make requests to kv store
    :return: No return. Single Server Response input is mutated with return values
    """

    LOGGER.debug('Processing get snooze request')
    snoozes = []
    should_fetch_snooze_all = client_single_request.getSnoozeRequest.includeSnoozeAll

    if should_fetch_snooze_all:
        current_timestamp = int(get_current_timestamp())
        snooze_all = await fetch_snooze_all_for_device(request_context, async_kvstore_client,
                                                       filter_timestamp=current_timestamp)
        if snooze_all:
            snooze_all_proto = ScopedSnooze.from_json(snooze_all).to_protobuf()
            snoozes.append(snooze_all_proto)

    server_single_response.getSnoozeResponse.snoozes.extend(snoozes)
    LOGGER.debug('Finished processing get snooze request')


async def get_post_arguments_for_snooze(request_type: str, device_id: str, end_time: int) -> Dict[str, str]:
    """
    Creates a dict of post arguments for inserting a snooze based on a request type, end_time and device_id
    mostly here to provide easily testable post arguments

    :param device_id: Device ID to post request to
    :param request_type: Type of request
    :param end_time: ending time to send

    :return: post arguments for a kvstore insert of the object, and a failure if unknown request type
    """

    if request_type == constants.SNOOZE_ALL_REQUEST_TYPE:
        return {
            constants.END_TIME: str(end_time),
            constants.SCOPE: constants.SNOOZE_ALL_SCOPE,
            constants.DEVICE_ID: device_id,
        }
    else:
        raise SpacebridgeApiRequestError(
            f'Unable to process requestType {request_type}',
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR)


async def fetch_snooze_all_for_device(request_context: RequestContext,
                                      async_kvstore_client: AsyncKvStoreClient,
                                      filter_timestamp=None) -> Dict[str, str]:
    """
    Fetches a SnoozeAll object for a particular device_id (based on request_context). If the SnoozeAll object
    exists, it will be returned as a dict direct from kvstore, otherwise an empty dict will be returned

    :param request_context: RequestContext object, auth header and and device_id are used for fetching snooze
    :param async_kvstore_client: AsyncKVStoreClient used to fetch the snooze object
    :param filter_timestamp: return snoozes more recent than this timestamp. Return all if no timestamp provided
    :return:
    """
    # We take a string here because we store timestamps as strings internally. We can get away with using string
    # comparison in this specific case because ascii comparison works for numbers and we are guaranteed there
    # are no decimal places, since get_current_timestamp() returns an int. Casted to int anyways to future proof
    filter_timestamp_str = str(filter_timestamp)

    # Fetch snoozes for specific device and snooze type. If we want to filter expired snoozes then we add an additional
    # query param to only include snoozes with end time greater than current time (aka they are still active)
    if filter_timestamp:
        query = {constants.AND_OPERATOR: [{constants.SCOPE: constants.SNOOZE_ALL_SCOPE},
                                          {constants.DEVICE_ID: request_context.device_id},
                                          {constants.END_TIME: {constants.GREATER_THAN_OPERATOR: filter_timestamp_str}}]}
    else:
        query = {constants.AND_OPERATOR: [{constants.SCOPE: constants.SNOOZE_ALL_SCOPE},
                                          {constants.DEVICE_ID: request_context.device_id}]}


    snooze_all = await async_kvstore_client.async_kvstore_get_request(
        collection=constants.SNOOZED_SCOPES_COLLECTION_NAME,
        params={QUERY: json.dumps(query)},
        auth_header=request_context.auth_header,
    )
    if snooze_all.code != HTTPStatus.OK:
        message = await snooze_all.text()
        raise SpacebridgeApiRequestError(
            f'Call to delete snooze failed with message={message}',
            status_code=snooze_all.code)
    snooze_all_json = await snooze_all.json()
    # All get requests will return a list, so we will pull out the actual dict since there is a max of one
    # snooze_all per device_id
    if snooze_all_json:
        return snooze_all_json[0]
    return {}


async def fetch_alert_bodies(request_context,
                             alert_ids=[],
                             async_kvstore_client=None,
                             order=None):
    """
    Takes a list of alert ids and returns a list of the corresponding alert data objects by fetching them from
    kv store
    :param request_context:
    :param alert_ids: list of alert ids
    :order: proto specifying whether to return results in ascending or descending order by timestamp
    :param async_kvstore_client: instance of AsyncKvStoreClient
    :param order:
    :return: ordered list of alert objects corresponding to the input alert ids
    """

    if alert_ids is None or not alert_ids:
        return []

    query = {OR_OPERATOR: [{KEY:alert_id} for alert_id in alert_ids]}
    sort_order = (1 if order == request_pb2.ASCENDING else -1)
    sort_param = "notification.created_at:%d" % sort_order

    alert_bodies_response = await async_kvstore_client.async_kvstore_get_request(
        constants.MOBILE_ALERTS_COLLECTION_NAME,
        params={QUERY: json.dumps(query), SORT: sort_param},
        auth_header=request_context.auth_header)

    if alert_bodies_response.code != HTTPStatus.OK:
        message = await alert_bodies_response.text()
        raise SpacebridgeApiRequestError(
            "Call to fetch alert bodies failed with message={}".format(message),
            status_code=alert_bodies_response.code)

    alert_bodies_response_json = await alert_bodies_response.json()
    alerts_list = []

    # If we received the alert bodies, go through each one and attemp to convert it back to an alert object
    for alert_json in alert_bodies_response_json:
        try:
            alert = jsonpickle.decode(json.dumps(alert_json), safe=True)
            alert.notification.alert_id = alert_json[KEY]
            alerts_list.append(alert)
        except json.JSONDecodeError:
            LOGGER.exception("Error decoding alert json=%s", alert_json)
        except Exception:
            LOGGER.exception("Exception in processing alert json=%s", alert_json)

    return alerts_list


async def delete_alerts_for_device(request_context, device_id, alert_ids, async_kvstore_client):
    """
    Delete a list of alert ids for a given device from the alert_recipient_devices collection. This is so that the
    alert is not fetched for that particular device in the feature. The actual body of the alert still exists in KV Store
    :param request_context:
    :param device_id: [string] id of device for which to remove the alert ids
    :param alert_ids: [list[string]] list of alert ids to be deleted
    :param async_kvstore_client:
    :return:
    """
    query = {OR_OPERATOR: [{"alert_id":alert_id, "device_id":device_id} for alert_id in alert_ids]}
    response = await async_kvstore_client.async_kvstore_delete_request(collection=constants.ALERTS_RECIPIENT_DEVICES_COLLECTION_NAME,
                                                                       auth_header=request_context.auth_header,
                                                                       params={QUERY: json.dumps(query)})
    if response.code != HTTPStatus.OK:
        message = await response.text()
        raise SpacebridgeApiRequestError(
            "Call to delete alert for user failed with message={}".format(message),
            status_code=response.code)


async def delete_all_alerts_for_device(request_context, device_id, async_kvstore_client):
    """
    Delete all alert ids for a given device from the alert_recipient_devices collection. This is so that the
    alert is not fetched for that particular device in the feature. The actual body of the alert still exists in KV Store
    :param request_context:
    :param device_id: [string] id of device for which to remove the alert ids
    :param alert_ids: [list[string]] list of alert ids to be deleted
    :param async_kvstore_client:
    :return:
    """
    query = {"device_id": device_id}
    response = await async_kvstore_client.async_kvstore_delete_request(collection=constants.ALERTS_RECIPIENT_DEVICES_COLLECTION_NAME,
                                                                       auth_header=request_context.auth_header,
                                                                       params={QUERY: json.dumps(query)})
    if response.code != HTTPStatus.OK:
        message = await response.text()
        raise SpacebridgeApiRequestError(
            "Call to delete all alert for user failed with message={}".format(message),
            status_code=response.code)


async def fetch_alert(request_context,
                      alert_id=None,
                      async_kvstore_client=None):
    """
    Retrieve a specific alert given the alert id, from KV Store

    :param request_context:
    :param alert_id:
    :param async_kvstore_client:
    :return:
    """

    query = {KEY: alert_id}
    response = await async_kvstore_client.async_kvstore_get_request(
        constants.MOBILE_ALERTS_COLLECTION_NAME,
        params={QUERY: json.dumps(query)},
        auth_header=request_context.auth_header
    )

    if response.code != HTTPStatus.OK:
        message = await response.text()
        raise SpacebridgeApiRequestError(
            "Call to fetch alert by alert_id={} failed with message={}".format(alert_id, message),
            status_code=response.code)

    alert_json = await response.json()
    alert = jsonpickle.decode(json.dumps(alert_json[0]), safe=True)
    alert.notification.alert_id = alert_id
    return alert


async def fetch_alert_ids(request_context,
                          order=None,
                          continuation_id=None,
                          num_results=0,  # 0 works as unlimited with kvstore API
                          async_kvstore_client=None):

    """
    Fetches the ids of alerts for a particular device_id based on the order (ascending, descending) and the continuation
    id (which allows for pagination)

    :param request_context:
    :param order: order of alerts
    :param continuation_id: timestamp of last alert to paginatine on. "" if no pagination to be done.
    :param num_results: max number of results
    :param async_kvstore_client: handler for making http requests to kv store
    :return: deferred list of alert ids for the given device id
    """
    sort_order = (1 if order == request_pb2.ASCENDING else -1)
    alert_ids_table = constants.ALERTS_RECIPIENT_DEVICES_COLLECTION_NAME
    device_id = request_context.device_id

    if continuation_id is None or not continuation_id:
        # If the client provides no continuation id, then we fetch all alerts
        # belonging to the particular device id, sorted by the order provided by the client and then we take the top
        # K results.
        query = {QUERY: json.dumps({"device_id": device_id}),
                 SORT: "timestamp:%d" % sort_order,
                 LIMIT: num_results}
    else:
        # If the user provides a continuation id, which is a timestamp, we build a query to get the next K alerts
        # that happened after or before the timestamp (depending on which ordering is specified by the client)
        query = paginated_alert_query(sort_order, continuation_id, num_results, device_id)

    response = await async_kvstore_client.async_kvstore_get_request(collection=alert_ids_table,
                                                                    params=query,
                                                                    auth_header=request_context.auth_header)

    if response.code != HTTPStatus.OK:
        message = await response.text()
        raise SpacebridgeApiRequestError(
            "Error fetching ids for paginated alerts for status_code={}, query={}, error={}"
            .format(response.code, json.dumps(query), message),
            status_code=response.code)

    response_json = await response.json()
    return [alert["alert_id"] for alert in response_json]


def paginated_alert_query(order, alert_timestamp, num_results, device_id):
    """
    Given an ordering and timestamp, returns a KV store query for getting the next or previous K results
    (depending on order) occurring after (or before)  the given  timestamp
    """
    if order == -1:
        query = {"timestamp": {LESS_THAN_OPERATOR: alert_timestamp}, "device_id": device_id}
    else:
        query = {"timestamp": {GREATER_THAN_OPERATOR: alert_timestamp}, "device_id": device_id}

    return {QUERY: json.dumps(query),
            SORT: "timestamp:%d" % order,
            LIMIT: num_results}


async def process_alerts_clear_request(request_context, _client_single_request, server_single_response, async_kvstore_client):
    """
    Will find all alerts for the provided device, and remove the alert mappings for that device.  Does not affect
    the underlying alert bodies.
    :param request_context: A request context containing the device_id
    :param _client_single_request: ignored for now, a AlertsClearRequest protobuf message
    :param server_single_response: A ServerSingleResponse protobuf message
    :param async_kvstore_client:
    :return:
    """
    await delete_all_alerts_for_device(request_context, request_context.device_id, async_kvstore_client)

    server_single_response.alertsClearResponse.SetInParent()
