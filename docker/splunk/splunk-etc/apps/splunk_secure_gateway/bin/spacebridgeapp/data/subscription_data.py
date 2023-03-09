"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to represent Subscription data objects
"""

import json

from splapp_protocol import subscription_pb2
from spacebridgeapp.data.base import SpacebridgeAppBase
from spacebridgeapp.util.time_utils import is_datetime_expired
from spacebridgeapp.util.constants import USER_KEY, KEY
from spacebridgeapp.data.dispatch_state import DispatchState
from spacebridgeapp.data.search_type import SearchType
from spacebridgeapp.util import constants


def get_value(value, default):
    return value if value else default


SESSION_KEY_TYPES = {constants.JWT_TOKEN_TYPE, constants.SPLUNK_SESSION_TOKEN_TYPE}


class SubscriptionCredential(SpacebridgeAppBase):
    @staticmethod
    def from_json(json_obj):
        auth = SubscriptionCredential()
        if json_obj:
            auth.subscription_id = json_obj.get('subscription_id')
            auth.session_key = json_obj.get('session_key')
            auth.session_type = json_obj.get('session_type')
            auth.shard_id = json_obj.get('shard_id')
            auth.last_update_time = json_obj.get('last_update_time')
            auth.version = json_obj.get('version')
            auth._user = json_obj.get('_user')
            auth._key = json_obj.get('_key')
        return auth

    def __init__(self,
                 subscription_id=None,
                 session_key=None,
                 session_type=None,
                 shard_id=None,
                 last_update_time=None,
                 version=constants.SUBSCRIPTION_VERSION_2,
                 _key=None):
        self.subscription_id = subscription_id
        self.session_key = session_key
        self.session_type = session_type
        self.shard_id = shard_id
        self.last_update_time = last_update_time
        self.version = version
        self._user = None
        self._key = _key

    @property
    def key(self):
        return self._key

    @property
    def user(self):
        return self._user


class Subscription(SpacebridgeAppBase):
    """
    Object container for a Subscription object in kvstore
    """

    TTL_SECONDS = 'ttl_seconds'
    SEARCH_KEY = 'search_key'
    SUBSCRIPTION_KEY = 'subscription_key'
    SUBSCRIPTION_TYPE = 'subscription_type'
    EXPIRED_TIME = 'expired_time'
    LAST_UPDATE_TIME = 'last_update_time'
    DEVICE_ID = 'device_id'
    SHARD_ID = 'shard_id'
    USER = 'user'
    VERSION = 'version'
    _KEY = '_key'
    _USER = '_user'
    VISUALIZATION_ID = 'visualization_id'

    @classmethod
    def from_json(cls, json_obj):
        """
        Static initializer of Subscription object from a json object
        :param json_obj:
        :return: Subscription object
        """
        subscription = Subscription()
        if json_obj:
            subscription.ttl_seconds = json_obj.get(cls.TTL_SECONDS)

            # legacy
            if json_obj.get(cls.SEARCH_KEY):
                subscription.subscription_type = constants.SEARCH
                subscription.subscription_key = json_obj[cls.SEARCH_KEY]
            else:
                if json_obj.get(cls.SUBSCRIPTION_TYPE):
                    subscription.subscription_type = json_obj[cls.SUBSCRIPTION_TYPE]
                if json_obj.get(cls.SUBSCRIPTION_KEY):
                    subscription.subscription_key = json_obj[cls.SUBSCRIPTION_KEY]
            subscription.expired_time = json_obj.get(cls.EXPIRED_TIME)
            subscription.last_update_time = json_obj.get(cls.LAST_UPDATE_TIME)
            subscription.device_id = json_obj.get(cls.DEVICE_ID)
            subscription.shard_id = json_obj.get(cls.SHARD_ID)
            subscription.user = json_obj.get(cls.USER)
            subscription.version = json_obj.get(cls.VERSION, 1)
            subscription._key = json_obj.get(cls._KEY)
            subscription._user = json_obj.get(cls._USER)
            subscription.visualization_id = json_obj.get(cls.VISUALIZATION_ID)
        return subscription

    def __init__(self,
                 ttl_seconds=None,
                 device_id=None,
                 subscription_key=None,
                 subscription_type=constants.SEARCH,
                 shard_id=None,
                 expired_time=None,
                 last_update_time=None,
                 visualization_id=None,
                 user='',
                 version=constants.SUBSCRIPTION_VERSION_2,
                 _key='',
                 _user=''):
        """
        :param ttl_seconds: amount of time before this subscription should expire, client provided
        :param device_id:
        """
        self.ttl_seconds = ttl_seconds
        self.device_id = device_id
        self.subscription_type = subscription_type
        self.subscription_key = subscription_key
        self.expired_time = expired_time
        self.last_update_time = last_update_time
        self.shard_id = shard_id
        self.device_id = device_id
        self.user = user
        self.visualization_id = visualization_id
        self.version = version
        self._key = _key
        self._user = _user

    def is_expired(self):
        return is_datetime_expired(self.expired_time)

    def key(self):
        return self._key


class SubscriptionSearch(SpacebridgeAppBase):
    """
    Object container for a Subscription Search object in kvstore
    """

    _EMPTY_JSON = {}

    @staticmethod
    def from_json(json_obj):
        """
        Static initializer for SubscriptionSearch object from json object
        :param json_obj:
        :return: SubscriptionSearch object
        """
        search = SubscriptionSearch()
        if json_obj:
            search_type = json_obj.get('search_type')
            search.dashboard_id = json_obj.get('dashboard_id')
            search.search_type = search_type if search_type else SearchType.VISUALIZATION.value
            search.search_type_id = json_obj.get('search_type_id')
            search.ref = json_obj.get('ref')
            search.app = json_obj.get('app')
            search.base = json_obj.get('base')
            search.query = json_obj.get('query')
            search.earliest_time = json_obj.get('earliest_time')
            search.latest_time = json_obj.get('latest_time')
            search.sample_ratio = json_obj.get('sample_ratio', 1)
            search.refresh_interval_seconds = json_obj.get('refresh_interval_seconds')
            search.next_update_time = json_obj.get('next_update_time')
            search.last_update_time = json_obj.get('last_update_time')
            search.sid = json_obj.get('sid')
            search.input_tokens = json_obj.get('input_tokens')
            search.dispatch_state = json_obj.get('dispatch_state')
            search.done_progress = json_obj.get('done_progress', 0.0)
            search.parent_search_key = json_obj.get('parent_search_key')
            search.shard_id = json_obj.get('shard_id')
            search.version = json_obj.get('version', 1)
            search.visualization_type = json_obj.get('visualization_type')
            search.trellis_enabled = json_obj.get('trellis_enabled', False)
            search.trellis_split_by = json_obj.get('trellis_split_by', '')
            search.ds_test = json_obj.get('ds_test')
            search.owner = json_obj.get('owner')
            search._user = json_obj.get('_user')
            search._key = json_obj.get('_key')
        return search

    def __init__(self,
                 dashboard_id=None,
                 search_type=SearchType.VISUALIZATION.value,
                 search_type_id=None,
                 ref=None,
                 app=None,
                 base=None,
                 query=None,
                 earliest_time=None,
                 latest_time=None,
                 sample_ratio=1,
                 refresh_interval_seconds=0,
                 next_update_time=None,
                 last_update_time=None,
                 sid=None,
                 input_tokens=None,
                 dispatch_state=DispatchState.NONE.value,
                 done_progress=0.0,
                 parent_search_key=None,
                 shard_id=None,
                 owner=None,
                 visualization_type=None,
                 trellis_enabled=False,
                 trellis_split_by="",
                 ds_test=None,
                 version=constants.SUBSCRIPTION_VERSION_2,
                 _user='',
                 _key=''):

        if not input_tokens:
            input_tokens = self._EMPTY_JSON

        self.dashboard_id = dashboard_id
        self.search_type = search_type
        self.search_type_id = search_type_id
        self.ref = ref
        self.app = app
        self.base = base
        self.query = query
        self.earliest_time = earliest_time
        self.latest_time = latest_time
        self.sample_ratio = sample_ratio
        self.refresh_interval_seconds = refresh_interval_seconds
        self.next_update_time = next_update_time
        self.last_update_time = last_update_time
        self.sid = sid
        self.input_tokens = json.dumps(input_tokens)
        self.dispatch_state = int(dispatch_state)
        self.done_progress = float(done_progress)
        self.parent_search_key = parent_search_key
        self.shard_id = shard_id
        self.owner = owner
        self.version = version
        self.visualization_type = visualization_type
        self.trellis_enabled = trellis_enabled
        self.trellis_split_by = trellis_split_by
        self.ds_test = ds_test
        self._user = _user
        self._key = _key

    def has_sid(self):
        return self.sid is not None

    def is_root(self):
        return self.search_type == SearchType.ROOT.value

    def key(self):
        return self._key

    def is_refreshing(self):
        return self.refresh_interval_seconds and float(self.refresh_interval_seconds) > 0


class SearchUpdate(SpacebridgeAppBase):
    """
    Object container for a Search Update object in kvstore
    """

    @staticmethod
    def from_json(json_obj):
        """
        Static initializer for SearchUpdate object from json object
        :param json_obj:
        :return: SubscriptionUpdate object
        """
        json_obj = json_obj or {}

        return SearchUpdate(
            post_search=json_obj.get('post_search', ''),
            trellis_enabled=json_obj.get('trellis_enabled', False),
            trellis_split_by=json_obj.get('trellis_split_by', ''),
            user=json_obj.get(USER_KEY, ''),
            key=json_obj.get(KEY, '')
        )

    def __init__(self,
                 post_search=None,
                 trellis_enabled=False,
                 trellis_split_by="",
                 user='',
                 key=''):
        self.post_search = post_search
        self.trellis_enabled = trellis_enabled
        self.trellis_split_by = trellis_split_by
        self._user = user
        self._key = key

    def __repr__(self):
        """
        Stringify the object
        :return:
        """
        return "key={}, post_search={}, trellis_split_by={}".format(self._key, self.post_search, self.trellis_split_by)

    def get_post_search(self):
        return self.post_search

    def get_trellis_split_by(self):
        return self.trellis_split_by

    def key(self):
        return self._key

    def user(self):
        return self._user


class ServerUdfDatasourceEvent(SpacebridgeAppBase):
    """
    Class to encapuslate UDF Data Source event updates for pubsub
    """

    def __init__(self,
                 dashboard_id=None,
                 datasource_id=None,
                 visualization_data=None,
                 dispatch_state=DispatchState.NONE.value,
                 done_progress=0.0,
                 search_job_properties=None):
        self.dashboard_id = dashboard_id
        self.datasource_id = datasource_id
        self.visualization_data = visualization_data
        self.dispatch_state = int(dispatch_state)
        self.done_progress = float(done_progress)
        self.search_job_properties = search_job_properties

    def set_protobuf(self, proto):
        """Takes a proto of type ServerUdfDataSourceEvent and populates
         the fields with the corresponding class values

        Arguments:
            proto {ServerUdfDataSourceEvent}
        """
        if self.dashboard_id:
            proto.dashboardId = self.dashboard_id

        if self.datasource_id:
            proto.dataSourceId = self.datasource_id

        if self.done_progress:
            proto.doneProgress = self.done_progress

        if self.visualization_data is not None:
            self.visualization_data.set_protobuf(proto.visualizationData)

        proto.dispatchState = self.dispatch_state

        if self.search_job_properties is not None:
            self.search_job_properties.set_protobuf(proto.searchJobProperties)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardData
        """
        proto = subscription_pb2.ServerUDFDataSourceEvent()
        self.set_protobuf(proto)
        return proto


