"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for reading oia value
"""
import sys
import splunk
from http import HTTPStatus

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest.base_endpoint import BaseRestHandler, build_error_payload
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, PAYLOAD, STATUS


LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "oia_handler")


class OptInApproved(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the oia endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        """
        Get the oia value.  Default value is false.
        :param request:
        :return:
        """
        try:
            return {
                PAYLOAD: {'oia': config.get_oia()},
                STATUS: HTTPStatus.OK
            }
        except splunk.RESTException as e:
            return build_error_payload(e)

