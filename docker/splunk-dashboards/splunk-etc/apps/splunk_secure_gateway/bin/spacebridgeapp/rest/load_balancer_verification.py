"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for accessing and setting kvstore records
"""

import splunk.rest as rest
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.exceptions.load_balancer_exceptions import GetConfigError, AddressVerificationError
from spacebridgeapp.util import constants
from spacebridgeapp.util.config import secure_gateway_config as config


LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "load_balancer_verification")
from spacebridgeapp.util import py23


def get_uri(session_key):
    """
    Construct URI for REST API calls using the load balancer address or the Splunkd URI if not provided
    :param session_key:
    :return: URI string
    """
    load_balancer_address = config.get_load_balancer_address()
    uri = load_balancer_address if load_balancer_address else rest.makeSplunkdUri()
    if not uri:
        raise GetConfigError("Failed to get load balancer address from cloudgateway.conf")

    # If load balancer address is given, verify that it is correct
    if uri != rest.makeSplunkdUri():
        if not uri.endswith('/'):
            uri += '/'
        if not verify_load_balancer_address(uri, session_key):
            raise AddressVerificationError("Failed to verify load balancer address={}".format(uri))
    return uri


def verify_load_balancer_address(load_balancer_address, session_key):
    """
    Verify the given load balancer address is correct by making a REST API call and checking the http response code
    :param load_balancer_address:
    :param session_key:
    :return:
    """
    uri = '%sservices/authentication/users' % load_balancer_address

    try:
        response, content = rest.simpleRequest(uri, sessionKey=session_key, method='GET',
                                               getargs={'output_mode': 'json'}, raiseAllErrors=True)
    except Exception as e:
        LOGGER.exception("Failed to verify load_balancer_address={} with error={}".format(load_balancer_address, e))
        return False

    if response.status == 200:
        LOGGER.info('Successfully verified load balancer address={}'.format(load_balancer_address))
        return True
    else:
        LOGGER.error('Failed to verify load_balancer_address={} with status_code={} and response={}'
                     .format(load_balancer_address, response.status, response))
        return False
