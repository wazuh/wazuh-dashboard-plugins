"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Configuration utility
"""
import logging
import os
import time
import sys

from splunk.clilib import cli_common as cli
from splunk.clilib.bundle_paths import get_base_path
from spacebridgeapp.util import py23
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT
from spacebridgeapp.util.test_state import get_test_state


def read_config(appname, conf_filename):
    if get_test_state():
        app_path = os.path.join(get_base_path(), appname)
        config = cli.getAppConf(conf_filename, appname, use_btool=False, app_path=app_path)
    else:
        config = cli.getMergedConf(conf_filename)

    return config


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
        host = f'{auth}@{host}'
        auth = py23.b64encode_to_str(auth.encode('utf-8')).strip()
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


class SecureGatewayConfig(object):
    """
    Class to encapsulate configuration settings for secure gateway configuration.
    """

    # Setup Keys
    SETUP = 'setup'
    SPACEBRIDGE_SERVER = 'spacebridge_server'
    SPACEBRIDGE_DISCOVERY_SERVER = "spacebridge_discovery_server"
    # The load balancer address should have the following format: <proxy>://<host>:<port>/
    LOAD_BALANCER_ADDRESS = 'load_balancer_address'
    LOG_LEVEL = 'log_level'
    ASYNC_TIMEOUT = 'async_timeout'
    MTLS = 'mtls'
    OIA = 'oia'

    # Client Config
    CLIENT = 'client'
    REQUEST_TIMEOUT_SECS = 'request_timeout_secs'

    # Websocket
    WEBSOCKET = 'websocket'
    RECONNECT_MAX_DELAY = 'reconnect_max_delay'

    # Subscription Keys
    SUBSCRIPTION = 'subscription'
    # The amount of time in seconds before ssg_subscription_modular_input is restarted
    MANAGER_LIFETIME_SECONDS = 'manager_lifetime_seconds'
    MANAGER_INTERVAL_SECONDS = 'manager_interval_seconds'

    # US Spacebridge Defaults, used when Instance Config KVStore is empty
    DEFAULT_HTTP_DOMAIN = 'http.us-east-1.spacebridge.splunkcx.com'
    DEFAULT_GRPC_DOMAIN = 'grpc.us-east-1.spacebridge.splunkcx.com'
    DEFAULT_INSTANCE_ID = 'spacebridge-us-east-1'

    # Dashboard Keys
    DASHBOARD = 'dashboard'
    # The maximum number of dashboards that can be requested
    DASHBOARD_LIST_MAX_COUNT = 'dashboard_list_max_count'

    # ProxyConfig
    PROXY_CONFIG = 'proxyConfig'
    HTTP_PROXY = 'http_proxy'
    HTTPS_PROXY = 'https_proxy'

    # Registration keys
    REGISTRATION = 'registration'
    REGISTRATION_WEBHOOK_URL = 'registration_webhook_url'
    WEBHOOK_VERIFY_SSL = 'webhook_verify_ssl'

    # Config defaults
    DEFAULT_SPACEBRIDGE_SERVER = "http.us-east-1.spacebridge.splunkcx.com"
    DEFAULT_SPACEBRIDGE_DISCOVERY_SERVER = "http.us-east-1.spacebridge.splunkcx.com"
    DEFAULT_REQUEST_TIMEOUT_SECS = '30'
    DEFAULT_ASYNC_TIMEOUT_SECS = '15'
    DEFAULT_DASHBOARD_LIST_MAX_COUNT = '0'
    DEFAULT_CONFIG_TIMEOUT = 300

    def __init__(self, appname, conf_filename):
        self.appname = appname
        self.conf_filename = conf_filename
        self.app_path = os.path.join(get_base_path(), appname)

        # Time of last modification for appname's conf_file in the local dir, used for checking for updates
        self.conf_mtime = self._get_local_config_mtime()

        self._build_config()

    def _build_config(self):
        # In unit testing scenario we don't want to use btool
        self.config = read_config(self.appname, self.conf_filename)

        # Initialize top level config values
        self.setup = self.config.get(self.SETUP, {})
        self.client = self.config.get(self.CLIENT, {})
        self.registration = self.config.get(self.REGISTRATION, {})
        self.dashboard = self.config.get(self.DASHBOARD, {})

        # Initialize SETUP config values
        self.async_timeout = self.setup.get(self.ASYNC_TIMEOUT, "")
        self.mtls_enabled = self.setup.get(self.MTLS, 'False')

        self.spacebridge_server = self.setup.get(self.SPACEBRIDGE_SERVER, "")
        self.spacebridge_discovery_server = self.setup.get(self.SPACEBRIDGE_DISCOVERY_SERVER,
                                                           self.DEFAULT_SPACEBRIDGE_DISCOVERY_SERVER)

        self.spacebridge_domain = 'https://' + self.spacebridge_server
        self.log_level = self.setup.get(self.LOG_LEVEL)
        self.load_balancer_address = self.setup.get(self.LOAD_BALANCER_ADDRESS, "")

        self.oia = self.setup.get(self.OIA, 'False')

        # Initialize CLIENT config values
        self.request_timeout_secs = self.client.get(self.REQUEST_TIMEOUT_SECS, "")

        # Initialize REGISTRATION config values
        self.registration_webhook_url = self.registration.get(self.REGISTRATION_WEBHOOK_URL, None)
        self.webhook_verify_ssl = self.registration.get(self.WEBHOOK_VERIFY_SSL, 'true')

        # Initialize DASHBOARD config values
        self.dashboard_list_max_count = self.dashboard.get(self.DASHBOARD_LIST_MAX_COUNT,
                                                           self.DEFAULT_DASHBOARD_LIST_MAX_COUNT)

        # //---  Proxy initialization logic ---//

        # Initialize proxy config
        self.proxy_cfg = self.config.get(self.PROXY_CONFIG, None)

        # Initialize HTTP and HTTPS proxy values
        try:
            if not self.proxy_cfg:
                self.proxy_cfg = cli.getConfStanza('server', self.PROXY_CONFIG)
        except:
            self.proxy_cfg = None

        try:
            self.https_proxy = self.proxy_cfg.get(self.HTTPS_PROXY)
        except:
            self.https_proxy = None

        try:
            self.http_proxy = self.proxy_cfg.get(self.HTTP_PROXY)
        except:
            self.http_proxy = None

        # Initialize Proxies Dict
        self.proxies = {}

        if self.http_proxy:
            self.proxies['http'] = self.http_proxy

        if self.https_proxy:
            self.proxies['https'] = self.https_proxy

        # Initialize HTTPS Proxy Settings
        self.https_proxy_settings = parse_proxy_settings(self.https_proxy, DEFAULT_HTTPS_PORT)

        # Initialize WebSocket HTTPS Proxy Settings
        if self.https_proxy is None:
            self.ws_https_proxy_settings = None, None
        else:
            proxy = None
            auth = self.https_proxy_settings['auth']
            host = self.https_proxy_settings['host']
            port = self.https_proxy_settings['port']

            if host is not None and port is not None:
                proxy = {'host': host, 'port': port}

            self.ws_https_proxy_settings = proxy, auth

    def _get_local_config_mtime(self) -> int:
        """
        Helper to get the last modification time of the conf_file in the local app directory.

        The time is returned as a float if the file exists, and -1 if the conf file doesn't exist in the local dir.
        """
        local_path = os.path.join(self.app_path, "local", self.conf_filename + ".conf")

        if os.path.exists(local_path):
            return os.path.getmtime(local_path)

        # If conf file doesn't exist in local dir, return -1 as time last modified
        return -1

    def _get_config_as_int(self, value: str, default: str) -> int:
        """
        Helper to convert config to int.

        Unfortunately this exists because the config is provided as a string, therefore we must validate
        the value to contain digits before defaulting or casting. It is unsafe to just initialize the field
        as the default parameter in the case if we expect an int, but are given a garbage string.

        :return:
        """
        return int(value) if value.isdigit() else int(default)

    def _get_config_as_bool(self, value: str) -> bool:
        """
        Helper to convert config to bool.
        :return:
        """
        return value.lower() == 'true'

    def get_oia(self):
        return self._get_config_as_bool(self.oia)

    def get_log_level(self):
        return self.log_level

    def get_dashboard_list_max_count(self):
        return self._get_config_as_int(self.dashboard_list_max_count, self.DEFAULT_DASHBOARD_LIST_MAX_COUNT)

    def get_load_balancer_address(self):
        return self.load_balancer_address

    def get_async_timeout_secs(self, default=DEFAULT_ASYNC_TIMEOUT_SECS):
        """
        Helper to get async timeout set by in config file
        :return:
        """
        return self._get_config_as_int(self.request_timeout_secs, default)

    def get_request_timeout_secs(self):
        """
        Helper to get client request_timeout_secs
        :return:
        """
        return self._get_config_as_int(self.request_timeout_secs, self.DEFAULT_REQUEST_TIMEOUT_SECS)

    def get_registration_webhook_url(self):
        """
        Helper get registration webhook url from config, return None if not found
        """

        return self.registration_webhook_url

    def get_webhook_verify_ssl(self):
        """
        Helper get registration webhook url from config, return None if not found
        """
        return self._get_config_as_bool(self.webhook_verify_ssl)

    def get_mtls_enabled(self):
        return self._get_config_as_bool(self.mtls_enabled)

    def get_spacebridge_server(self):
        return self.spacebridge_server

    def set_spacebridge_server(self, spacebridge_server):
        self.spacebridge_server = spacebridge_server

    def get_spacebridge_discovery_server(self):
        return self.spacebridge_discovery_server

    def get_spacebridge_domain(self):
        return self.spacebridge_domain

    def get_proxy_cfg(self):
        return self.proxy_cfg

    def get_https_proxy(self):
        return self.https_proxy

    def get_proxies(self):
        return self.proxies

    def get_ws_https_proxy_settings(self):
        """
        Helper to get https proxy settings for WebSocket config usage
        :return:
        """
        return self.ws_https_proxy_settings

    def get_https_proxy_settings(self):
        """
        Helper to get https proxy settings for twisted config usage
        :return:
        """
        return self.https_proxy_settings

    def update_config(self):
        """
        Helper to update config object if the last seen modification time has been overwritten
        :return:
        """
        current_mtime = self._get_local_config_mtime()

        # Compare path modification time to determine if we should update
        if current_mtime and current_mtime > self.conf_mtime:
            logging.debug("Config change detected, updating config fields.")
            self.conf_mtime = current_mtime
            self._build_config()

    def assert_spacebridge_server(self):

        if not self.spacebridge_server:
            raise ValueError("Missing Spacebridge server when building SecureGatewayConfig")

    def sleep_and_terminate_process(self, sleep_interval):
        """
        Used for emergency situations where the securegateway.conf file cannot parse values
        and our app is in an unstable state, we don't want the process to keep running, so sleep and terminate
        """

        # Sleep before erroring out so we don't spam logs, if we ever reach here there's an issue with the conf file
        print("splunk_secure_gateway has failed to load securegateway.conf, modular input will now sleep before terminating", file=sys.stderr)
        time.sleep(sleep_interval)
        sys.exit("Exiting because config cannot be read.")


secure_gateway_config = SecureGatewayConfig(SPACEBRIDGE_APP_NAME, 'securegateway')
