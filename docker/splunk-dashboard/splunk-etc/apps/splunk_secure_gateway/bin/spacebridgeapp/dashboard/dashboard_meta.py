"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to retrieve dashboard_meta
"""

import jsonpickle
import sys
from http import HTTPStatus
from spacebridgeapp.data.dashboard_data import UserDashboardMeta
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, DASHBOARD_META_COLLECTION_NAME
from spacebridgeapp.logging import setup_logging

if sys.version_info < (3, 0):
    import urllib

else:
    import urllib.parse as urllib


LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_dashboard_meta.log", "dashboard_meta")


async def fetch_dashboard_meta(request_context,
                               dashboard_id=None,
                               async_kvstore_client=None):
    """
    Helper to fetch dashboard_meta
    :param request_context:
    :param dashboard_id:
    :param async_kvstore_client:
    :return:
    """
    # Only set the key_id if a dashboard_id is provided
    key_id = urllib.quote_plus(dashboard_id) if dashboard_id else None
    response = await async_kvstore_client.async_kvstore_get_request(collection=DASHBOARD_META_COLLECTION_NAME,
                                                                    auth_header=request_context.auth_header,
                                                                    owner=request_context.current_user,
                                                                    key_id=key_id)
    if response.code == HTTPStatus.OK:
        response_json = await response.json()
        if response_json and dashboard_id:
            dashboard_meta = UserDashboardMeta.from_json(response_json)
            return dashboard_meta
        # If the response is the whole meta collection, return a list of dashboard metas
        elif response_json and dashboard_id is None:
            dashboard_meta = {}
            for meta in response_json:
                meta_obj = UserDashboardMeta.from_json(meta)
                dashboard_meta[meta_obj.dashboard_id()] = meta_obj
            return dashboard_meta
    elif response.code != HTTPStatus.NOT_FOUND:
        error = await response.text()
        error_message = "Failed to fetch Dashboard Meta. status_code={}, error={}".format(response.code, error)
        raise SpacebridgeApiRequestError(message=error_message, status_code=response.code)

    # Return None no data if meta isn't available
    return None


async def set_dashboard_meta(request_context, dashboard_meta=None, async_kvstore_client=None):
    """
    Helper to set dashboard_meta object
    :param request_context:
    :param dashboard_meta:
    :param async_kvstore_client:
    :return:
    """
    # Get dashboard_meta collection if key exists
    dashboard_id = dashboard_meta.dashboard_id()
    response = await fetch_dashboard_meta(request_context=request_context,
                                          dashboard_id=dashboard_id,
                                          async_kvstore_client=async_kvstore_client)

    # if key doesn't exist we create new key, otherwise update existing one
    if response is None:
        # Create new dashboard_meta collection
        response = await async_kvstore_client.async_kvstore_post_request(
            collection=DASHBOARD_META_COLLECTION_NAME,
            data=jsonpickle.encode(dashboard_meta, unpicklable=False),  # Don't write py/object field
            owner=request_context.current_user,
            auth_header=request_context.system_auth_header)
    else:
        # Update existing collection
        response = await async_kvstore_client.async_kvstore_post_request(
            collection=DASHBOARD_META_COLLECTION_NAME,
            data=jsonpickle.encode(dashboard_meta, unpicklable=False),  # Don't write py/object field
            key_id=urllib.quote_plus(dashboard_id),  # To update a collection we need to specify the key
            owner=request_context.current_user,
            auth_header=request_context.system_auth_header)

    # Report any errors
    if response.code != HTTPStatus.OK and response.code != HTTPStatus.CREATED:
        error = await response.text()
        error_message = "Failed Dashboard Set Request. status_code={}, error={}".format(response.code, error)
        raise SpacebridgeApiRequestError(message=error_message, status_code=response.code)

    response_json = await response.json()
    dashboard_id = response_json.get('_key')
    LOGGER.info("Successful Dashboard Set Request. dashboard_id={}".format(dashboard_id))
    return dashboard_id
