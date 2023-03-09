"""
(C) 2019 Splunk Inc. All rights reserved.

Configuration utility
"""

import base64
import os
from enum import Enum
from abc import ABCMeta, abstractmethod

from cloudgateway.private.util.constants import DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT

# The below Splunk clilib import is required to load the cloudgateway.conf file however
# when running in standalone mode we don't have access to splunk's python. When running in standalone 
# mode we want this import to just be a no-op and the easiest way to just put it in a
# try/catch. The code that relies on this import already has exception handling in place
# so if this import fails, the implication is we wont currently be able to fetch proxy settings
# in stand alone mode which is fine for the current use cases.
try:
    from splunk.clilib import cli_common as cli
except:
    pass


def parse_proxy_settings(proxy_url, default_port=DEFAULT_HTTP_PORT):
    """
    Helper to parse our proxy settings
    :param proxy_url:
    :param default_port:
    :return:
    """
    if proxy_url is None:
        return {}

    # Strip https:// or http://
    url = proxy_url.replace('http://', '')
    url = url.replace('https://', '').strip()

    # Split by '@', indicates basic authentication
    if '@' in url:
        auth, proxy_host_port = url.split('@')
    else:
        auth, proxy_host_port = None, url

    # Split by ':'
    if ':' in proxy_host_port:
        host, port = proxy_host_port.split(':')
    else:
        host = proxy_host_port
        port = default_port

    if auth is not None:
        auth = base64.b64encode(auth).strip()
    else:
        auth = None

    return {'host': host, 'port': int(port), 'auth': auth}


def get_ws_proxy_settings(proxy_url, default_port=DEFAULT_HTTP_PORT):
    """
    This is a helper method to break up a proxy_url into the components required for WebSocketClientFactory proxy setup

    The WebSocketClientFactory required params in the following formats:

    proxy = {'host': 'hostname', 'port': port}
    headers['Proxy-Authentication'] = 'Basic ' + basic_authentication

    :param proxy_url:
    :param default_port:
    :return: proxy dictionary and basic_authentication, None in both cases if not available
    """
    if proxy_url is None:
        return None, None

    # Initialize return variables
    proxy = None

    # Parse proxy url
    proxy_settings = parse_proxy_settings(proxy_url, default_port)
    auth = proxy_settings['auth']
    host = proxy_settings['host']
    port = proxy_settings['port']

    if host is not None and port is not None:
        proxy = {'host': host, 'port': port}

    return proxy, auth


class CloudgatewaySdkConfig(object):
    """
    Abstract class for parsing configuration based information. Any child class needs to implement the
    the below methods necessary for the SDK such as fetching proxy information, spacebridge server info, etc.
    """
    __metaclass__ = ABCMeta

    @abstractmethod
    def get_spacebridge_server(self):
        raise NotImplementedError

    def get_spacebridge_domain(self):
        return 'https://' + self.get_spacebridge_server()

    @abstractmethod
    def get_https_proxy(self):
        raise NotImplementedError

    @abstractmethod
    def get_proxies(self):
        raise NotImplementedError

    @abstractmethod
    def get_ws_https_proxy_settings(self):
        raise NotImplementedError

    @abstractmethod
    def get_https_proxy_settings(self):
        raise NotImplementedError


class SplunkConfig(CloudgatewaySdkConfig):

    """
    Splunk specific configuration parsing. Fetches proxy info from server.conf
    """

    # Setup Keys
    SETUP = 'setup'
    SPACEBRIDGE_SERVER = 'spacebridge_server'

    # Config defaults
    DEFAULT_SPACEBRIDGE_SERVER = "prod.spacebridge.spl.mobi"
    DEFAULT_SPACEBRIDGE_DISCOVERY_SERVER = "http.us-east-1.spacebridge.splunkcx.com"

    def __init__(self,
                 spacebridge_server=DEFAULT_SPACEBRIDGE_SERVER,
                 spacebridge_discovery_server=DEFAULT_SPACEBRIDGE_DISCOVERY_SERVER):
        self.spacebridge_server = spacebridge_server
        self.spacebridge_discovery_server = spacebridge_discovery_server

    def get_spacebridge_server(self):
        return self.spacebridge_server

    def get_spacebridge_discovery_server(self):
        return self.spacebridge_discovery_server

    def get_https_proxy(self):
        try:
            proxy_cfg = cli.getConfStanza('server', 'proxyConfig')
            return proxy_cfg.get('https_proxy')
        except Exception:
            return None

    def get_proxies(self):
        try:
            proxies = {}
            proxy_cfg = cli.getConfStanza('server', 'proxyConfig')

            # get http_proxy
            http_proxy = proxy_cfg.get('http_proxy')
            if http_proxy:
                proxies['http'] = http_proxy

            # get https_proxy
            https_proxy = proxy_cfg.get('https_proxy')
            if https_proxy:
                proxies['https'] = https_proxy

            return proxies
        except Exception:
            return {}

    def get_ws_https_proxy_settings(self):
        """
        Helper to get https proxy settings for WebSocket config usage
        :return:
        """
        return get_ws_proxy_settings(self.get_https_proxy(), DEFAULT_HTTPS_PORT)

    def get_https_proxy_settings(self):
        """
        Helper to get https proxy settings for twisted config usage
        :return:
        """
        return parse_proxy_settings(self.get_https_proxy(), DEFAULT_HTTPS_PORT)


