"""
(C) 2019 Splunk Inc. All rights reserved.

Module providing client for making asynchronous requests using asyncio about Splunk server info
"""

from http import HTTPStatus
import splunk.rest as rest
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient


class AioServerInfoClient(AioHttpClient):

    def __init__(self, uri=None, proxy=None, verify_ssl=True):
        if not uri:
            uri = rest.makeSplunkdUri()

        self.uri = uri
        super(AioServerInfoClient, self).__init__(proxy=proxy, verify_ssl=verify_ssl)

    def async_get_server_info(self, auth_header):
        uri = '{}/services/server/info'.format(self.uri)
        return self.get(uri=uri, auth_header=auth_header, params={'output_mode': 'json'})

    def async_get_shc_captain_info(self, auth_header):
        """
        Async api call to get /shcluster/captain/info
        :param auth_header:
        :return:
        """
        uri = '{}/services/shcluster/captain/info'.format(self.uri)
        return self.get(uri=uri, auth_header=auth_header, params={'output_mode': 'json'})

    async def async_is_shc_member(self, auth_header):
        """
        Async helper method to determine if server is a search head cluster member
        :param auth_header:
        :return:
        """
        response = await self.async_get_server_info(auth_header)

        if response.status == HTTPStatus.OK:
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

        if response.status == HTTPStatus.OK:
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

        if response.status == HTTPStatus.OK:
            json = await response.json()
            content = json['entry'][0]['content']
            if content['service_ready_flag'] and not content['maintenance_mode']:
                return True
        return False
