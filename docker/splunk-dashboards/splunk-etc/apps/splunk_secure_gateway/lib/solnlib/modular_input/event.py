#
# Copyright 2021 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""This module provides Splunk modular input event encapsulation."""

import json
from typing import List
from xml.etree import ElementTree as ET  # nosemgrep

import defusedxml.ElementTree as defused_et

__all__ = ["EventException", "XMLEvent", "HECEvent"]


class EventException(Exception):
    pass


class Event:
    """Base class of modular input event."""

    def __init__(
        self,
        data: dict,
        time: float = None,
        index: str = None,
        host: str = None,
        source: str = None,
        sourcetype: str = None,
        fields: dict = None,
        stanza: str = None,
        unbroken: bool = False,
        done: bool = False,
    ):
        """Modular input event.

        Arguments:
            data: Event data.
            time: (optional) Event timestamp, default is None.
            index: (optional) The index event will be written to, default is None.
            host: (optional) Event host, default is None.
            source: (optional) Event source, default is None.
            sourcetype: (optional) Event sourcetype, default is None.
            fields: (optional) Event fields, default is None.
            stanza: (optional) Event stanza name, default is None.
            unbroken: (optional) Event unbroken flag, default is False.
            done: (optional) The last unbroken event, default is False.

        Examples:
           >>> event = Event(
           >>>     data='This is a test data.',
           >>>     time=1372274622.493,
           >>>     index='main',
           >>>     host='localhost',
           >>>     source='Splunk',
           >>>     sourcetype='misc',
           >>>     fields= {'Cloud':'AWS','region': 'us-west-1'},
           >>>     stanza='test_scheme://test',
           >>>     unbroken=True,
           >>>     done=True)
        """

        self._data = data
        self._time = "%.3f" % time if time else None
        self._index = index
        self._host = host
        self._source = source
        self._sourcetype = sourcetype
        if fields:
            self._fields = fields
        self._stanza = stanza
        if not unbroken and done:
            raise EventException('Invalid combination of "unbroken" and "done".')
        self._unbroken = unbroken
        self._done = done

    def __str__(self):
        event = {
            "data": self._data,
            "time": float(self._time) if self._time else self._time,
            "index": self._index,
            "host": self._host,
            "source": self._source,
            "sourcetype": self._sourcetype,
            "stanza": self._stanza,
            "unbroken": self._unbroken,
            "done": self._done,
        }

        if hasattr(self, "_fields"):
            event["fields"] = self._fields

        return json.dumps(event)

    @classmethod
    def format_events(cls, events: List) -> List:
        """Format events to list of string.

        Arguments:
            events: List of events to format.

        Returns:
            List of formatted events string.
        """

        raise EventException('Unimplemented "format_events".')


class XMLEvent(Event):
    """XML event."""

    def _to_xml(self):
        _event = ET.Element("event")
        if self._stanza:
            _event.set("stanza", self._stanza)
        if self._unbroken:
            _event.set("unbroken", str(int(self._unbroken)))

        if self._time:
            ET.SubElement(_event, "time").text = self._time

        sub_elements = [
            ("index", self._index),
            ("host", self._host),
            ("source", self._source),
            ("sourcetype", self._sourcetype),
        ]
        for node, value in sub_elements:
            if value:
                ET.SubElement(_event, node).text = value

        if isinstance(self._data, str):
            ET.SubElement(_event, "data").text = self._data
        else:
            ET.SubElement(_event, "data").text = json.dumps(self._data)

        if self._done:
            ET.SubElement(_event, "done")

        return _event

    @classmethod
    def format_events(cls, events: List) -> List:
        """Format events to list of string.

        Arguments:
            events: List of events to format.

        Returns:
            List of formatted events string, example::

                [
                    '<stream>
                    <event stanza="test_scheme://test" unbroken="1">
                    <time>1459919070.994</time>
                    <index>main</index>
                    <host>localhost</host>
                    <source>test</source>
                    <sourcetype>test</sourcetype>
                    <data>{"kk": [1, 2, 3]}</data>
                    <done />
                    </event>
                    <event stanza="test_scheme://test" unbroken="1">
                    <time>1459919082.961</time>
                    <index>main</index>
                    <host>localhost</host>
                    <source>test</source>
                    <sourcetype>test</sourcetype>
                    <data>{"kk": [3, 2, 3]}</data>
                    <done />
                    </event>
                    </stream>'
                ]
        """

        stream = ET.Element("stream")
        for event in events:
            stream.append(event._to_xml())

        return [
            defused_et.tostring(stream, encoding="utf-8", method="xml").decode("utf-8")
        ]


class HECEvent(Event):
    """HEC event."""

    max_hec_event_length = 1000000

    def _to_hec(self, event_field):
        event = {}
        event[event_field] = self._data
        if self._time:
            event["time"] = float(self._time)
        if self._index:
            event["index"] = self._index
        if self._host:
            event["host"] = self._host
        if self._source:
            event["source"] = self._source
        if self._sourcetype:
            event["sourcetype"] = self._sourcetype
        if hasattr(self, "_fields"):
            event["fields"] = self._fields

        return json.dumps(event)

    @classmethod
    def format_events(cls, events: List, event_field: str = "event") -> List:
        """Format events to list of string.

        Arguments:
            events: List of events to format.
            event_field: Event field.

        Returns:
            List of formatted events string, example::

                [
                    '{"index": "main", ... "event": {"kk": [1, 2, 3]}}\\n
                    {"index": "main", ... "event": {"kk": [3, 2, 3]}}',
                '...'
                ]
        """

        size = 0
        new_events, batched_events = [], []
        events = [event._to_hec(event_field) for event in events]
        for event in events:
            new_length = size + len(event) + len(batched_events) - 1
            if new_length >= cls.max_hec_event_length:
                if batched_events:
                    new_events.append("\n".join(batched_events))
                del batched_events[:]
                size = 0

            batched_events.append(event)
            size = size + len(event)
        if batched_events:
            new_events.append("\n".join(batched_events))

        return new_events
