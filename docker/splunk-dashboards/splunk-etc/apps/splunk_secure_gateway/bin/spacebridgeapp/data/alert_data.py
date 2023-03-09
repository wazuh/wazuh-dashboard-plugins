"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for representation of data objects for alerts
"""

import os
from typing import Dict
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
from splapp_protocol import common_pb2
import json

from spacebridgeapp.data.base import SpacebridgeAppBase
from spacebridgeapp.util import constants


class Alert(SpacebridgeAppBase):
    """Alert class which encapuslates all alert related information.
    Consists of a notification and detail object.
    """

    def __init__(self, notification=None,
                 detail=None):

        self.notification = notification
        self.detail = detail

    def __eq__(self, obj):
        """Equality comparator
        """

        if isinstance(obj, self.__class__):
            return obj.notification == self.notification and \
                   obj.detail == self.detail
        else:
            return False

    def set_protobuf(self, proto):
        """Takes a proto of type Alert and populates
         the fields with the corresponding class values

        Arguments:
            proto {Alert}
        """
        if self.notification is not None:
            self.notification.set_protobuf(proto.notification)
        if self.detail is not None:
            self.detail.set_protobuf(proto.detail)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            Alert.proto
        """
        proto = common_pb2.Alert()
        self.set_protobuf(proto)
        return proto


class CallToAction(SpacebridgeAppBase):
    """Object for representing information necessary for user to take
    some action on an alert.
    """

    def __init__(self, uri, title):
        self.uri = uri
        self.title = title

    def __eq__(self, obj):
        """Equality comparator
        """
        if isinstance(obj, self.__class__):
            return obj.uri == self.uri and obj.title == self.title
        else:
            return False

    def set_proto(self, proto):
        """Takes a proto of type CallToAction and populates
         the fields with the corresponding class values

        Arguments:
            proto {CallToAction.proto}
        """
        proto.uri = self.uri
        proto.title = self.title

    def to_proto(self):
        """returns protobuf representation of this object

        Returns:
            CallToAction.proto
        """
        proto = common_pb2.Alert.CallToAction()
        self.set_proto(proto)
        return proto


class Notification(SpacebridgeAppBase):
    """Alert information necessary for when a notification is sent to
    the user
    """

    def __init__(self, severity=None,
                 alert_id=None,
                 title=None,
                 description=None,
                 call_to_action=None,
                 created_at=None,
                 app_name=None,
                 display_app_name=""):

        self.severity = int(severity)
        self.alert_id = alert_id
        self.title = title
        self.description = description
        self.call_to_action = call_to_action
        self.created_at = created_at
        self.app_name = app_name
        self.display_app_name = display_app_name

    def __eq__(self, obj):
        """Equality comparator
        """
        if isinstance(obj, self.__class__):
            return obj.severity == self.severity and \
                   obj.alert_id == self.alert_id and \
                   obj.title == self.title and \
                   obj.description == self.description and \
                   obj.call_to_action == self.call_to_action and \
                   obj.created_at == self.created_at and \
                   obj.app_name == self.app_name and \
                   obj.display_app_name == self.display_app_name
        else:
            return False

    def set_protobuf(self, proto):
        """Takes a proto of type Notification and populates
         the fields with the corresponding class values

        Arguments:
            proto {Notification}
        """
        proto.severity = self.severity
        proto.alertId = self.alert_id
        proto.title = self.title
        proto.description = self.description
        proto.createdAt = self.created_at
        proto.appName = self.app_name
        proto.displayAppName = self.display_app_name
        self.call_to_action.set_proto(proto.callToAction)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            Notification.proto
        """
        proto = common_pb2.Alert.Notification()
        self.set_protobuf(proto)
        return proto


class Detail(SpacebridgeAppBase):
    """ Container for detailed information in an alert such as
    dashboard data, search id, etc.
    """

    def __init__(self,
                 result_json=None,
                 search_id=None,
                 results_link=None,
                 search_name=None,
                 owner=None,
                 dashboard_id=None,
                 dashboard_description=None,
                 list_dashboard_data=None):

        self.result_json = json.dumps(result_json)
        self.search_id = search_id
        self.results_link = results_link
        self.search_name = search_name
        self.owner = owner
        self.dashboard_id = dashboard_id
        self.dashboard_description = dashboard_description
        self.list_dashboard_data = list_dashboard_data

    def __eq__(self, obj):
        """Equality comparator
        """
        if isinstance(obj, self.__class__):
            return obj.result_json == self.result_json  and \
                   obj.search_id == self.search_id and \
                   obj.results_link == self.results_link  and \
                   obj.search_name == self.search_name  and \
                   obj.owner == self.owner and \
                   obj.dashboard_id == self.dashboard_id and \
                   obj.dashboard_description == self.dashboard_description and \
                   obj.list_dashboard_data == self.list_dashboard_data
        else:
            return False

    def set_protobuf(self, proto):
        """Takes a proto of type Detail and populates
         the fields with the corresponding class values

        Arguments:
            proto {Detail}
        """
        proto.resultJson = self.result_json
        proto.searchId = self.search_id
        proto.resultsLink = self.results_link
        proto.searchName = self.search_name
        proto.owner = self.owner

        if self.dashboard_id:
            proto.dashboardId = self.dashboard_id

        if self.dashboard_description is not None:
            self.dashboard_description.set_protobuf(proto.dashboardDescription)

        if self.list_dashboard_data is not None:
            dashboard_data_proto = [dashboard_data.to_protobuf() for dashboard_data in self.list_dashboard_data]
            proto.dashboardData.extend(dashboard_data_proto)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            Detail.proto
        """
        proto = common_pb2.Alert.Detail()
        self.set_protobuf(proto)
        return proto


class RecipientDevice(SpacebridgeAppBase):
    """Container for which device should receive an alert.
    Contains the id of the device, the corresponding id of the alert and
    the timestamp of the alert.
    """

    def __init__(self, device_id=None,
                 alert_id=None,
                 timestamp=None):

        self.device_id = device_id
        self.alert_id = alert_id
        self.timestamp = timestamp

    def __eq__(self, obj):
        """Equality comparator
        """
        if isinstance(obj, self.__class__):
            return obj.device_id == self.device_id and \
                   obj.alert_id == self.alert_id and \
                   obj.timestamp == self.timestamp
        else:
            return False


class ScopedSnooze(SpacebridgeAppBase):
    def __init__(self, snooze_id: str = None, device_id: str = None, scope: str = None, end_time: str = None):
        self.snooze_id = snooze_id
        self.device_id = device_id
        self.scope = scope
        self.end_time = end_time

    def set_protobuf(self, proto: common_pb2.Snooze):
        """Takes a proto of type common_pb2.Snooze and populates
         the fields with the corresponding class values

        Arguments:
            proto {Snooze}
        """
        proto.snoozeId = self.snooze_id
        if self.scope == constants.SNOOZE_ALL_SCOPE:
            proto.snoozeAll.SetInParent()
        proto.endTime = int(self.end_time)

    def to_protobuf(self) -> common_pb2.Snooze:
        """returns protobuf representation of this object

        Returns:
            Snooze.proto
        """
        proto = common_pb2.Snooze()
        self.set_protobuf(proto)
        return proto

    @classmethod
    def from_json(cls, obj: Dict[str, str]):
        """Returns ScopedSnooze object from KVStore json object

        Returns:
            ScopedSnooze
        """

        return cls(
            snooze_id=obj.get('_key'),
            device_id=obj.get('device_id'),
            scope=obj.get('scope'),
            end_time=obj.get('end_time'),
        )
