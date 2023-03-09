"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module providing client for making asynchronous requests to Spacebridge API
"""
from cloudgateway.key_bundle import KeyBundle
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient

from spacebridgeapp.rest.clients.async_client import AsyncClient
from spacebridgeapp.util.config import secure_gateway_config as config


class AsyncSpacebridgeClient(AsyncClient):

    def __init__(self, key_bundle: KeyBundle = None):
        self.https_proxy = config.get_https_proxy_settings()
        proxy_url = 'http://{}:{}'.format(self.https_proxy["host"],
                                          self.https_proxy["port"]) if self.https_proxy else None
        AsyncClient.__init__(self, client=AioHttpClient(proxy=proxy_url, key_bundle=key_bundle))

    def async_send_request(self, api, auth_header, data='', headers=None, method='POST'):
        """
        Generic Async send request
        :param api:
        :param auth_header:
        :param data:
        :param headers:
        :return:
        """
        if headers is None:
            headers = {}
        if self.https_proxy and self.https_proxy['auth']:
            headers['Proxy-Authorization'] = 'Basic ' + self.https_proxy['auth']

        rest_uri = f"https://{config.get_spacebridge_server() + api}"

        if method == 'GET':
            return self.async_get_request(uri=rest_uri,
                                          auth_header=auth_header,
                                          headers=headers)
        elif method == 'POST':
            return self.async_post_request(uri=rest_uri,
                                           auth_header=auth_header,
                                           data=data,
                                           headers=headers)

    def async_send_delete_request(self, api, auth_header, data='', headers=None):
        """
        Generic Async send request
        :param api:
        :param auth_header:
        :param data:
        :param headers:
        :return:
        """
        if headers is None:
            headers = {}

        if self.https_proxy and self.https_proxy['auth']:
            headers['Proxy-Authorization'] = 'Basic ' + self.https_proxy['auth']

        rest_uri = f"https://{config.get_spacebridge_server() + api}"

        return self.async_delete_request(uri=rest_uri,
                                         auth_header=auth_header,
                                         data=data,
                                         headers=headers)

    def async_send_notification_request(self, auth_header, data='', headers=None):
        """
        API to send notifications
        :param auth_header:
        :param data:
        :param headers:
        :return:
        """
        if headers is None:
            headers = {}

        return self.async_send_request('/api/notifications', auth_header, data, headers)

    def async_send_message_request(self, auth_header, data='', headers=None):
        """
        API to send messages
        :param auth_header:
        :param data:
        :param headers:
        :return:
        """
        if headers is None:
            headers = {}
        return self.async_send_request('/api/deployments/messages', auth_header, data, headers)

    def async_send_storage_request(self, payload, content_type, signature, auth_header, request_id):
        """
        API to store resources on spacebridge
        :param payload: Bytes
        :param content_type: MIME type
        :param signature:
        :param auth_header:
        :param request_id:
        :return:
        """

        headers = {
            'x-amz-meta-signature': signature.hex(),
            'content-type': "application/octet-stream",
            'x-amz-meta-content-type': content_type,
            'X-B3-TraceId': request_id
        }

        return self.async_send_request('/storage/assets', auth_header, data=payload, headers=headers)

    def async_get_spacebridge_discovery_urls(self, auth_header, request_id):
        """
        API to get all public, cloud-based, Spacebridge instances
        :param auth_header:
        :return:
        """

        headers = {
            'content-type': "application/octet-stream",
            'X-B3-TraceId': request_id
        }

        return self.async_send_request('/api/discovery/instances', auth_header, method='GET', headers=headers)
