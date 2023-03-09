from cloudgateway.key_bundle import KeyBundle
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient


class SpacebridgeAuthHeader(object):
    def __init__(self, device_id):
        self.device_id = device_id

    def __repr__(self):
        return self.device_id.hex()


class AsyncSpacebridgeClient(AioHttpClient):

    def __init__(self, config, key_bundle: KeyBundle=None):
        self.https_proxy = config.get_https_proxy_settings()
        self.config = config
        proxy_url = f'http://{self.https_proxy["host"]}:{self.https_proxy["port"]}' if self.https_proxy else None
        self.client = AioHttpClient(proxy=proxy_url, key_bundle=key_bundle)

    def async_send_request(self, api, auth_header, data='', headers={}):
        """
        Generic Async send request
        :param api:
        :param auth_header:
        :param data:
        :param headers:
        :return:
        """
        if self.https_proxy and self.https_proxy['auth']:
            headers['Proxy-Authorization'] = 'Basic ' + self.https_proxy['auth']

        rest_uri = "https://{}".format(self.config.get_spacebridge_server() + api)
        return self.client.post(uri=rest_uri,
                                auth_header=auth_header,
                                data=data,
                                headers=headers)

    def async_send_notification_request(self, auth_header, data='', headers={}):
        """
        API to send notifications
        :param auth_header:
        :param data:
        :param headers:
        :return:
        """
        return self.async_send_request('/api/notifications', auth_header, data, headers)

    def async_send_message_request(self, auth_header, data='', headers={}):
        """
        API to send messages
        :param auth_header:
        :param data:
        :param headers:
        :return:
        """
        return self.async_send_request('/api/deployments/messages', auth_header, data, headers)
