"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Utilities for registration handlers
"""
from cloudgateway.splunk.auth import SplunkJWTCredentials
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.rest.registration.registration_webhook import validate_user
from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader
from spacebridgeapp.rest.services.splunk_service import get_current_context
from spacebridgeapp.rest.util.helper import extract_parameter
from enum import Enum

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_registration_utils")

class RegistrationMethod(Enum):
    """
    Enum for types of registration methods
    """

    AUTH_CODE = "auth_code"
    QR_CODE = "qr_code"
    IN_APP = "in_app"
    MDM = "mdm"
    UNKNOWN = "unknown"

class AuthMethod(Enum):
    """
    Enum for types of registration authentication methods
    """

    SAML = "saml"
    LOCAL_LDAP = "local_ldap"
    UNKNOWN = "unknown"

class DeviceManagementMethod(Enum):
    """
    Enum for types of device management methods
    """

    MDM = "mdm"
    NOT_MDM = "not_mdm"
    UNKNOWN = "unknown"

def validate_registration_via_webhook(user: str) -> None:
    """
    Method to validate user via registration webhook.
    :param username: string
    """
    LOGGER.debug('Received new registration confirmation request by user={}'.format(user))
    registration_webhook_url = config.get_registration_webhook_url()

    if registration_webhook_url:
        LOGGER.debug('Attempt to validate user via registration webhook')
        validate_user(registration_webhook_url, user, config.get_webhook_verify_ssl())
        LOGGER.debug('Successfully validated that user via registration webhook')


def is_valid_session_token(user: str, session_token: str) -> bool:
    """
    Method to validate that the user provided session token matches the user
    :param user: string
    :param session_token: string
    :return: boolean
    """
    response = get_current_context(session_token)
    context_user = response[constants.USERNAME]
    return user == context_user

def generate_jwt_token(user: str, system_authtoken: str):
    """
    Method to fetch and return JWT token. Will throw exception if fetch fails.
    :param user: string
    :param system_authtoken: string
    :return: SplunkJWTCredentials
    """
    credentials = SplunkJWTCredentials(user)
    credentials.load_jwt_token(SplunkAuthHeader(system_authtoken))
    LOGGER.debug("Successfully fetched jwt token for SAML auth user with username={}".format(user))
    return credentials

def extract_parameter_if_exists(obj, key, source_name, default_value):
    """
    If a value exists within a dictionary and is non-empty, returns it. Otherwise returns
    the provided default value
    """
    try:
        return extract_parameter(obj, key, source_name)
    except Exception as e:
        return default_value
