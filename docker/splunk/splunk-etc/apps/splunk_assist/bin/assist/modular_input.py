# Copyright 2016 Splunk, Inc.
# SPDX-FileCopyrightText: 2020 2020
#
# SPDX-License-Identifier: Apache-2.0

"""
This module provides a base class of Splunk modular input.
"""

import logging
import sys
import traceback
import time
import signal
import os
import threading

import urllib3

from urllib3.util import parse_url as urlparse
from urllib.parse import urlsplit
from urllib3.exceptions import InsecureRequestWarning

urllib3.disable_warnings(InsecureRequestWarning)

from abc import ABCMeta, abstractmethod
from six import with_metaclass

import defusedxml.ElementTree as ET

from splunklib.modularinput.argument import Argument
from splunklib.modularinput.scheme import Scheme
from splunklib.modularinput.input_definition import InputDefinition
from splunklib.modularinput.validation_definition import ValidationDefinition

from assist.logging import LOG_STDERR_FMT

LOGGER = logging.getLogger("modular_input")
__handler = logging.StreamHandler(sys.stderr)
__handler.setFormatter(logging.Formatter(LOG_STDERR_FMT))
LOGGER.addHandler(__handler)

__all__ = ["ModularInputException",
           "ModularInput",
           "OrphanProcessChecker",
           "OrphanProcessMonitor",
           "Argument",
           "BaseModularInput",
           "handle_teardown_signals"]


SCHEME_ENCODING = "unicode" if sys.version_info >= (3, 0) else "utf-8"


class ModularInputException(Exception):
    pass


SERVER_CHECK_TIMEOUT = 600
SERVER_CHECK_INTERVAL = 30
KV_STORE = 'kv_store'
DISABLED = 'disabled'
SEARCHHEAD = 'searchhead'
ACCEPTED_CLUSTER_MODES = [DISABLED, SEARCHHEAD]


