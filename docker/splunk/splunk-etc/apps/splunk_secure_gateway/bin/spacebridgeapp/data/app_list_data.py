"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for representation of data objects for app_list data
"""
import json
from splapp_protocol import request_pb2
from spacebridgeapp.data.base import SpacebridgeAppBase
from spacebridgeapp.util.constants import DASHBOARD_APP_LIST

# Constants
APP_NAMES = 'app_names'


class App(SpacebridgeAppBase):
    """Pair of app name and display app name.
    """

    def __init__(self, app_name="", display_app_name="", author=""):
        self.app_name = app_name
        self.display_app_name = display_app_name
        self.author = author

    def set_protobuf(self, proto):
        """Takes a proto of type App and populates
         the fields with the corresponding class values

        Arguments:
            proto {App}
        """

        proto.appName = self.app_name
        proto.displayAppName = self.display_app_name

    def from_protobuf(self, proto):
        """
        Takes a protobuf and sets fields on class
        :param proto:
        :return:
        """
        self.app_name = proto.app_name
        self.display_app_name = proto.display_app_name

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            App
        """

        proto = request_pb2.AppListResponse.App()
        self.set_protobuf(proto)
        return proto


class DashboardAppList(SpacebridgeAppBase):
    """
    Object used for store dashboard_app_list object in kvstore
    """

    @staticmethod
    def from_json(json_obj):
        """
        Static initializer of DashboardAppList object from a json object
        :param json_obj:
        :return: DashboardAppList object
        """
        dashboard_app_list = DashboardAppList()
        if json_obj:
            dashboard_app_list.app_names = json.loads(json_obj.get(APP_NAMES, "[]"))
            dashboard_app_list._user = json_obj.get('_user', '')
            dashboard_app_list._key = json_obj.get('_key', DASHBOARD_APP_LIST)
        return dashboard_app_list

    def __init__(self, app_names=None, _user='', _key=DASHBOARD_APP_LIST):
        self.app_names = app_names if app_names else []
        self._user = _user
        self._key = _key

    def __repr__(self):
        """
        Stringify the object
        :return:
        """
        return "_key={}, _user={}, app_names={}".format(self._key, self._user, self.app_names)

