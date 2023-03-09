"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Hosts APIs for CRUD operations on telemetry
"""
import sys
import json
import splunk
from http import HTTPStatus

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(
    ['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, PAYLOAD, STATUS, SESSION, AUTHTOKEN
from spacebridgeapp.metrics.telemetry_client import post_event, AsyncTelemetryClient
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log",
                       "rest_subscription_handler")


EVENTS = "events"


class UITelemetry(BaseRestHandler, PersistentServerConnectionApplication):

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.asyncTelemetryClient = AsyncTelemetryClient()

    def post(self, request):
        session_token = request[SESSION][AUTHTOKEN]
        auth_header = SplunkAuthHeader(session_token)

        body = json.loads(request[PAYLOAD])
        for event in body[EVENTS]:
            try:
                post_event(event, session_token, LOGGER)
            except:
                LOGGER.warn("Storing UI Telemetry Event Failed")

        return {
            PAYLOAD: "All telemetry events stored",
            STATUS: HTTPStatus.OK
        }
