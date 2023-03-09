"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Script for custom mobile alert action which is called when
a mobile alert is triggered.
"""

import sys
import os
import warnings
from base64 import b64decode

warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

from spacebridgeapp.util import py23

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'


import splunk.rest as rest
import jsonpickle
import json
import asyncio

from cloudgateway.device import EncryptionKeys
from cloudgateway.encryption_context import EncryptionContext
from cloudgateway.private.sodium_client.sharedlib_sodium_client import SodiumClient, SodiumOperationError
from http import HTTPStatus
from spacebridgeapp.util import constants
from spacebridgeapp.data.alert_data import CallToAction, Notification, Alert, Detail, RecipientDevice, ScopedSnooze
from spacebridgeapp.data.dashboard_data import DashboardVisualizationId
from spacebridgeapp.dashboard.generate_dashboard import create_dashboard_description_table
from spacebridgeapp.util.app_info import fetch_display_app_name
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.util.time_utils import get_current_timestamp
from spacebridgeapp.alerts import notifications
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStoreAccessor
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory, AsyncKvStoreClient
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.request.dashboard_request_processor import fetch_dashboard_description
from spacebridgeapp.request.dashboard_request_processor import get_list_dashboard_data
from spacebridgeapp.request.request_processor import SpacebridgeAuthHeader
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.request.dashboard_request_processor import get_search_job_content
from spacebridgeapp.request.dashboard_request_processor import get_search_job_dashboard_data
from cloudgateway.private.encryption.encryption_handler import encrypt_for_send, sign_detached
from spacebridgeapp.search.input_token_support import set_default_token_values
from functools import partial
from spacebridgeapp.rest.devices.user_devices import public_keys_for_device
from spacebridgeapp.exceptions.key_not_found_exception import KeyNotFoundError
from spacebridgeapp.exceptions.splunk_api_exceptions import EncryptionKeyError
from spacebridgeapp.alerts.devices import get_registered_devices
from spacebridgeapp.util.mtls import build_mtls_spacebridge_client
from spacebridgeapp.dashboard.parse_search import get_string_field
from spacebridgeapp.util.constants import SUBJECT, SEVERITY, CALL_TO_ACTION_URL, CALL_TO_ACTION_LABEL, \
    ALERT_TIMESTAMP_FIELD, ALERT_DASHBOARD_ID, DASHBOARD_TOGGLE, ALERT_ID, ALERT_MESSAGE, ALERT_SUBJECT, \
    CONFIGURATION, SAVED_SEARCH_RESULT, SESSION_KEY, RESULTS_LINK, SEARCH_ID, OWNER, APP, SEARCH_NAME, \
    ATTACH_DASHBOARD_TOGGLE, ATTACH_TABLE_TOGGLE, TOKEN, FIELDNAME, RESULT

from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + '_mobile_alert.log', 'ssg_mobile_alert')


# Payload Constants


async def trigger(alert_payload):
    """
    Entry path for the mobile alert which is called from the main method of this module.
    This function does the following:
        1. extracts the server_uri from the payload
        2. Get's all registered devices from the KV Store and
        3. Build an alert for each registered device
        4. Post each created alert to KV Store

    Arguments:
        :param reactor
        :param alert_payload {json} -- json object of the payload sent by splunk on the alert trigger
    """
    LOGGER.info("Alert triggered")
    try:
        await do_trigger(alert_payload)
    except:
        LOGGER.exception("Alert unhandled error")


async def do_trigger(alert_payload):
    auth_header = SplunkAuthHeader(alert_payload[SESSION_KEY])

    # Use default URI for alerts
    try:
        uri = rest.makeSplunkdUri()
    except Exception as e:
        LOGGER.exception("Failed to generate default URI")
        return

    mtls_spacebridge_client = None
    mtls_enabled = config.get_mtls_enabled()
    if mtls_enabled:
        mtls_spacebridge_client = build_mtls_spacebridge_client(alert_payload[SESSION_KEY])

    async_client_factory = AsyncClientFactory(uri, spacebridge_client=mtls_spacebridge_client)
    async_kvstore_client = async_client_factory.kvstore_client()
    async_splunk_client = async_client_factory.splunk_client()
    async_spacebridge_client = async_client_factory.spacebridge_client()

    alert_sid = alert_payload[SEARCH_ID]
    preprocess_payload(alert_payload)

    request_context = RequestContext(auth_header=auth_header, is_alert=True)

    LOGGER.info("get_registered_devices alert_sid=%s", alert_sid)
    registered_devices = await get_registered_devices(request_context, async_kvstore_client, alert_payload)
    LOGGER.info("get_registered_devices ok alert_sid=%s", alert_sid)

    alert = await build_alert(request_context, alert_payload, async_splunk_client, async_kvstore_client)
    LOGGER.info("persist_alert alert_id=%s", alert_sid)
    response = persist_alert(alert, auth_header.session_token)
    LOGGER.info("persist_alert ok succeeded alert_id=%s", alert_sid)

    # If we get a proper response from KV Store, then we get the key of the stored alert
    # and create a (device_id, alert_id, timestamp) triplet for each device that should
    # receive the alert

    if response is not None and "_key" in response.keys():
        alert_id = response["_key"]
        alert.notification.alert_id = alert_id

        # Persisting (recipient device, alert id) pairs and sending push notifications happens simultaneously via async
        LOGGER.info("persist_recipient_devices alert_id=%s", alert_id)
        await persist_recipient_devices(request_context, alert_id, registered_devices, alert_payload,
                                        async_kvstore_client)
        LOGGER.info("persist_recipient_devices ok alert_id=%s", alert_id)
        LOGGER.info("send_push_notifications starting registered_devices=%s", len(registered_devices))
        await send_push_notifications(
            request_context, alert.notification, registered_devices, async_kvstore_client, async_spacebridge_client,
            async_splunk_client)


def preprocess_payload(alert_payload):
    """
    If our custom fields are not populated by the user, splunk will not send them in the payload. So we just populate those
    fields as empty string for simplicity.
    :param alert_payload:
    :return:

    """
    if SUBJECT not in alert_payload[CONFIGURATION].keys():
        alert_payload[CONFIGURATION][SUBJECT] = ""

    if ALERT_MESSAGE not in alert_payload[CONFIGURATION].keys():
        alert_payload[CONFIGURATION][ALERT_MESSAGE] = ""

    if CALL_TO_ACTION_LABEL not in alert_payload[CONFIGURATION].keys():
        alert_payload[CONFIGURATION][CALL_TO_ACTION_LABEL] = ""

    if CALL_TO_ACTION_URL not in alert_payload[CONFIGURATION].keys():
        alert_payload[CONFIGURATION][CALL_TO_ACTION_URL] = ""

    if TOKEN not in alert_payload[CONFIGURATION].keys():
        alert_payload[CONFIGURATION][TOKEN] = ""

    if FIELDNAME not in alert_payload[CONFIGURATION].keys():
        alert_payload[CONFIGURATION][FIELDNAME] = ""


def persist_alert(alert, session_key):
    """
    Takes an alert (json object), a server uri and a splunk session key and posts each
    alert into KV Store.

    Currently does it synchronously but we should optimize by making each post request async.

    Arguments:
        server_uri {string} -- uri of the server
        alert {Alert} -- Alert object to be persisted to KV store
        session_key {string} -- session key given by Splunk. Used for auth.
    """

    mobile_alerts_accessor = KvStoreAccessor(collection=constants.MOBILE_ALERTS_COLLECTION_NAME,
                                             owner="nobody",
                                             session_key=session_key)

    try:
        r, response = mobile_alerts_accessor.insert_single_item_as_json(jsonpickle.encode(alert))

        LOGGER.info("Response from KV Store: " + response.decode('ascii'))
        return json.loads(response)

    except Exception:
        LOGGER.exception("Error writing alert to KV Store")
        return {}


async def persist_recipient_devices(request_context, key, recipient_devices, alert_payload, async_client):
    """Given an alert payload generated by splunk and an alert id of the alert as it is
       stored in KV store, creates a RecipientDevice record in KV Store for each device that
       should receive the alert and persists that device in KV Store. Each post request for
       each device is handled asynchronously.

       Arguments:
           key {string} -- key of alert in KV Store
           recipient_devices {List of String} -- List of device ids which should receive alert
           alert_payload {json} -- Alert payload generated by splunk
           session_key {string} -- Session key given by the alert
           async_client {AsyncKvStoreClient} -- instance of kv store client to perform async requests
       """

    deferred_responses = []

    for device_id in recipient_devices:
        payload = RecipientDevice(alert_id=key, device_id=device_id, timestamp=alert_payload[CONFIGURATION][
            ALERT_TIMESTAMP_FIELD])
        deferred_responses.append(async_client.async_kvstore_post_request(
            collection=constants.ALERTS_RECIPIENT_DEVICES_COLLECTION_NAME,
            data=jsonpickle.encode(payload),
            auth_header=request_context.auth_header))

    # wait until all requests have completed
    responses = await asyncio.gather(*deferred_responses, return_exceptions=True)

    successes = []
    exceptions = []

    for i in range(len(responses)):
        if isinstance(responses[i], Exception):
            exceptions.append(responses[i])
        else:
            successes.append(responses[i])

    LOGGER.info("Finished persisting devices with responses=%s", str([r.code for r in responses]))

    if exceptions:
        LOGGER.error("Encountered exceptions persisting recipient devices, e=%s", str(exceptions))


async def should_send(request_context: RequestContext,
                      async_kvstore_client: AsyncKvStoreClient,
                      notification: Notification,
                      device_id: str):
    """
    should_send determines if a notification should be sent to a particular device.
    Currently just checks for snoozing, if the alert is snoozed for that device, then we shouldn't send it

    :param request_context: Context for authenticating with KVStore
    :param async_kvstore_client: Client to talk with KVStore
    :param notification: Notification which is going to be sent to the device
    :param device_id: ID of the device in question
    :return: True if the notification should be sent, else False
    """

    current_timestamp = str(get_current_timestamp())

    # First we will check for snoozing, and if the alert is snoozed, we will ignore it

    # Query fetches all snoozes with the correct device ID, and are not expired yet, i.e. end_time > now
    query = {constants.AND_OPERATOR: [{constants.DEVICE_ID: device_id},
                                      {constants.END_TIME: {constants.GREATER_THAN_OPERATOR: current_timestamp}}]}
    params = {constants.QUERY: json.dumps(query)}
    LOGGER.debug('Fetching scoped snoozes with params %s', params)

    snoozed_scopes = await async_kvstore_client.async_kvstore_get_request(
        collection=constants.SNOOZED_SCOPES_COLLECTION_NAME,
        auth_header=request_context.auth_header,
        params=params
    )
    if snoozed_scopes.code != HTTPStatus.OK:
        err_text = await snoozed_scopes.text()
        LOGGER.info('Failed to fetch snoozes while sending notifications with message %s', err_text)
        return True

    snoozed_scopes_json = await snoozed_scopes.json()
    for snoozed_scopes in snoozed_scopes_json:
        # TODO: Add logic to handle other types of snoozes after v1.0 of alert snoozing
        snoozed_scope = ScopedSnooze.from_json(snoozed_scopes)
        if snoozed_scope.scope == constants.SNOOZE_ALL_SCOPE:
            LOGGER.debug('Not sending notification as all alerts are snoozed for device with id %s', device_id)
            return False

    return True


async def send_push_notifications(request_context,
                                  notification,
                                  recipient_devices,
                                  async_kvstore_client,
                                  async_spacebridge_client,
                                  async_splunk_client):
    """
    Given a notification object and a list of device ids, sends a post request to the Spacebridge notifications
    api for each device id
    :param request_context:
    :param notification: notification object to be sent
    :param recipient_devices: list of device id strings
    :param async_kvstore_client: AsyncKVStoreClient
    :param async_spacebridge_client: AsyncSpacebridgeClient
    :param async_splunk_client: AsyncSpacebridgeClient
    :return:
    """

    sodium_client = SodiumClient(LOGGER.getChild('sodium_client'))
    sign_keys_response = await async_splunk_client.async_get_sign_credentials(request_context.auth_header)

    if sign_keys_response[0] == HTTPStatus.OK:

        encryption_keys = EncryptionKeys(b64decode(sign_keys_response[1]['sign_public_key']),
                                         b64decode(sign_keys_response[1]['sign_private_key']), None, None)
        encryption_context = EncryptionContext(encryption_keys, sodium_client)

    else:
        LOGGER.exception("Unable to fetch encryption keys with error_code=%s", str(sign_keys_response[0]))
        raise EncryptionKeyError(sign_keys_response[1], sign_keys_response[0])

    sender_id = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)
    sender_id_hex = py23.encode_hex_str(sender_id)

    headers = {'Content-Type': 'application/x-protobuf', 'Authorization': sender_id_hex}
    deferred_responses = []

    signer = partial(sign_detached, sodium_client, encryption_context.sign_private_key())

    for device_id_str in recipient_devices:
        device_id = device_id_str.encode('utf-8')
        device_id_raw = b64decode(device_id)

        try:
            if not await should_send(request_context, async_kvstore_client, notification, device_id_str):
                continue

            _, receiver_encrypt_public_key = await public_keys_for_device(device_id_raw,
                                                                          request_context.auth_header,
                                                                          async_kvstore_client)

            encryptor = partial(encrypt_for_send,
                                sodium_client,
                                receiver_encrypt_public_key)

            LOGGER.info("Sending notification alert_id=%s, device_id=%s", notification.alert_id, device_id)
            notification_request = notifications.build_notification_request(device_id, device_id_raw, sender_id,
                                                                            notification,
                                                                            encryptor, signer)

            # Send post request asynchronously
            deferred_responses.append(async_spacebridge_client.async_send_notification_request(
                auth_header=SpacebridgeAuthHeader(sender_id),
                data=notification_request.SerializeToString(),
                headers=headers))

        except KeyNotFoundError:
            LOGGER.info("Public key not found for device_id=%s", device_id)
        except SodiumOperationError:
            LOGGER.warn("Sodium operation failed! device_id=%s", device_id)

    # Wait until all the post requests have returned
    responses = await asyncio.gather(*deferred_responses, return_exceptions=True)

    successes = []
    exceptions = []

    # Convert device set to list for indexing while parsing responses
    recipient_devices_list = list(recipient_devices)

    # Parse responses and split up exceptions from successful results
    for i in range(len(responses)):
        if isinstance(responses[i], Exception):
            exceptions.append((recipient_devices[i], responses[i]))
        else:
            code = responses[i].code
            msg = await responses[i].text()
            successes.append((recipient_devices_list[i], code, msg))

    LOGGER.info("Finished sending push notifications with responses=%s", str(successes))

    if exceptions:
        LOGGER.error("Encountered exceptions sending pushing notifications to devices=%s", str(exceptions))


# Helper object for Dashboard objects which can be returned in deferred
class DashboardTuple(object):
    """
    Helper object to pass around dashboard objects in deferred
    """

    def __init__(self, dashboard_description=None, list_dashboard_data={}):
        self.dashboard_description = dashboard_description
        self.list_dashboard_data = list_dashboard_data


async def fetch_dashboard_url_dashboard_tuple(request_context,
                                              dashboard_url=None,
                                              async_splunk_client=None,
                                              async_kvstore_client=None,
                                              input_tokens=None):
    """
    Helper method which fetches dashboard objects from a dashboard_url
    :param request_context:
    :param dashboard_url:
    :param async_splunk_client:
    :param async_kvstore_client:
    :return:
    """
    # Fetch Dashboard Description, for alerts don't return params
    try:
        dashboard_description = await fetch_dashboard_description(request_context,
                                                                  dashboard_id=dashboard_url,
                                                                  show_refresh=False,
                                                                  async_splunk_client=async_splunk_client,
                                                                  async_kvstore_client=async_kvstore_client)

        set_default_token_values(input_tokens, dashboard_description.input_tokens)
        # Find all the visualizations in the dashboard and get the data
        list_dashboard_data = await get_list_dashboard_data(dashboard_description=dashboard_description,
                                                            request_context=request_context,
                                                            input_tokens=input_tokens,
                                                            async_splunk_client=async_splunk_client)

        LOGGER.info("DashboardData List Size len=%d", len(list_dashboard_data))
        return DashboardTuple(dashboard_description, list_dashboard_data)
    except Exception as e:
        LOGGER.exception("Exception fetching dashboard=%s", str(dashboard_url))
        return DashboardTuple()


async def fetch_search_job_dashboard_tuple(request_context, alert_payload, async_splunk_client=None):
    """
    Helper method to fetch dashboard objects from a search_job
    :param request_context:
    :param alert_payload:
    :param async_splunk_client:
    :return:
    """
    app_name = alert_payload[APP]
    owner = alert_payload[OWNER]
    search_id = alert_payload[SEARCH_ID]
    configuration = alert_payload[CONFIGURATION]
    alert_message = configuration[ALERT_MESSAGE]
    alert_subject = configuration[ALERT_SUBJECT]
    list_dashboard_data = []

    # Get search_content_when_done, function will retry until search job is_done
    search_job_content = await get_search_job_content(auth_header=request_context.auth_header,
                                                      owner=owner,
                                                      app_name=app_name,
                                                      search_id=search_id,
                                                      async_splunk_client=async_splunk_client)

    if not search_job_content:
        return DashboardTuple()

    # Create fake dashboard_description
    display_app_name = await fetch_display_app_name(request_context, app_name, async_splunk_client)
    dashboard_description = create_dashboard_description_table(owner=owner,
                                                               app_name=app_name,
                                                               display_app_name=display_app_name,
                                                               description=alert_message,
                                                               visualization_title=alert_subject,
                                                               query=get_string_field('reportSearch',
                                                                                      search_job_content.properties))

    # Pluck out the visualization to retreive the visualization_id
    dashboard_visualization = dashboard_description.get_first_visualization()

    # Create the fake dashboard_visualization_id
    dashboard_visualization_id = DashboardVisualizationId(dashboard_id=dashboard_description.dashboard_id,
                                                          visualization_id=dashboard_visualization.id)

    # Append dashboard_data based on search_id with fake dashboard_visualization_id
    dashboard_data = await get_search_job_dashboard_data(request_context,
                                                         owner=owner,
                                                         app_name=app_name,
                                                         search_id=search_id,
                                                         dashboard_visualization_id=dashboard_visualization_id,
                                                         async_splunk_client=async_splunk_client)
    list_dashboard_data.append(dashboard_data)

    return DashboardTuple(dashboard_description, list_dashboard_data)


async def build_alert(request_context, alert_payload=None, async_splunk_client=None, async_kvstore_client=None):
    """
    Takes an alert payload and a session key and creates an Alert object
    which is to be persisted into KV Store. The session key is required
    because a network call needs to be made to fetch the attached dashboard's
    metadata.

    :param request_context:
    :param alert_payload: {json} -- payload of alert sent by Splunk on alert trigger
    :param async_splunk_client:
    :param async_kvstore_client:
    :return: Alert -- alert object which contains all the necessary information for the alert,
        which is to be persisted into KV Store.
    """

    configuration = alert_payload[CONFIGURATION]
    dashboard_url = None
    dashboard_tuple = DashboardTuple()

    if configuration[DASHBOARD_TOGGLE] == ATTACH_DASHBOARD_TOGGLE and ALERT_DASHBOARD_ID in configuration.keys():
        dashboard_url = configuration[ALERT_DASHBOARD_ID]
        if alert_payload[RESULT] and configuration[FIELDNAME] in alert_payload[RESULT].keys():
            input_tokens = {configuration[TOKEN]: alert_payload[RESULT][configuration[FIELDNAME]]}
        else:
            input_tokens = {}

        # Fetch Dashboard Description, for alerts don't return params
        dashboard_tuple = await fetch_dashboard_url_dashboard_tuple(request_context,
                                                                    dashboard_url,
                                                                    async_splunk_client,
                                                                    async_kvstore_client,
                                                                    input_tokens=input_tokens)

    elif configuration[DASHBOARD_TOGGLE] == ATTACH_TABLE_TOGGLE:
        dashboard_tuple = await fetch_search_job_dashboard_tuple(request_context,
                                                                 alert_payload,
                                                                 async_splunk_client)

    call_to_action = CallToAction(uri=configuration[CALL_TO_ACTION_URL],
                                  title=configuration[CALL_TO_ACTION_LABEL])

    display_app_name = await fetch_display_app_name(request_context, alert_payload[APP], async_splunk_client)
    notification = Notification(alert_id=configuration[ALERT_ID],
                                severity=configuration[SEVERITY],
                                description=configuration[ALERT_MESSAGE],
                                title=configuration[SUBJECT],
                                created_at=configuration[ALERT_TIMESTAMP_FIELD],
                                call_to_action=call_to_action,
                                app_name=alert_payload[APP],
                                display_app_name=display_app_name)

    detail = Detail(results_link=alert_payload[RESULTS_LINK],
                    search_id=alert_payload[SEARCH_ID],
                    owner=alert_payload[OWNER],
                    dashboard_id=dashboard_url,
                    dashboard_description=dashboard_tuple.dashboard_description,
                    list_dashboard_data=dashboard_tuple.list_dashboard_data,
                    search_name=alert_payload[SEARCH_NAME],
                    result_json=alert_payload[SAVED_SEARCH_RESULT])

    alert = Alert(notification=notification, detail=detail)
    return alert


if __name__ == "__main__":
    try:
        PAYLOAD = json.loads(sys.stdin.read())

        # Run a one off asynchronous coroutine using asyncio
        asyncio.run(trigger(PAYLOAD))
    except Exception:
        LOGGER.exception("Encountered unexpected error while triggering mobile alert")
