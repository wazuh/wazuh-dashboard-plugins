"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Base class for all modular_inputs in this app.  All new modular_inputs should extend off this.
"""
from abc import abstractmethod
from solnlib import modular_input
from spacebridgeapp.rest.services.splunk_service import get_cluster_mode, get_server_roles

import time

SERVER_CHECK_TIMEOUT = 600
SERVER_CHECK_INTERVAL = 30
KV_STORE = 'kv_store'
DISABLED = 'disabled'
SEARCHHEAD = 'searchhead'
ACCEPTED_CLUSTER_MODES = [DISABLED, SEARCHHEAD]


class BaseModularInput(modular_input.ModularInput):

    def _should_modular_input_run(self):
        try:
            server_roles = get_server_roles(self.session_key)
            cluster_mode = get_cluster_mode(self.session_key)
            return cluster_mode in ACCEPTED_CLUSTER_MODES and KV_STORE in server_roles
        except Exception:
            # Fail closed
            return False

    @abstractmethod
    def do_run(self, inputs):
        count = 0
        while not self._should_modular_input_run():
            count += SERVER_CHECK_INTERVAL
            time.sleep(SERVER_CHECK_INTERVAL)
            if count >= SERVER_CHECK_TIMEOUT:
                return False
        return True

