"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Generic base class from which all custom Splunk-facing rest endpoints inherit. Generalizes
support for http methods, and abstracts out repetitive boilerplate and error-parsing logic
"""
import json
import os
import sys
import splunk

from spacebridgeapp.util import py23
from cloudgateway.private.exceptions.rest import CloudgatewayServerError
from cloudgateway.private.registration.registration_utils import RegistrationError
from spacebridgeapp.exceptions import spacebridge_exceptions
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.rest.util import errors
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.config import secure_gateway_config as config

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "rest_base")
MESSAGE = 'message'

if sys.platform == 'win32':
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class BaseRestHandler:
    """Base class for Spacebridge app REST endpoints."""

    def __init__(self):
        pass

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
            if constants.HEADERS in request:
                request[constants.HEADERS] = flatten_query_params(request[constants.HEADERS])
            request[constants.QUERY] = flatten_query_params(request[constants.QUERY])
            # Check for stale config data and update if necessary
            config.update_config()
            res = self.handle_request(request)

        # Handles errors and formats the response to the UI client
        except CloudgatewayServerError as err:
            LOGGER.exception("Cloudgateway error")
            res = {constants.PAYLOAD: {constants.MESSAGE: err.message}, constants.STATUS: err.status}
        except SpacebridgeApiRequestError as err:
            LOGGER.exception("SpacebridgeApiRequestError")
            res = {constants.PAYLOAD: {constants.MESSAGE: str(err)}, constants.STATUS: err.status_code}
        except errors.SpacebridgeRestError as err:
            LOGGER.exception("Spacebridge error")
            res = {constants.PAYLOAD: {constants.MESSAGE: err.message}, constants.STATUS: err.status}
        except spacebridge_exceptions.SpacebridgeError as err:
            LOGGER.exception("Spacebridge error")
            res = {constants.PAYLOAD: {constants.MESSAGE: err.message}, constants.STATUS: err.status_code}
        except splunk.RESTException as err:
            LOGGER.exception("Splunk rest error")
            res = {constants.PAYLOAD: {constants.MESSAGE: err.msg}, constants.STATUS: err.statusCode}
        except RegistrationError as err:
            LOGGER.exception("Splunk Secure Gateway Registration error")
            res = {constants.PAYLOAD: {constants.MESSAGE: str(err)}, constants.STATUS: err.code}
        except Exception as err:
            LOGGER.exception("Unhandled error")
            message = err.msg if hasattr(err, 'msg') else str(err)
            res = {
                constants.PAYLOAD: {constants.MESSAGE: message},
                constants.STATUS: err.statusCode if hasattr(err, 'statusCode') else 500
            }

        return self.format_response(res)

    def handle_request(self, request):
        method = request['method']
        if method == 'GET':
            return self.get(request)
        if method == 'POST':
            return self.post(request)
        if method == 'PUT':
            return self.put(request)
        if method == 'DELETE':
            return self.delete(request)
        return unsupported_method_response(method)

    def format_response(self, response):
        if isinstance(response, dict) and isinstance(response.get(constants.STATUS), int):
            headers = response.get('headers')
            if constants.PAYLOAD in response:
                payload = response[constants.PAYLOAD]

                if isinstance(payload, str):
                    payload = {constants.MESSAGE: payload, constants.STATUS: response[constants.STATUS]}

                json_response = {constants.PAYLOAD: payload, constants.STATUS: response[constants.STATUS]}
                if headers:
                    json_response['headers'] = headers
                return json.dumps(json_response)

            if 'binary' in response:
                json_response = {
                    'payload_base64': py23.b64encode_to_str(response['binary']),
                    constants.STATUS: response[constants.STATUS],
                }
                if headers:
                    json_response['headers'] = headers
                return json.dumps(json_response)

            # Format necessary needed for | rest command to be able to parse the result
            if 'raw_payload' in response:
                return {constants.PAYLOAD: response.get('raw_payload'), constants.HEADERS: {constants.HEADER_CONTENT_TYPE: 'application/json'}}

        status = response.get(constants.STATUS, 500) if isinstance(response, dict) else 500
        if not isinstance(status, int):
            status = 500

        json_response = {constants.PAYLOAD: response, constants.STATUS: status}
        return json.dumps(json_response)


    def get(self, request):
        return unsupported_method_response('GET')

    def post(self, request):
        return unsupported_method_response('POST')

    def put(self, request):
        return unsupported_method_response('PUT')

    def delete(self, request):
        return unsupported_method_response('DELETE')


def unsupported_method_response(method):
    return {constants.PAYLOAD: 'Error: Invalid method: %s' % method, constants.STATUS: 405}


def build_error_payload(e):
    return {
        constants.PAYLOAD: {
            'message': e.get_message_text(),
            'description': e.get_extended_message_text()
        },
        constants.STATUS: e.statusCode
    }


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
