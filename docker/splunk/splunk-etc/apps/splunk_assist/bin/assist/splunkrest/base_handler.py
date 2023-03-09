"""
${copyright}

Generic base class from which all custom Splunk-facing rest endpoints inherit. Generalizes
support for http methods, and abstracts out repetitive boilerplate and error-parsing logic
"""
import json
import os
import sys
from dataclasses import dataclass
from typing import Dict, Union

from enum import Enum
from http import HTTPStatus

from assist.logging import setup_logging, logger_name
from assist.splunkrest import constants as http_constants

MESSAGE = 'message'

if sys.platform == 'win32':
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class HttpResult(Enum):
    OK = 'ok'
    ERROR = 'error'

    def __str__(self):
        return self.value

@dataclass
class HttpResponse:
    status: int
    result: HttpResult
    headers: dict
    payload: Union[Dict, str]
    raw: bool = False

    def build_splunk_payload(self) -> Union[Dict, str]:
        if self.raw:
            return self.payload

        return {
            http_constants.RESULT: str(self.result),
            http_constants.PAYLOAD: self.payload
        }


_UNSUPPORTED_METHOD_ERROR = HttpResponse(HTTPStatus.METHOD_NOT_ALLOWED,
                                         HttpResult.ERROR,
                                         dict(),
                                         {http_constants.MESSAGE: "Unsupported HTTP method"})


class BaseRestHandler:
    LOGGER = setup_logging(name=logger_name(__file__))

    def __init__(self):
        super().__init__()

    def handle(self, request_json_string):
        """
        Entry path for the REST registration endpoint. This function does the following:
            1. Parses relevant parameters out of the request JSON
            2. Calls the relevant handler based on the request type
            3. Handles errors and formats the response to the UI client

        :param request_json_string: JSON representation of the incoming http request
        :return: response body object and status code
        """
        try:
            # Perform common simplifications on the incoming request object
            request = json.loads(request_json_string)
            if http_constants.HEADERS in request:
                request[http_constants.HEADERS] = flatten_query_params(request[http_constants.HEADERS])
            request[http_constants.QUERY] = flatten_query_params(request[http_constants.QUERY])
            res = self.handle_request(request)

        except Exception as err:
            message = err.msg if hasattr(err, 'msg') else str(err)

            status = err.statusCode if hasattr(err, 'statusCode') else 500
            payload = {http_constants.MESSAGE: message}
            result = HttpResult.ERROR
            self.LOGGER.warning("Rest handler unhandled exception", exc_info=err)


            res = HttpResponse(status, result, dict(), payload)

        return self.format_response(res)

    def handle_request(self, request):
        method = request['method']
        self.LOGGER.info("new request, method=%s", method)
        if method == 'GET':
            return self.get(request)
        if method == 'POST':
            return self.post(request)
        if method == 'OPTIONS':
            return self.options(request)
        if method == 'PUT':
            return self.put(request)
        if method == 'DELETE':
            return self.delete(request)
        return _UNSUPPORTED_METHOD_ERROR


    def format_response(self, response: HttpResponse):
        headers = dict(response.headers)

        if http_constants.CONTENT_TYPE not in headers:
            headers[http_constants.CONTENT_TYPE] = http_constants.CONTENT_TYPE_APPLICATION_JSON

        response_obj = {
            http_constants.PAYLOAD: response.build_splunk_payload(),
            http_constants.STATUS: response.status,
            http_constants.HEADERS: headers
        }

        self.LOGGER.debug("http response, value=%s", response_obj)

        return response_obj

    def get(self, _) -> HttpResponse:
        return _UNSUPPORTED_METHOD_ERROR

    def post(self, _) -> HttpResponse:
        return _UNSUPPORTED_METHOD_ERROR

    def put(self, _) -> HttpResponse:
        return _UNSUPPORTED_METHOD_ERROR

    def delete(self, _) -> HttpResponse:
        return _UNSUPPORTED_METHOD_ERROR

    def options(self, _) -> HttpResponse:
        return _UNSUPPORTED_METHOD_ERROR


def flatten_query_params(params):
    """
    Transforms a list of lists for strings into a dictionary: [ [ 'key', 'value' ] ] => { "key": "value" }
    Used for the query parameters provided to the REST endpoint.

    :param params: List of lists of strings
    :return: Dictionary
    """
    flattened = {}
    for i, j in params:
        # Fixing this to account for repeated parameters
        item = flattened.get(i)
        # If item is already in dict
        if item:
            # This is the case where we have 2 or more items already
            if isinstance(item, list):
                flattened[i].append(j)
            # item is currently a singleton, make it a list and add second item
            else:
                flattened[i] = [item, j]
        else:
            flattened[i] = j
    return flattened
