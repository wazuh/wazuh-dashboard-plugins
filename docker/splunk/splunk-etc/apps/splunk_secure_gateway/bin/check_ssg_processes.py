#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
# Splunk specific dependencies
import sys

from spacebridgeapp.util import py23

import psutil
from splunklib.searchcommands import dispatch, GeneratingCommand, Configuration

SECURE_GATEWAY_PROCESS_NAME = 'secure_gateway_modular_input.py'
SUBSCRIPTION_PROCESS_NAME = 'ssg_subscription_modular_input.py'
SODIUM_PROCESS_MATCH = 'libsodium-server'

SECURE_GATEWAY_KEY = 'secure_gateway'
SUBSCRIPTION_KEY = 'subscription'
SECURE_GATEWAY_SODIUM_KEY = 'secure_gateway_sodium'
SUBSCRIPTION_SODIUM_KEY = 'subscription_sodium'


def _check_for_script(cmdline, script_name):
    for arg in cmdline:
        if arg.endswith(script_name):
            return True
    return False


def _check_for_sodium_child(children):
    for child in children:
        if child.name().startswith(SODIUM_PROCESS_MATCH):
            return True
    return False


@Configuration(type='reporting')
class SecureGatewayPidCheck(GeneratingCommand):
    """
    This command checks that there are two python processes (websocket, subscriptions) running and that there are
    sodium processes attached to each.
    """

    def generate(self):
        status = {
            SECURE_GATEWAY_KEY: False,
            SUBSCRIPTION_KEY: False,
            SECURE_GATEWAY_SODIUM_KEY: False,
            SUBSCRIPTION_SODIUM_KEY: False
        }

        for p in psutil.process_iter():
            try:
                p.cmdline()
            except psutil.AccessDenied:
                continue

            if _check_for_script(p.cmdline(), SECURE_GATEWAY_PROCESS_NAME):
                status[SECURE_GATEWAY_KEY] = True
                status[SECURE_GATEWAY_SODIUM_KEY] = _check_for_sodium_child(p.children())
            elif _check_for_script(p.cmdline(), SUBSCRIPTION_PROCESS_NAME):
                status[SUBSCRIPTION_KEY] = True
                status[SUBSCRIPTION_SODIUM_KEY] = _check_for_sodium_child(p.children())
        yield status


dispatch(SecureGatewayPidCheck, sys.argv, sys.stdin, sys.stdout, __name__)
