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

"""Splunk modular input."""

from splunklib.modularinput.argument import Argument

from .checkpointer import CheckpointerException, FileCheckpointer, KVStoreCheckpointer
from .event import EventException, HECEvent, XMLEvent
from .event_writer import ClassicEventWriter, HECEventWriter
from .modular_input import ModularInput, ModularInputException

__all__ = [
    "EventException",
    "XMLEvent",
    "HECEvent",
    "ClassicEventWriter",
    "HECEventWriter",
    "CheckpointerException",
    "KVStoreCheckpointer",
    "FileCheckpointer",
    "Argument",
    "ModularInputException",
    "ModularInput",
]