class ServerDashboardVisualizationEvent(SpacebridgeAppBase):
    """Pair of visualization id and the corresponding data
    """

    def __init__(self,
                 dashboard_visualization_id=None,
                 visualization_data=None,
                 dispatch_state=DispatchState.NONE.value,
                 done_progress=0.0,
                 search_job_properties=None):
        self.visualization_data = visualization_data
        self.dashboard_visualization_id = dashboard_visualization_id
        self.dispatch_state = int(dispatch_state)
        self.done_progress = float(done_progress)
        self.search_job_properties = search_job_properties

    def set_protobuf(self, proto):
        """Takes a proto of type ServerDashboardVisualizationEvent and populates
         the fields with the corresponding class values

        Arguments:
            proto {ServerDashboardVisualizationEvent}
        """
        self.dashboard_visualization_id.set_protobuf(proto.dashboardVisualizationId)
        if self.visualization_data is not None:
            self.visualization_data.set_protobuf(proto.visualizationData)
        proto.dispatchState = self.dispatch_state
        proto.doneProgress = self.done_progress

        if self.search_job_properties is not None:
            self.search_job_properties.set_protobuf(proto.searchJobProperties)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardData
        """
        proto = subscription_pb2.ServerDashboardVisualizationEvent()
        self.set_protobuf(proto)
        return proto


class TrellisDashboardVisualizationEvent(SpacebridgeAppBase):
    def __init__(self,
                 dashboard_visualization_id=None,
                 trellis_visualization_data=None,
                 dispatch_state=DispatchState.NONE.value,
                 done_progress=0.0,
                 search_job_properties=None):

        self.trellis_visualization_data = trellis_visualization_data
        self.dashboard_visualization_id = dashboard_visualization_id
        self.dispatch_state = int(dispatch_state)
        self.done_progress = float(done_progress)
        self.search_job_properties = search_job_properties

    def set_protobuf(self, proto):
        """Takes a proto of type TrellisDashboardVisualizationEvent and populates
         the fields with the corresponding class values

        Arguments:
            proto {TrellisDashboardVisualizationEvent}
        """
        self.dashboard_visualization_id.set_protobuf(proto.dashboardVisualizationId)
        self.trellis_visualization_data.set_protobuf(proto.trellisVisualizationData)
        proto.dispatchState = self.dispatch_state
        proto.doneProgress = self.done_progress

        if self.search_job_properties is not None:
            self.search_job_properties.set_protobuf(proto.searchJobProperties)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            TrellisDashboardVisualizationEvent
        """
        proto = subscription_pb2.TrellisDashboardVisualizationEvent()
        self.set_protobuf(proto)
        return proto


