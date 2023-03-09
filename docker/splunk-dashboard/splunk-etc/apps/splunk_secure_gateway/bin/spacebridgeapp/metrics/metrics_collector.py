"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

from abc import ABCMeta, abstractmethod
import json
import jsonpickle
import time

from spacebridgeapp.rest.util.helper import camel_case
from spacebridgeapp.util import constants
from spacebridgeapp.util.constants import DEVICE_ID, DEVICE_TYPE, APPLICATION_TYPES_COLLECTION_NAME, \
    NOBODY, MOBILE_ALERTS_COLLECTION_NAME
from spacebridgeapp.metrics import telemetry_client
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject
from spacebridgeapp.rest.services.splunk_service import get_current_context, get_deployment_info
from spacebridgeapp.rest.devices.users_devices import get_devices_for_registered_users
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader


class SpacebridgeaAppMetricsCollector(object):

    def __init__(self, logger, session_token):
        self.logger = logger
        self.metrics = [NumRegisteredDevicesMetric(session_token, logger),
                        EnabledAppsMetric(session_token, logger),
                        NumDevicesPerAppMetric(session_token, logger),
                        NumAlertsMetric(session_token, logger)]

    def run(self):
        for metric in self.metrics:
            metric.send_to_telemetry()


class SpacebridgeAppMetric():
    """
    Base class for calculating metrics.
    """

    __metaclass__ = ABCMeta

    def __init__(self, session_token, logger):
        self.session_token = session_token
        self.auth_header = SplunkAuthHeader(session_token)
        self.logger = logger

    @abstractmethod
    def calculate(self):
        """
        must return a dictionary
        """
        pass

    def send_to_telemetry(self):
        metric = self.calculate()
        telemetry_client.post_event(metric, self.session_token, self.logger)


class NumRegisteredDevicesMetric(SpacebridgeAppMetric):
    """
    Track number of total registered devices
    """
    METRIC_NAME = "numRegisteredDevices"

    def calculate(self):
        devices = get_devices_for_registered_users(self.session_token)
        unique_device_ids = set()
        for device in devices:
            unique_device_ids.add(device[DEVICE_ID])

        metric = {self.METRIC_NAME: len(unique_device_ids)}
        return metric


class NumDevicesPerAppMetric(SpacebridgeAppMetric):
    """
    Track number of registered devices broken down by app
    """
    METRIC_NAME = "numRegisteredDevicesPerApp"

    def calculate(self):
        devices = get_devices_for_registered_users(self.session_token)
        unique_devices_per_app = {}

        for device in devices:
            app_name = device[DEVICE_TYPE]
            device_id = device[DEVICE_ID]

            if app_name in unique_devices_per_app:
                device_ids = unique_devices_per_app[app_name]
                device_ids.add(device_id)
                unique_devices_per_app[app_name] = device_ids

            elif app_name is not None:
                unique_devices_per_app[app_name] = {device_id}

        metrics = {camel_case(app_name): len(unique_devices_per_app[app_name]) for app_name in unique_devices_per_app.keys()}
        return {self.METRIC_NAME : metrics}


class EnabledAppsMetric(SpacebridgeAppMetric):
    """
    Track which mobile apps are enabled in the splapp
    """
    METRIC_NAME = "enabledMobileAppsMetrics"

    def calculate(self):
        kvstore_client = KVStoreCollectionAccessObject(APPLICATION_TYPES_COLLECTION_NAME,
                                                       self.session_token,
                                                       owner=NOBODY)
        r, app_states = kvstore_client.get_all_items()
        metrics = {}

        for app_state in json.loads(app_states):
            metrics[app_state[camel_case("application_name")]] = app_state["application_enabled"]

        return {self.METRIC_NAME: metrics}


class NumAlertsMetric(SpacebridgeAppMetric):
    """
    Track how many alerts are being stored in KV Store
    """

    METRIC_NAME = "numAlertsInKvstore"

    def calculate(self):
        kvstore_client = KVStoreCollectionAccessObject(MOBILE_ALERTS_COLLECTION_NAME,
                                                       self.session_token,
                                                       owner=NOBODY)

        r, jsn = kvstore_client.get_collection_keys()
        collection_keys = json.loads(jsn)
        collection_size = len(collection_keys)
        return {self.METRIC_NAME: collection_size}


class OptInPageMetric(SpacebridgeAppMetric):
    """
    Track stats regarding opt in data
    this metrics collector will be called in three instances:
    1. Page load when user hasn't opted in to SOC2 (admin users)
    2. Page load when user hasn't opted into SOC2 (non-admin user)
    3. After user clicks on "Activate Now" button" in UI (admin users)
    4. After user checks or unchecks "i agree" checkbox (admin_users)
    5. immediately after opt in by a user (admin users).
    """
    METRIC_NAME = "optInPageMetrics"
    NON_ADMIN_INTRO = 'non_admin_intro'
    ADMIN_INTRO = 'admin_intro'
    OPT_IN = 'opt_in'
    ACTIVATE_NOW_BUTTON = 'activate_now_button'
    I_AGREE_CHECKED = 'i_agree_checked'
    I_AGREE_UNCHECKED = 'i_agree_unchecked'
    def __init__(self, session_token, logger, user, option):
        super().__init__(session_token, logger)
        self.user = user
        if option not in(self.NON_ADMIN_INTRO, self.ADMIN_INTRO,
                         self.OPT_IN, self.ACTIVATE_NOW_BUTTON, self.I_AGREE_CHECKED,
                         self.I_AGREE_UNCHECKED):
            self.logger.error(f'Invalid option type={self.option} sent to metrics handler')
        self.option = option

    def __repr__(self):
        encoded_object = jsonpickle.decode(jsonpickle.encode(self))
        filtered_object = {k:v if k not in ('auth_header', 'session_token') else '*****' for k,v in encoded_object.__dict__.items()}
        return jsonpickle.encode(filtered_object)

    def calculate(self):
        # We need to log the roles of the user, deployment id and user id
        context = get_current_context(self.session_token)
        deployment_info = get_deployment_info(self.session_token)
        friendly_name = deployment_info['friendly_name'] if deployment_info else ''
        deployment_id = deployment_info['deployment_id'] if deployment_info else ''
        roles = context.get('roles', [])
        metrics = {}
        metrics['is_admin'] = True if any(role in roles for role in('admin', 'sc_admin')) else False
        metrics['username'] = self.user
        metrics['timestamp'] = time.time()
        metrics['opt_in_stage'] = self.option
        metrics['deployment_id'] = deployment_id
        metrics_dict = {self.METRIC_NAME:  metrics}
        self.logger.debug('metrics=%s', metrics_dict)
        return {self.METRIC_NAME: metrics}