class ModularInput(with_metaclass(ABCMeta, object)):
    """Base class of Splunk modular input.

    It's a base modular input, it should be inherited by sub modular input. For
    sub modular input, properties: 'app', 'name', 'title' and 'description' must
    be overriden, also there are some other optional properties can be overriden
    like: 'use_external_validation', 'use_single_instance', 'use_kvstore_checkpointer'
    and 'use_hec_event_writer'.

    Usage::

       >>> Class TestModularInput(ModularInput):
       >>>     app = 'TestApp'
       >>>     name = 'test_modular_input'
       >>>     title = 'Test modular input'
       >>>     description = 'This is a test modular input'
       >>>     use_external_validation = True
       >>>     use_single_instance = False
       >>>
       >>>     def extra_arguments(self):
       >>>         ... .. .
       >>>
       >>>     def do_validation(self, parameters):
       >>>         ... .. .
       >>>
       >>>     def do_run(self, inputs):
       >>>         ... .. .
       >>>
       >>> if __name__ == '__main__':
       >>>     md = TestModularInput()
       >>>     md.execute()
    """

    # App name, must be overriden
    app = None
    # Modular input name, must be overriden
    name = None
    # Modular input scheme title, must be overriden
    title = None
    # Modular input scheme description, must be overriden
    description = None
    # Modular input scheme use external validation, default is False
    use_external_validation = False
    # Modular input scheme use single instance mode, default is False
    use_single_instance = False

    def __init__(self):
        # Validate properties
        self._validate_properties()
        # Modular input state
        self.should_exit = False
        # Metadata
        self.server_host_name = None
        self.server_uri = None
        self.server_scheme = None
        self.server_host = None
        self.server_port = None
        self.session_key = None
        # Modular input config name
        self.config_name = None
        # Orphan process monitor
        self._orphan_monitor = None
        # Event writer
        self._event_writer = None

    def _validate_properties(self):
        if not all([self.app, self.name, self.title, self.description]):
            raise ModularInputException(
                'Attributes: "app", "name", "title", "description" must '
                "be overriden."
            )

    def _update_metadata(self, metadata):
        self.server_host_name = metadata["server_host"]
        splunkd = urlsplit(metadata["server_uri"])
        self.server_uri = splunkd.geturl()
        self.server_scheme = splunkd.scheme
        self.server_host = splunkd.hostname
        self.server_port = splunkd.port
        self.session_key = metadata["session_key"]

    def _do_scheme(self):
        scheme = Scheme(self.title)
        scheme.description = self.description
        scheme.use_external_validation = self.use_external_validation
        scheme.streaming_mode = Scheme.streaming_mode_xml
        scheme.use_single_instance = self.use_single_instance

        for argument in self.extra_arguments():
            name = argument["name"]
            title = argument.get("title", None)
            description = argument.get("description", None)
            validation = argument.get("validation", None)
            data_type = argument.get("data_type", Argument.data_type_string)
            required_on_edit = argument.get("required_on_edit", False)
            required_on_create = argument.get("required_on_create", False)

            scheme.add_argument(
                Argument(
                    name,
                    title=title,
                    description=description,
                    validation=validation,
                    data_type=data_type,
                    required_on_edit=required_on_edit,
                    required_on_create=required_on_create,
                )
            )

        return ET.tostring(scheme.to_xml(), encoding=SCHEME_ENCODING)

    def extra_arguments(self):
        """Extra arguments for modular input.

        Default implementation is returning an empty list.

        :returns: List of arguments like: [{'name': 'arg1',
                                            'title': 'arg1 title',
                                            'description': 'arg1 description',
                                            'validation': 'arg1 validation statement',
                                            'data_type': Argument.data_type_string,
                                            'required_on_edit': False,
                                            'required_on_create': False},
                                            {...},
                                            {...}]
        :rtype: ``list``
        """

        return []

    def do_validation(self, parameters):
        """Handles external validation for modular input kinds.

        When Splunk calls a modular input script in validation mode, it will
        pass in an XML document giving information about the Splunk instance
        (so you can call back into it if needed) and the name and parameters
        of the proposed input. If this function does not throw an exception,
        the validation is assumed to succeed. Otherwise any errors thrown will
        be turned into a string and logged back to Splunk.

        :param parameters: The parameters of input passed by splunkd.

        :raises Exception: If validation is failed.
        """

        pass

    def do_test(self):
        pass

    @abstractmethod
    def do_run(self, inputs):
        """Runs this modular input

        :param inputs: Command line arguments passed to this modular input.
            For single instance mode, inputs like: {
            'stanza_name1': {'arg1': 'arg1_value', 'arg2': 'arg2_value', ...}
            'stanza_name2': {'arg1': 'arg1_value', 'arg2': 'arg2_value', ...}
            'stanza_name3': {'arg1': 'arg1_value', 'arg2': 'arg2_value', ...}
            }.
            For multile instance mode, inputs like: {
            'stanza_name1': {'arg1': 'arg1_value', 'arg2': 'arg2_value', ...}
            }.
        :type inputs: ``dict``
        """

        pass

    def register_teardown_handler(self, handler, *args):
        """Register teardown signal handler.

        :param handler: Teardown signal handler.

        Usage::
           >>> mi = ModularInput(...)
           >>> def teardown_handler(arg1, arg2, ...):
           >>>     ...
           >>> mi.register_teardown_handler(teardown_handler, arg1, arg2, ...)
        """

        def _teardown_handler(signum, frame):
            handler(*args)

        handle_teardown_signals(_teardown_handler)

    def register_orphan_handler(self, handler, *args):
        """Register orphan process handler.

        :param handler: Orphan process handler.

        Usage::
           >>> mi = ModularInput(...)
           >>> def orphan_handler(arg1, arg2, ...):
           >>>     ...
           >>> mi.register_orphan_handler(orphan_handler, arg1, arg2, ...)
        """

        def _orphan_handler():
            handler(*args)

        if self._orphan_monitor is None:
            self._orphan_monitor = OrphanProcessMonitor(_orphan_handler)
            self._orphan_monitor.start()

    def get_validation_definition(self):
        """Get validation definition.

        This method can be overwritten to get validation definition from
        other input instead `stdin`.

        :returns: A dict object must contains `metadata` and `parameters`,
            example: {
            'metadata': {
            'session_key': 'iCKPS0cvmpyeJk...sdaf',
            'server_host': 'test-test.com',
            'server_uri': 'https://127.0.0.1:8089',
            },
            parameters: {'args1': value1, 'args2': value2}
            }
        :rtype: ``dict``
        """

        validation_definition = ValidationDefinition.parse(sys.stdin)
        return {
            "metadata": validation_definition.metadata,
            "parameters": validation_definition.parameters,
        }

    def get_input_definition(self):
        """Get input definition.

        This method can be overwritten to get input definition from
        other input instead `stdin`.

        :returns: A dict object must contains `metadata` and `inputs`,
            example: {
            'metadata': {
            'session_key': 'iCKPS0cvmpyeJk...sdaf',
            'server_host': 'test-test.com',
            'server_uri': 'https://127.0.0.1:8089',
            },
            inputs: {
            'stanza1': {'arg1': value1, 'arg2': value2},
            'stanza2': {'arg1': value1, 'arg2': value2}
            }
            }
        :rtype: ``dict``
        """

        input_definition = InputDefinition.parse(sys.stdin)
        return {
            "metadata": input_definition.metadata,
            "inputs": input_definition.inputs,
        }

    def execute(self):
        """Modular input entry.

          Usage::
             >>> Class TestModularInput(ModularInput):
             >>>         ... .. .
             >>>
             >>> if __name__ == '__main__':
             >>>     md = TestModularInput()
             >>>     md.execute()
          """

        if len(sys.argv) == 1:
            try:
                input_definition = self.get_input_definition()
                self._update_metadata(input_definition["metadata"])
                if self.use_single_instance:
                    self.config_name = self.name
                else:
                    self.config_name = list(input_definition["inputs"].keys())[0]
                self.do_run(input_definition["inputs"])
                LOGGER.info("Modular input: %s exit normally.", self.name)
                return 0
            except Exception as e:
                LOGGER.error(
                    "Modular input: %s exit with exception: %s.",
                    self.name,
                    traceback.format_exc(),
                )
                return 1
            finally:
                # Stop orphan monitor if any
                if self._orphan_monitor:
                    self._orphan_monitor.stop()

        elif str(sys.argv[1]).lower() == "--scheme":
            sys.stdout.write(self._do_scheme())
            sys.stdout.flush()
            return 0

        elif str(sys.argv[1]).lower() == '--test':
            return self.do_test()

        elif sys.argv[1].lower() == "--validate-arguments":
            try:
                validation_definition = self.get_validation_definition()
                self._update_metadata(validation_definition["metadata"])
                self.do_validation(validation_definition["parameters"])
                return 0
            except Exception as e:
                LOGGER.error(
                    "Modular input: %s validate arguments with exception: %s.",
                    self.name,
                    traceback.format_exc(),
                )
                root = ET.Element("error")
                ET.SubElement(root, "message").text = str(e)
                sys.stderr.write(ET.tostring(root))
                sys.stderr.flush()
                return 1
        else:
            LOGGER.error(
                'Modular input: %s run with invalid arguments: "%s".',
                self.name,
                " ".join(sys.argv[1:]),
            )
            return 1