class ServerDashboardInputSearchEvent(SpacebridgeAppBase):
    """
    Object to model a ServerDashboardInputSearchEvent
    """

    def __init__(self,
                 dashboard_id=None,
                 query_id=None,
                 visualization_data=None,
                 dispatch_state=DispatchState.NONE.value,
                 done_progress=0.0,
                 search_job_properties=None):
        self.visualization_data = visualization_data
        self.dashboard_id = dashboard_id
        self.query_id = query_id
        self.dispatch_state = int(dispatch_state)
        self.done_progress = float(done_progress)
        self.search_job_properties = search_job_properties

    def set_protobuf(self, proto):
        """
        Takes a proto of type ServerDashboardInputEvent and populates the fields with the corresponding class values

        Arguments:
            proto {ServerDashboardInputEvent}
        """
        proto.dashboardId = self.dashboard_id
        proto.queryId = self.query_id
        if self.visualization_data is not None:
            self.visualization_data.set_protobuf(proto.visualizationData)
        proto.dispatchState = self.dispatch_state
        proto.doneProgress = self.done_progress
        if self.search_job_properties is not None:
            self.search_job_properties.set_protobuf(proto.searchJobProperties)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            ServerDashboardInputSearchEvent
        """
        proto = subscription_pb2.ServerDashboardInputSearchEvent()
        self.set_protobuf(proto)
        return proto


class ServerSavedSearchEvent(SpacebridgeAppBase):
    """Pair of saved search id and the corresponding data
    """

    def __init__(self,
                 saved_search_id=None,
                 visualization_data=None,
                 dispatch_state=DispatchState.NONE.value,
                 done_progress=0.0):
        self.visualization_data = visualization_data
        self.saved_search_id = saved_search_id
        self.dispatch_state = int(dispatch_state)
        self.done_progress = float(done_progress)

    def set_protobuf(self, proto):
        """Takes a proto of type ServerSavedSearchEvent and populates
         the fields with the corresponding class values

        Arguments:
            proto {ServerSavedSearchEvent}
        """
        proto.savedSearchId = self.saved_search_id
        if self.visualization_data is not None:
            self.visualization_data.set_protobuf(proto.visualizationData)
        proto.dispatchState = self.dispatch_state
        proto.doneProgress = self.done_progress

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            proto {ServerSavedSearchEvent}
        """
        proto = subscription_pb2.ServerSavedSearchEvent()
        self.set_protobuf(proto)
        return proto
