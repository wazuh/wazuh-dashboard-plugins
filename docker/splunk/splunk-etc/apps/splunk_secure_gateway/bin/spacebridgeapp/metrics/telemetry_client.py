"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Client to send data to the telemetry endpoint
"""

import splunk.rest as rest

from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient
from spacebridgeapp.data.telemetry_data import InstallationEnvironment
from http import HTTPStatus
from spacebridgeapp.util import constants
from spacebridgeapp.util.constants import NOBODY
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, HEADER_AUTHORIZATION, \
    HEADER_CONTENT_TYPE, APPLICATION_JSON
import requests
from spacebridgeapp.rest.clients.async_client import AsyncClient
import json
from spacebridgeapp.logging import setup_logging
import logging

from splapp_protocol import request_pb2

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_metrics.log", "metrics")

OPT_IN_VERSION = 3

def get_telemetry_uri():
    rest_uri = rest.makeSplunkdUri()
    return '%sservicesNS/%s/%s/telemetry-metric' % (
        rest_uri,
        NOBODY,
        SPACEBRIDGE_APP_NAME
    )

def create_telemetry_payload(event):
    return {
        "type": "event",
        "component": SPACEBRIDGE_APP_NAME,
        "data": event,
        # Required Version of Opt In Agreement
        "optInRequired": OPT_IN_VERSION,
    }


def post_event(event_jsn, session_token, logger):
    payload = create_telemetry_payload(event_jsn)
    logger.debug("attempting to post metrics")
    params = {
        'output_mode': 'json'
    }

    r, content = rest.simpleRequest(
        get_telemetry_uri(),
        sessionKey=session_token,
        getargs=params,
        jsonargs=json.dumps(payload),
        method='POST',
        rawResult=True
    )

    logger.info(F"Posted metrics data to telemetry with response={str(r.status)}")
    return r


async def get_telemetry_instance_id(async_client, auth_header):
    rest_uri = rest.makeSplunkdUri()
    instance_id_uri = "{}services/properties/telemetry/general/deploymentID".format(rest_uri)
    r = await async_client.async_get_request(instance_id_uri, auth_header=auth_header)
    if r.code != HTTPStatus.OK:
        error_text = await r.text()
        LOGGER.info("Could not get telemetry instance id with error={} and status={}".format(error_text, r.code))
    instance_id = await r.text()
    return instance_id


async def get_installation_environment(async_client, auth_header):
    rest_uri = rest.makeSplunkdUri()
    on_cloud_instance_uri = "{}services/properties/telemetry/general/onCloudInstance".format(rest_uri)
    r = await async_client.async_get_request(on_cloud_instance_uri, auth_header=auth_header)
    if r.code != HTTPStatus.OK:
        error_text = await r.text()
        LOGGER.info("Could not get telemetry instance id with error={} and status={}".format(error_text, r.code))
    installation_environment_response = await r.text()
    installation_environment = InstallationEnvironment.CLOUD \
        if installation_environment_response.lower().strip() == "true" \
        else InstallationEnvironment.ENTERPRISE
    return installation_environment


async def get_splunk_version(async_client, auth_header):
    """
    Gets splunk version
    :param async_client:
    :param auth_header
    :return:
    """
    rest_uri = rest.makeSplunkdUri()
    server_info_uri = "{}/services/server/info".format(rest_uri)
    r = await async_client.async_get_request(uri=server_info_uri, auth_header=auth_header,
                                             params={'output_mode': 'json'})
    if r.code != HTTPStatus.OK:
        error_text = await r.text()
        LOGGER.info("Could not get splunk version with error={} and status={}".format(error_text, r.code))
    jsn = await r.json()
    server_version = jsn['entry'][0]['content']['version']
    return server_version


class AsyncTelemetryClient(AsyncClient):
    """
    Client for making asynchronous requests to telemetry endpoint
    """

    def __init__(self):
        """
        :param uri: string representing uri to make request to
        """
        super(AsyncTelemetryClient, self).__init__(client=AioHttpClient(verify_ssl=False))
        self.telemetry_instance_id = None
        self.splunk_version = None
        self.installation_environment = None

    async def get_telemetry_instance_id(self, auth_header):
        if self.telemetry_instance_id is None:
            await self.set_telemetry_instance_id(auth_header)
        return self.telemetry_instance_id

    async def set_telemetry_instance_id(self, auth_header):
        self.telemetry_instance_id = await get_telemetry_instance_id(self, auth_header=auth_header)

    async def get_splunk_version(self, auth_header):
        if self.splunk_version is None:
            await self.set_splunk_version(auth_header)
        return self.splunk_version

    async def set_splunk_version(self, auth_header):
        self.splunk_version = await get_splunk_version(self, auth_header=auth_header)

    async def get_installation_environment(self, auth_header):
        if self.installation_environment is None:
            await self.set_installation_environment(auth_header)
        return self.installation_environment

    async def set_installation_environment(self, auth_header):
        self.installation_environment = await get_installation_environment(self, auth_header=auth_header)

    async def post_metrics(self, event, auth_header, logger):
        uri = get_telemetry_uri()

        if self.telemetry_instance_id is None:
            await self.set_telemetry_instance_id(auth_header)

        if self.splunk_version is None:
            await self.set_splunk_version(auth_header)

        if self.installation_environment is None:
            await self.set_installation_environment(auth_header)

        event.update({constants.INSTANCEID: self.telemetry_instance_id,
                      constants.SPLUNK_VERSION: self.splunk_version,
                      constants.INSTALLATION_ENVIRONMENT: self.installation_environment.name})
        if not self.telemetry_instance_id:
            self.telemetry_instance_id = await get_telemetry_instance_id(self, auth_header)
        event.update({constants.INSTANCEID: self.telemetry_instance_id})
        payload = create_telemetry_payload(event)

        try:
            r = await self.async_post_request(uri, auth_header=auth_header, data=json.dumps(payload))
            text = await r.text()
        except Exception as e:
            logger.info(str(e))
