"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Named Exceptions for Spacebridge requests
"""
from http import HTTPStatus

from google.protobuf.wrappers_pb2 import StringValue
from splapp_protocol import common_pb2
from spacebridgeapp.logging.context_logger import add_ctx


class OperationHaltedError(Exception):

    def __init__(self):
        super(OperationHaltedError, self).__init__("Operation halted")


class SpacebridgeError(Exception):

    def __init__(self, message="Unknown error", code=common_pb2.Error.ERROR_UNKNOWN, client_minimum_version=None,
                 status_code=500):
        message = add_ctx(message)
        super(SpacebridgeError, self).__init__(message)
        self.code = code
        self.client_minimum_version = client_minimum_version
        self.status_code = status_code
        self.message = message

    def set_proto(self, response_object):
        response_object.error.code = self.code
        response_object.error.message = str(self)
        response_object.error.status_code = self.status_code
        if self.client_minimum_version:
            response_object.error.minimumVersion.CopyFrom(StringValue(value=self.client_minimum_version))


class SpacebridgeExpiredTokenError(SpacebridgeError):

    def __init__(self, message="Session token has expired", status_code=401, **kwargs):
        super(SpacebridgeExpiredTokenError, self).__init__(message=message,
                                                           code=common_pb2.Error.ERROR_SESSION_TOKEN_EXPIRED,
                                                           status_code=status_code,
                                                           **kwargs)


class JWTExpiredTokenError(SpacebridgeError):
    def __init__(self, message="JWT has expired", status_code=401, **kwargs):
        super(JWTExpiredTokenError, self).__init__(message=message,
                                                   code=common_pb2.Error.ERROR_JWT_EXPIRED,
                                                   status_code=status_code,
                                                   **kwargs)


class SpacebridgeCompanionAppError(SpacebridgeError):
    def __init__(self, message, **kwargs):
        super(SpacebridgeCompanionAppError, self).__init__(message, **kwargs)


class SpacebridgeCompanionAppNotRegisteredError(SpacebridgeCompanionAppError):
    def __init__(self, message="Requested companion splunk app is not registered on this instance", **kwargs):
        super(SpacebridgeCompanionAppNotRegisteredError, self).__init__(
            message,
            code=common_pb2.Error.ERROR_COMPANION_APP_NOT_REGISTERED,
            status_code=HTTPStatus.BAD_REQUEST,
            **kwargs
        )


class SpacebridgeUnsupportedMessageTypeError(SpacebridgeCompanionAppError):
    def __init__(self, message_type, **kwargs):
        super(SpacebridgeUnsupportedMessageTypeError, self).__init__(
            "unsupported_message_type={}".format(message_type),
            code=common_pb2.Error.ERROR_REQUEST_NOT_SUPPORTED,
            status_code=HTTPStatus.BAD_REQUEST,
            **kwargs
        )


class SpacebridgeApiRequestError(SpacebridgeError):

    def __init__(self, message="Unknown API error", **kwargs):
        super(SpacebridgeApiRequestError, self).__init__(message, common_pb2.Error.ERROR_API_REQUEST, **kwargs)


class SpacebridgeLargeResponseError(SpacebridgeError):

    def __init__(self, message="Response size is too large", **kwargs):
        super(SpacebridgeLargeResponseError, self).__init__(message, common_pb2.Error.ERROR_RESPONSE_TOO_LARGE,
                                                            **kwargs)


class SpacebridgeARPermissionError(SpacebridgeError):

    def __init__(self, message, status_code=403, **kwargs):
        super(SpacebridgeARPermissionError, self).__init__(message=message, status_code=status_code, **kwargs)
