"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Helper methods for validating a registration against a webhook api
"""
import requests
from http import HTTPStatus
from spacebridgeapp.rest.util import errors
from cloudgateway.mdm import CloudgatewayMdmRegistrationError
from spacebridgeapp.rest.clients.async_client import AsyncClient
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "registration_webhook")


def validate_user(webhook_url, username, verify_ssl):
    """
    Validate whether a user is allowed to register a device using a webhook. Returns true or raises an exception
    if the user is not valid. This method executes the request synchronously
    """
    try:
        r = requests.get(webhook_url, params={'username': username}, verify=verify_ssl)

        LOGGER.info("Received status_code={} for user={} from registration webhook".format(r.status_code, username))

        if r.status_code == HTTPStatus.OK:
            return True
    except Exception as e:
        raise errors.SpacebridgeRestError(
            "Failed to validate user via registration webhook with exception={}".format(e), status=HTTPStatus.FORBIDDEN)

    raise errors.SpacebridgeRestError("Failed to validate user via registration webhook with error={}".format(r.text),
                                      status=HTTPStatus.FORBIDDEN)


async def aio_validate_user(webhook_url, username, verify_ssl, async_client: AsyncClient):
    """
    Validate whether a user is allowed to register a device using a webhook. Returns true or raises an exception
    if the user is not valid. This method executes the request asynchronously
    """
    r = await async_client.async_get_request(webhook_url, None, params={'username': username}, verify_ssl=verify_ssl)

    LOGGER.info("Received status_code={} for user={} from registration webhook".format(r.code, username))

    if r.code == HTTPStatus.OK:
        return True

    response_text = await r.text()
    raise CloudgatewayMdmRegistrationError(CloudgatewayMdmRegistrationError.ErrorType.REGISTRATION_VALIDATION_ERROR,
                                           "Failed to validate user via registration webhook with status_code={}, error={}".format(
                                               r.code, response_text))
