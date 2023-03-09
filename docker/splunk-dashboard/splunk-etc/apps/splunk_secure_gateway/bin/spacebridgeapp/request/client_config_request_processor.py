"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process client config requests for client settings from server
"""
from spacebridgeapp.util.config import secure_gateway_config
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME


LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_client_config_request_processor.log", "client_config_request_processor")


async def process_client_config_request(request_context, client_single_request, server_single_response):
    """
    Process client config request for client settings managed by the server
    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :return:
    """
    LOGGER.debug("Client Config Requested.")
    server_single_response.clientConfigResponse.requestTimeoutSecs = secure_gateway_config.get_request_timeout_secs()