class BaseModularInput(ModularInput):
    @abstractmethod
    def do_run(self, inputs):
        return True


class OrphanProcessChecker(object):
    """Orphan process checker.

    Only work for Linux platform. On Windows platform, is_orphan
    is always False and there is no need to do this monitoring on
    Windows.

    :param callback: (optional) Callback for orphan process.
    :type callback: ``function``
    """

    def __init__(self, callback=None):
        if os.name == "nt":
            self._ppid = 0
        else:
            self._ppid = os.getppid()
        self._callback = callback

    def is_orphan(self):
        """Check process is orphan.

        For windows platform just return False.

        :returns: True for orphan process else False
        :rtype: ``bool``
        """
        LOGGER.info("Orphan test, ppid=%s, getppid=%s", self._ppid, os.getppid())
        if os.name == "nt":
            return False

        return self._ppid != os.getppid()

    def check_orphan(self):
        """Check if the process becomes orphan.

        If the process becomes orphan then call callback function
        to handle properly.

        :returns: True for orphan process else False
        :rtype: ``bool``
        """

        res = self.is_orphan()
        if res and self._callback:
            self._callback()
        return res


class OrphanProcessMonitor(object):
    """Orpan process monitor.

    Check if process become orphan in background thread per
    iterval and call callback if process become orphan.

    :param callback: Callback for orphan process monitor.
    :type callback: ``function``
    :param interval: (optional) Interval to monitor.
    :type interval: ``integer``
    """

    def __init__(self, callback, interval=1):
        self._checker = OrphanProcessChecker(callback)
        self._thr = threading.Thread(target=self._do_monitor)
        self._thr.daemon = True
        self._started = False
        self._interval = interval

    def start(self):
        """
        Start orphan process monitor.
        """

        if self._started:
            return
        self._started = True

        self._thr.start()

    def stop(self):
        """
        Stop orphan process monitor.
        """

        joinable = self._started
        self._started = False
        if joinable:
            self._thr.join(timeout=1)

    def _do_monitor(self):
        while self._started:
            if self._checker.check_orphan():
                break

            for _ in range(self._interval):
                if not self._started:
                    break
                time.sleep(1)


def handle_teardown_signals(callback):
    """Register handler for SIGTERM/SIGINT/SIGBREAK signal.

    Catch SIGTERM/SIGINT/SIGBREAK signals, and invoke callback
    Note: this should be called in main thread since Python only catches
    signals in main thread.

    :param callback: Callback for tear down signals.
    :type callback: ``function``
    """

    signal.signal(signal.SIGTERM, callback)
    signal.signal(signal.SIGINT, callback)

    if os.name == "nt":
        signal.signal(signal.SIGBREAK, callback)
