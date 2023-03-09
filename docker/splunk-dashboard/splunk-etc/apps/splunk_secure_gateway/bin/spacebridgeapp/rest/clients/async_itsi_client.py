"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module providing client for making asynchronous requests about ITSI restAPI
"""
from http import HTTPStatus
from spacebridgeapp.rest.clients.async_non_ssl_client import AsyncNonSslClient
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.string_utils import append_path_to_uri

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_async_itsi_client.log", "async_itsi_client")

GLASS_TABLE = 'glass_table'


class AsyncITSIClient(AsyncNonSslClient):
    def __init__(self, uri):
        """
        :param uri: string representing uri to make request to
        """
        self.uri = uri
        super(AsyncITSIClient, self).__init__()

    def async_get_glass_table(self, auth_header, key=None, params=None):
        """
        Make async request to itoa_interface glass_table API

        :param auth_header:
        :param key:
        :param params:
        :return:
        """
        object_type = f'{GLASS_TABLE}/{key}' if key else GLASS_TABLE
        uri = self.get_itoa_interface_endpoint_uri(object_type)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    async def async_get_glass_table_count(self, auth_header, params=None):
        """
        Make async request to itoa_interface glass_table count API

        :param auth_header:
        :param params:
        :return:
        """
        uri = self.get_itoa_interface_endpoint_uri(f'{GLASS_TABLE}/count')
        response = await self.async_get_request(uri=uri, params=params, auth_header=auth_header)

        count = 0
        if response.code == HTTPStatus.OK:
            response_json = await response.json()
            count = response_json['count']
        elif response.code == HTTPStatus.NOT_FOUND:
            LOGGER.debug(f"Unable to find ITSI API. code={response.code}")
        else:
            LOGGER.debug(f"Unable to retrieve glass_table count params={params} code={response.code}")
        return count

    def get_itoa_interface_endpoint_uri(self, object_type, encoded=True):
        """
        Create uri for itsi itoa_interface rest endpoints
        https://docs.splunk.com/Documentation/ITSI/latest/RESTAPI/ITSIRESTAPIreference#ITOA_Interface

        :param object_type:
        :param encoded:
        :return:
        """
        return append_path_to_uri(self.uri, f'servicesNS/-/SA-ITOA/itoa_interface/{object_type}', encoded=encoded)
