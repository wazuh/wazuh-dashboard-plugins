"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module providing client for making asynchronous requests about Splunk server info
"""
from http import HTTPStatus
from spacebridgeapp.rest.clients.async_non_ssl_client import AsyncNonSslClient
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_async_server_info_client.log", "async_splunk_client")


class AsyncServerInfoClient(AsyncNonSslClient):
    def __init__(self, uri):
        """
        :param uri: string representing uri to make request to
        """
        self.uri = uri
        super(AsyncServerInfoClient, self).__init__()

    def async_get_server_info(self, auth_header):
        """
        Async api call to get /server/info
        :param auth_header:
        :return:
        """
        uri = '{}/services/server/info'.format(self.uri)
        return self.async_get_request(uri=uri, auth_header=auth_header, params={'output_mode': 'json'})

    def async_get_shc_captain_info(self, auth_header):
        """
        Async api call to get /shcluster/captain/info
        :param auth_header:
        :return:
        """
        uri = '{}/services/shcluster/captain/info'.format(self.uri)
        return self.async_get_request(uri=uri, auth_header=auth_header, params={'output_mode': 'json'})


    async def async_is_shc_member(self, auth_header):
        """
        Async helper method to determine if server is a search head cluster member
        :param auth_header:
        :return:
        """
        response = await self.async_get_server_info(auth_header)

        if response.code == HTTPStatus.OK:
            json = await response.json()
            server_roles = json['entry'][0]['content']['server_roles']
            for sh in ['shc_member', 'shc_captain']:
                if sh in server_roles:
                    return True
        return False

    async def async_is_captain(self, auth_header):
        """
        Async helper method to determine if server is a search head cluster captain
        :param auth_header:
        :return:
        """
        response = await self.async_get_server_info(auth_header)

        if response.code == HTTPStatus.OK:
            json = await response.json()
            server_roles = json['entry'][0]['content']['server_roles']
            if 'shc_captain' in server_roles:
                return True
        return False

    async def async_is_captain_ready(self, auth_header):
        """
        Async helper method to determine if search head cluster captain has been elected
        :param auth_header:
        :return:
        """
        response = await self.async_get_shc_captain_info(auth_header)

        if response.code == HTTPStatus.OK:
            json = await response.json()
            content = json['entry'][0]['content']
            if content['service_ready_flag'] and not content['maintenance_mode']:
                return True
        return False
