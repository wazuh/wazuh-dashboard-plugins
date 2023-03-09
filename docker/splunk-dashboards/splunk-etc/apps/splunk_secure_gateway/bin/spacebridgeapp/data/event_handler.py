"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for representation of data objects for event_handler
"""

import json
import sys
import os
from typing import List, Dict
from dataclasses import dataclass, field

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

from spacebridgeapp.dashboard.parse_search import to_message, get_float_field, get_string_field
from spacebridgeapp.data.dispatch_state import DispatchState
from spacebridgeapp.exceptions.error_message_helper import format_error
from splapp_protocol import event_handler_pb2, common_pb2
from spacebridgeapp.data.base import SpacebridgeAppBase
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, VALUE, LABEL, MATCH
from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_event_handler.log", "event_handler")


class Change(SpacebridgeAppBase):
    """
    Container for data for change element. A change element contains set, unset, eval, link and conditions
    """

    def __init__(self, link=None, sets=None, evals=None, unsets=None, conditions=None):
        self.link = link
        self.sets = sets or []
        self.evals = evals or []
        self.unsets = unsets or []
        self.conditions = conditions or []

    def set_protobuf(self, proto):
        if self.link:
            self.link.set_protobuf(proto.link)

        if self.sets:
            set_protos = [set_obj.to_protobuf() for set_obj in self.sets]
            proto.sets.extend(set_protos)

        if self.evals:
            eval_protos = [eval_obj.to_protobuf() for eval_obj in self.evals]
            proto.evals.extend(eval_protos)

        if self.unsets:
            unset_protos = [unset_obj.to_protobuf() for unset_obj in self.unsets]
            proto.unsets.extend(unset_protos)

        if self.conditions:
            condition_protos = [condition_obj.to_protobuf() for condition_obj in self.conditions]
            proto.conditions.extend(condition_protos)

    def to_protobuf(self):
        proto = event_handler_pb2.Change()
        self.set_protobuf(proto)
        return proto


class FormCondition(SpacebridgeAppBase):
    """
    Container for data for condition element in form inputs. A condition element contains set, unset, eval, link
    """

    def __init__(self, matchAttribute, link=None, sets=None, evals=None, unsets=None):

        # Note: matchAttribute is an object that contains either value, label or match attributes
        self.matchAttribute = matchAttribute
        self.link = link
        self.sets = sets or []
        self.evals = evals or []
        self.unsets = unsets or []

    def set_protobuf(self, proto):
        if VALUE in self.matchAttribute and self.matchAttribute[VALUE] is not None:
            proto.value = self.matchAttribute[VALUE]
        elif LABEL in self.matchAttribute and self.matchAttribute[LABEL] is not None:
            proto.label = self.matchAttribute[LABEL]
        elif MATCH in self.matchAttribute and self.matchAttribute[MATCH] is not None:
            proto.match = self.matchAttribute[MATCH]

        if self.link:
            self.link.set_protobuf(proto.link)

        if self.sets:
            set_protos = [set_obj.to_protobuf() for set_obj in self.sets]
            proto.sets.extend(set_protos)

        if self.evals:
            eval_protos = [eval_obj.to_protobuf() for eval_obj in self.evals]
            proto.evals.extend(eval_protos)

        if self.unsets:
            unset_protos = [unset_obj.to_protobuf() for unset_obj in self.unsets]
            proto.unsets.extend(unset_protos)

    def to_protobuf(self):
        proto = event_handler_pb2.FormCondition()
        self.set_protobuf(proto)
        return proto


class Link(SpacebridgeAppBase):
    """
    A Link object used to specify links
    """

    def __init__(self, target='', url='', dashboard_id=None, input_map=None):
        self.target = target
        self.url = url
        self.dashboard_id = dashboard_id
        self.input_map = input_map if input_map else {}

    def set_protobuf(self, proto):
        proto.target = self.target
        proto.url = self.url
        proto.dashboardId = self.dashboard_id

        for key in self.input_map.keys():
            proto.inputMap[key] = self.input_map[key]

    def to_protobuf(self):
        proto = event_handler_pb2.Link()
        self.set_protobuf(proto)
        return proto


class Set(SpacebridgeAppBase):
    """
    A Set object used to specify set tokens
    """

    def __init__(self, token='', value=''):
        self.token = token
        self.value = value

    def set_protobuf(self, proto):
        proto.token = self.token
        proto.value = self.value

    def to_protobuf(self):
        proto = event_handler_pb2.Set()
        self.set_protobuf(proto)
        return proto


class Eval(SpacebridgeAppBase):
    """
    An Eval object used to specify eval functions
    """

    def __init__(self, token='', value=''):
        self.token = token
        self.value = value

    def set_protobuf(self, proto):
        proto.token = self.token
        proto.value = self.value

    def to_protobuf(self):
        proto = event_handler_pb2.Eval()
        self.set_protobuf(proto)
        return proto


class Unset(SpacebridgeAppBase):
    """
    An Unset object used to specify unset tokens
    """

    def __init__(self, token=''):
        self.token = token

    def set_protobuf(self, proto):
        proto.token = self.token

    def to_protobuf(self):
        proto = event_handler_pb2.Unset()
        self.set_protobuf(proto)
        return proto


class DrillDown(SpacebridgeAppBase):
    """
    A DrillDown object used to specify drilldown functions
    """

    def __init__(self, link=None, list_set=None, list_eval=None, list_unset=None, conditions=None):
        self.link = link
        self.list_set = list_set or []
        self.list_eval = list_eval or []
        self.list_unset = list_unset or []
        self.conditions = conditions or []

    def set_protobuf(self, proto):
        if self.link:
            self.link.set_protobuf(proto.link)

        if self.list_set:
            set_protos = [set_obj.to_protobuf() for set_obj in self.list_set]
            proto.sets.extend(set_protos)

        if self.list_eval:
            eval_protos = [eval_item.to_protobuf() for eval_item in self.list_eval]
            proto.evals.extend(eval_protos)

        if self.list_unset:
            unset_protos = [unset.to_protobuf() for unset in self.list_unset]
            proto.unsets.extend(unset_protos)

        if self.conditions:
            condition_protos = [condition_obj.to_protobuf() for condition_obj in self.conditions]
            proto.conditions.extend(condition_protos)

    def to_protobuf(self):
        proto = event_handler_pb2.DrillDown()
        self.set_protobuf(proto)
        return proto


class DrillDownCondition(SpacebridgeAppBase):
    """
    Container for data for condition element in drilldowns. A condition element contains set, unset, eval, link
    """

    def __init__(self, field, link=None, sets=None, evals=None, unsets=None):
        self.field = field
        self.link = link
        self.sets = sets or []
        self.evals = evals or []
        self.unsets = unsets or []

    def set_protobuf(self, proto):
        proto.field = self.field

        if self.link:
            self.link.set_protobuf(proto.link)

        if self.sets:
            set_protos = [set_obj.to_protobuf() for set_obj in self.sets]
            proto.sets.extend(set_protos)

        if self.evals:
            eval_protos = [eval_obj.to_protobuf() for eval_obj in self.evals]
            proto.evals.extend(eval_protos)

        if self.unsets:
            unset_protos = [unset_obj.to_protobuf() for unset_obj in self.unsets]
            proto.unsets.extend(unset_protos)

    def to_protobuf(self):
        proto = event_handler_pb2.DrillDownCondition()
        self.set_protobuf(proto)
        return proto


@dataclass
class SearchCondition(SpacebridgeAppBase):
    """Container for data for condition element in search. A condition element contains match, set, unset, eval, link"""
    match: str
    link: Link = None
    sets: List[Set] = field(default_factory=list)
    evals: List[Eval] = field(default_factory=list)
    unsets: List[Unset] = field(default_factory=list)

    def set_protobuf(self, proto):
        proto.match = self.match

        if self.link:
            self.link.set_protobuf(proto.link)

        if self.sets:
            set_protos = [set_obj.to_protobuf() for set_obj in self.sets]
            proto.sets.extend(set_protos)

        if self.evals:
            eval_protos = [eval_obj.to_protobuf() for eval_obj in self.evals]
            proto.evals.extend(eval_protos)

        if self.unsets:
            unset_protos = [unset_obj.to_protobuf() for unset_obj in self.unsets]
            proto.unsets.extend(unset_protos)

    def to_protobuf(self):
        proto = event_handler_pb2.SearchCondition()
        self.set_protobuf(proto)
        return proto


@dataclass
class SearchHandler(SpacebridgeAppBase):
    """Container for data for search handler. Analogous to the SearchHandler proto"""
    state: event_handler_pb2.SearchHandler.SearchJobState
    link: Link = None
    list_set: List[Set] = field(default_factory=list)
    list_eval: List[Eval] = field(default_factory=list)
    list_unset: List[Unset] = field(default_factory=list)
    conditions: List[SearchCondition] = field(default_factory=list)

    def set_protobuf(self, proto):
        proto.state = self.state

        if self.link:
            self.link.set_protobuf(proto.link)

        if self.list_set:
            set_protos = [set_obj.to_protobuf() for set_obj in self.list_set]
            proto.sets.extend(set_protos)

        if self.list_eval:
            eval_protos = [eval_item.to_protobuf() for eval_item in self.list_eval]
            proto.evals.extend(eval_protos)

        if self.list_unset:
            unset_protos = [unset.to_protobuf() for unset in self.list_unset]
            proto.unsets.extend(unset_protos)

        if self.conditions:
            condition_protos = [condition_obj.to_protobuf() for condition_obj in self.conditions]
            proto.conditions.extend(condition_protos)

    def to_protobuf(self):
        proto = event_handler_pb2.SearchHandler()
        self.set_protobuf(proto)
        return proto


@dataclass
class SearchJobMetadata(SpacebridgeAppBase):
    """
    Search Job Metadata
    """
    properties: Dict = field(default_factory=dict)

    def __init__(self, properties={}):
        self.properties = properties

    # def __eq__(self, other):
    #     """
    #     Equality comparator
    #     """
    #     pass

    def is_failed(self):
        """
        Helper method to return if search job is failed
        :return:
        """
        return self.properties.dispatchState and self.properties.dispatchState == DispatchState.FAILED.value

    def get_first_error_message(self, default=''):
        """
        Helper to return the first error message formatted with type and text
        :return:
        """
        if self.properties.messages:
            first_message = to_message(self.properties.messages[0])
            return format_error(first_message.type, first_message.text)
        return default

    def __repr__(self):
        """
        Make object a string
        :return:
        """
        fields = ['sid', 'isDone', 'dispatchState', 'doneProgress', 'earliestTime', 'latestTime', 'sampleRatio',
                  'resultCount', 'reportSearch', 'messages']

        values = [self.properties.get(name, None) for name in fields]

        s = ", ".join([f"{fields[i]}=\"{values[i]}\"" for i in range(len(fields))])

        return f"SearchJobMetaData{{{s}}}"

    def set_protobuf(self, proto):
        """Takes a proto of type Search and populates
         the fields with the corresponding class values

        Arguments:
            proto {SearchJobMetadata}
        """

        for key in self.properties.keys():
            proto.properties[key] = str(self.properties[key])

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            SearchJobMetadata
        """
        proto = event_handler_pb2.SearchJobMetadata()
        self.set_protobuf(proto)
        return proto

    @property
    def sid(self):
        search_job_sid = get_string_field('sid', self.properties)
        return search_job_sid

    @property
    def dispatch_state(self):
        search_job_dispatch_state = DispatchState.from_string(get_string_field('dispatchState',
                                                                               self.properties)).value
        return search_job_dispatch_state

    @property
    def done_progress(self):
        search_job_done_progress = get_float_field('doneProgress', self.properties)
        return search_job_done_progress


def to_search_job_metadata(json_object) -> SearchJobMetadata:
    """
    Parse a Search Job Entry json into and return a SearchJobMetadata
    :param json_object:
    :return:
    """
    if json_object is not None and isinstance(json_object, dict):
        content = json_object.get('content')

        if content:
            return SearchJobMetadata(properties=content)

    return SearchJobMetadata()
