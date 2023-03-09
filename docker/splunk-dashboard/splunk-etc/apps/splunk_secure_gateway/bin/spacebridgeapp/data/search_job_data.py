"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Search Job Python Data Objects
"""

from spacebridgeapp.data.base import SpacebridgeAppBase
from spacebridgeapp.data.dispatch_state import DispatchState
from spacebridgeapp.exceptions.error_message_helper import format_error


class Message(SpacebridgeAppBase):
    """
    Message object
    """

    def __init__(self, type=None, text=None):
        self.type = type
        self.text = text

    def __eq__(self, obj):
        """
        Equality comparator
        :param obj:
        :return:
        """
        if isinstance(obj, self.__class__):
            return obj.type == self.type and \
                   obj.text == self.text
        else:
            return False

    def __repr__(self):
        """
        Make object a string
        :return:
        """
        return "type=%s, text=%s" % (self.type, self.text)


# deprecated
class SearchJobContent(SpacebridgeAppBase):
    """
    Search Job encapsulates search job data
    """

    def __init__(self,
                 sid='',
                 is_done=False,
                 dispatch_state=DispatchState.NONE.value,
                 done_progress=0.0,
                 earliest_time='',
                 latest_time='',
                 sample_ratio=0,
                 result_count=0,
                 report_search='',
                 messages=[]):
        self.sid = sid
        self.is_done = is_done
        self.dispatch_state = dispatch_state
        self.done_progress = done_progress
        self.earliest_time = earliest_time
        self.latest_time = latest_time
        self.sample_ratio = sample_ratio
        self.result_count = result_count
        self.report_search = report_search
        self.messages = messages

    def __eq__(self, obj):
        """Equality comparator
        """
        if isinstance(obj, self.__class__):
            return obj.sid == self.sid and \
                   obj.is_done == self.is_done and \
                   obj.dispatch_state == self.dispatch_state and \
                   obj.done_progress == self.done_progress and \
                   obj.earliest_time == self.earliest_time and \
                   obj.latest_time == self.latest_time and \
                   obj.sample_ratio == self.sample_ratio and \
                   obj.result_count == self.result_count and \
                   obj.report_search == self.report_search and \
                   obj.messages == self.messages
        else:
            return False

    def is_failed(self):
        """
        Helper method to return if search job is failed
        :return:
        """
        return self.dispatch_state == DispatchState.FAILED.value

    def get_first_error_message(self, default=''):
        """
        Helper to return the first error message formatted with type and text
        :return:
        """
        if self.messages:
            return format_error(self.messages[0].type, self.messages[0].text)
        return default

    def __repr__(self):
        """
        Make object a string
        :return:
        """
        return "sid=%s, is_done=%s, dispatch_state=%s, done_progress=%s, earliest_time=%s, latest_time=%s, " \
               "sample_ratio=%s, result_count=%s, report_search=%s, messages=%s" \
               % (self.sid, str(self.is_done), self.dispatch_state, str(self.done_progress), self.earliest_time,
                  self.latest_time, str(self.sample_ratio), str(self.result_count), self.report_search, self.messages)
