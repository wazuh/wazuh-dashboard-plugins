"""
Module to help with MDM based registration
"""
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib'))

from abc import ABCMeta, abstractmethod
from cloudgateway.device import DeviceInfo, make_device_id
from enum import Enum
from spacebridge_protocol import http_pb2, sb_common_pb2

if sys.version_info < (3,0):
    from cloudgateway.private.twisted.clients.async_spacebridge_client import AsyncSpacebridgeClient
else:
    from cloudgateway.private.asyncio.clients.async_spacebridge_client import AsyncSpacebridgeClient


MDM_REGISTRATION_VERSION = sb_common_pb2.REGISTRATION_VERSION_1

class CloudgatewayMdmRegistrationError(Exception):
    """
    Exception class to encapsulate exceptions which can occur during MDM registration which will be sent
    back to the client
    """

    class ErrorType(Enum):
        """
        Enum of error types
        """
        INVALID_CREDENTIALS_ERROR = 0
        APPLICATION_DISABLED_ERROR = 1
        UNKNOWN_ERROR = 2
        REGISTRATION_VALIDATION_ERROR = 3

    def __init__(self, error_type, message):
        """
        Args:
            error_type (ErrorType enum): enum specifying the type of error
            message (string): error string describing error
        """
        self.message = message
        self.error_type = error_type

    def to_proto(self):
        """
        Creates a HttpError proto which can be sent back to the client device

        Returns (http_pb2.HttpError proto)
        """
        error = http_pb2.HttpError()
        error.message = self.message

        if self.error_type == self.ErrorType.APPLICATION_DISABLED_ERROR:
            error.code = http_pb2.HttpError.ERROR_APPLICATION_DISABLED

        elif self.error_type == self.ErrorType.INVALID_CREDENTIALS_ERROR:
            error.code = http_pb2.HttpError.ERROR_CREDENTIALS_INVALID

        elif self.error_type == self.ErrorType.REGISTRATION_VALIDATION_ERROR:
            error.code = http_pb2.HttpError.ERROR_REGISTRATION_VALIDATION_FAILED
            
        else:
            error.code = http_pb2.HttpError.ERROR_UNKNOWN
        return error

    def __str__(self):
        return str({'message': self.message, 'type': self.error_type})


class ServerRegistrationContext(object):
    """
    Interface for the server side aspect of MDM registration. Implementers are required to implement the following
    methods:
        - validate (username, password, device_info) -> boolean
            perform server side validation on whether the mdm registration request can proceed
        - create_session_token: (username, password) -> string
            generate a server side session token given a username and password
        - get_server_version: () -> string
            return the the current server side version number
        - persist_device_info: (DeviceInfo, username) -> None
            persist the device to the server side
    """
    __metaclass__ = ABCMeta

    @abstractmethod
    def validate(self, username, password, device_info):
        """
        Validates a mdm registration request. If the request is invalid, raises a
        CloudgatewayMdmRegistrationError
        Args:
            username:
            password:
            device_info:

        Returns:

        """
        raise NotImplementedError

    @abstractmethod
    def create_session_token(self, username, password):
        """
        Create a session token given a username and password
        Args:
            username:
            password:

        Returns: string representing session token

        """
        raise NotImplementedError

    @abstractmethod
    def get_server_version(self):
        """
        Returns (String): version of the server
        """
        raise NotImplementedError

    @abstractmethod
    def get_deployment_name(self):
        """
        Returns (String): name of the server
        """
        raise NotImplementedError

    @abstractmethod
    def persist_device_info(self, device_info, username):
        """
        Persist device info to the server

        Args:
            username: (String)
            device_info (DeviceInfo)
        Returns (None)

        """
        raise NotImplementedError

    @abstractmethod
    def get_mdm_signing_key(self):

        """

        Returns (Byte String): Mdm Signing key used to validate MDM registration requests

        """
        raise NotImplementedError

    @abstractmethod
    def get_server_type(self):
        """

        Returns (String): type of the server

        """
        raise NotImplementedError

    @abstractmethod
    def get_environment_meta(self, device_info, username, registration_info=None):
        """

        Returns (EnvironmentMetadata): Server side meta information

        """
        raise NotImplementedError
