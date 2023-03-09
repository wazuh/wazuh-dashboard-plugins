"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
import asyncio
import time
from collections import defaultdict
from http import HTTPStatus
import json

from spacebridgeapp.data.subscription_data import Subscription, SubscriptionCredential
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeError
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.request.request_processor import get_splunk_cookie
from spacebridgeapp.rest.clients.async_kvstore_client import AsyncKvStoreClient
from spacebridgeapp.rest.clients.async_splunk_client import AsyncSplunkClient
from spacebridgeapp.util import constants
from spacebridgeapp.util.kvstore import build_containedin_clause
from spacebridgeapp.util.time_utils import get_expiration_timestamp_str, get_current_timestamp_str


LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_subscription_client.log",
                       "subscription_client")


async def _ensure_valid_response(response, expected_codes, error):
    if response.code not in expected_codes:
        raw_error = await response.text()
        LOGGER.warn("http request_failed error=", raw_error)
        formatted_error = "{} status_code={} error={}".format(error, response.code, raw_error)
        raise SpacebridgeError(formatted_error, status_code=response.code)


async def _fetch_credential_data(user_auth_header,
                                 async_kvstore_client: AsyncKvStoreClient):

    credential_get_response = await async_kvstore_client.async_kvstore_get_request(
        collection=constants.SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME,
        key_id=constants.SUBSCRIPTION_CREDENTIAL_GLOBAL,
        owner=user_auth_header.username,
        auth_header=user_auth_header
    )

    await _ensure_valid_response(credential_get_response, [HTTPStatus.OK], "Failed to refresh session token")

    credential_json = await credential_get_response.json()
    credential = SubscriptionCredential.from_json(credential_json)

    return credential


class SubscriptionClient(object):
    def __init__(self,
                 kvstore_client: AsyncKvStoreClient,
                 splunk_client: AsyncSplunkClient):
        """
        :param kvstore_client:
        :param splunk_client:
        """
        self.kvstore_client = kvstore_client
        self.splunk_client = splunk_client
        self._reset()

    def on_ping(self, username, user_auth_header, subscription_id: str):
        LOGGER.debug("Recording ping for user=%s, subscription_id=%s", username, subscription_id)
        self.user_credentials[username] = user_auth_header
        self.user_subscriptions.add(subscription_id)

    def _reset(self):
        self.user_credentials = {}
        self.user_subscriptions = set()

    async def flush(self, auth_header):
        try:
            await self._flush(auth_header,
                              validate_fn=self._validate,
                              extend_subs_fn=self._batch_extend_subs,
                              update_credentials_fn=self._batch_update_credentials)
        except (SpacebridgeError, asyncio.TimeoutError):
            LOGGER.exception("failed to flush cache")
        except Exception as e:
            LOGGER.exception("Unhandled error flushing cache")
            raise e

    async def _flush(self, auth_header,
                     validate_fn, extend_subs_fn, update_credentials_fn):
        LOGGER.debug("Flushing subscription cache credentials=%s, subscriptions=%s",
                     len(self.user_credentials), len(self.user_subscriptions))
        tmp_credentials = self.user_credentials
        tmp_subscriptions = self.user_subscriptions
        self._reset()
        valid_users = []
        for username, token in tmp_credentials.items():
            is_valid = await validate_fn(token)
            if is_valid:
                valid_users.append(username)

        await asyncio.gather(extend_subs_fn(auth_header, tmp_subscriptions),
                             update_credentials_fn(tmp_credentials))
        LOGGER.debug("Flush complete, subscriptions=%s, credentials=%s", len(tmp_subscriptions), len(valid_users))

    async def _validate(self, auth_token):
        response = await self.splunk_client.async_get_current_context(auth_header=auth_token)
        if response.code == HTTPStatus.OK:
            return True

        return False

    async def _batch_extend_subs(self, auth_header, subscription_ids):

        LOGGER.debug("Updating subscriptions=%s", len(subscription_ids))

        if not subscription_ids:
            return

        containedin = build_containedin_clause(constants.KEY, list(subscription_ids))
        params = {constants.QUERY: json.dumps(containedin)}

        response = await self.kvstore_client.async_kvstore_get_request(
            collection=constants.SUBSCRIPTIONS_COLLECTION_NAME,
            params=params,
            auth_header=auth_header
        )

        await _ensure_valid_response(response, [HTTPStatus.OK], "Failed to retrieve subscriptions")

        subscriptions = await response.json()

        subscriptions = [Subscription.from_json(subscription_json) for subscription_json in subscriptions]

        for subscription in subscriptions:
            subscription.expired_time = get_expiration_timestamp_str(ttl_seconds=subscription.ttl_seconds)
            subscription.last_update_time = get_current_timestamp_str()

        subscriptions = [subscription.__dict__ for subscription in subscriptions]

        await self.kvstore_client.async_batch_save_request(
            auth_header=auth_header,
            collection=constants.SUBSCRIPTIONS_COLLECTION_NAME,
            entries=subscriptions)

    async def _update_credential(self, user, auth_header):
        ctx = RequestContext(auth_header, current_user=user)
        credential = await _fetch_credential_data(auth_header, self.kvstore_client)

        if credential.session_type == constants.SPLUNK_SESSION_TOKEN_TYPE:
            temporary_session_key = await get_splunk_cookie(request_context=ctx,
                                                            async_splunk_client=self.splunk_client,
                                                            username=ctx.auth_header.username,
                                                            password=ctx.auth_header.password)

            credential.session_key = temporary_session_key

        credential.last_update_time = get_current_timestamp_str()

        LOGGER.debug("flush update credentials")
        credential_post_response = await self.kvstore_client.async_kvstore_post_request(
            collection=constants.SUBSCRIPTION_CREDENTIALS_COLLECTION_NAME,
            data=credential.to_json(),
            owner=ctx.current_user,
            key_id=constants.SUBSCRIPTION_CREDENTIAL_GLOBAL,
            auth_header=auth_header
        )

        if credential_post_response.code != HTTPStatus.OK:
            error_message = await credential_post_response.text()
            raise SpacebridgeError(error_message, status_code=credential_post_response.code)
        LOGGER.debug("Updated credentials for username=%s", user)

    async def _batch_update_credentials(self, credentials):
        LOGGER.debug("Updating credentials=%s", len(credentials))
        for user, auth_header in credentials.items():
            try:
                await self._update_credential(user, auth_header)
            except SpacebridgeError as e:
                LOGGER.warn("Failed to update credential user=%s, error=%s, status_code=%s", user, str(e), e.status_code)
