# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
import json
from typing import List, Optional, Callable, Union, Tuple, Any
from json import JSONDecodeError
# splunk imports
import splunk

from splunklib.binding import HTTPError
import logger_manager as log
from rapid_diag.session_globals import SessionGlobals

# local imports
from rapid_diag.serializable import JsonObject, Serializable
from rapid_diag.util import get_server_name
from rapid_diag.debug_utils import Profiler # pylint: disable-msg=E0611
# below is needed to register signal handler
import rapid_diag.trace # pylint: disable=unused-import

API_VERSION = 1

_LOGGER = log.setup_logging("rapid_diag_handler_utils")

def create_rapiddiag_payload(data : Optional[Union[JsonObject, List[JsonObject], List[Serializable], str]] = None,
        error : Optional[str] = None,
        status : int = 200) -> JsonObject:
    """ Create payload returned by REST handlers.
        By default we return status 200 and an empty payload.
        If error is provided - data is not appended to the payload.
    """
    str_payload : str = "{}"
    # To avoid handling weird edge cases - drop data if error is provided
    if error:
        str_payload = json.dumps({ 'error' : error })
    elif data:
        # if we were provided with a string - add 'message' field
        if isinstance(data, str):
            str_payload = json.dumps({'message' : data})
        else:
        # otherwise - we assume it's a ready payload - so just use it
            str_payload = json.dumps(data)

    return {'payload': str_payload,
            'status': status,
            'headers': {
                'Content-Type': 'text/plain' # for now we use text content type for all payloads
                }
            }

def persistent_handler_wrap_handle(handler : Callable[[JsonObject], JsonObject], # pylint: disable=too-many-return-statements
                    args : Union[str, bytes],
                    supported_methods : Optional[List[str]] = None) -> JsonObject:

    if supported_methods is None:
        supported_methods=['GET']

    with Profiler(_LOGGER) as prof: # pylint: disable=unused-variable
        args_json : JsonObject = {}
        try:
            SessionGlobals.reset()
            args_json = json.loads(args)
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.exception("Payload must be a json parseable string, JSON Object, or JSON List: %s : %s",
                              str(args), str(e), exc_info=e)
            return create_rapiddiag_payload(error="Invalid request data: " + str(args) + "; exception=" + str(e))
        if args_json.get('method') not in supported_methods:
            _LOGGER.error("Request method must be in %s : %s", str(supported_methods), str(args))
            return create_rapiddiag_payload(error="Method Not Allowed: Request method must be in " +
                                            str(supported_methods), status=405)
        max_api_version = next((arg[1] for arg in args_json['query'] if arg[0] == 'max_api_version'), API_VERSION)
        if int(max_api_version) < API_VERSION:
            return create_rapiddiag_payload(error="Unable to provide results for max_api_version=" +
                                            str(max_api_version) + ", my_api_version=" +
                                            str(API_VERSION) + " is higher.")

        def build_error_message(description : str, details : str) -> str:
            return description + str(args_json['rest_path']) + ': ' + details

        try:
            return handler(args_json)
        except SyntaxError as e:
            _LOGGER.exception("Syntax error: %s", str(e), exc_info=e)
            return create_rapiddiag_payload(error="You've found a bug! Very embarrassing, " +
                                            "we're deeply sorry and would appreciate it if you " +
                                            "could report it back to Support: " + str(e))
        except splunk.RESTException as e:
            msg = build_error_message('REST Error processing request to ', e.msg)
            _LOGGER.exception(msg, exc_info=e)
            return create_rapiddiag_payload(error=msg, status=e.statusCode)
        except HTTPError as e:
            msg = build_error_message('HTTP Error processing request to ', e.reason)
            _LOGGER.exception(msg, exc_info=e)
            return create_rapiddiag_payload(error=msg, status=e.status)
        except Exception as e: # pylint: disable=broad-except
            msg = build_error_message('Error processing request to ', str(e))
            _LOGGER.exception(msg, exc_info=e)
            return create_rapiddiag_payload(error=msg)

def get_data_from_payload(args: JsonObject) -> Tuple[str, str, Any, str]:
    data = {}
    current_host = get_server_name(args['system_authtoken'])
    try:
        data = json.loads(args['payload'])
    except (JSONDecodeError, KeyError) as e:
        _LOGGER.exception("Failed to parse 'payload'.", exc_info=e)
    task_id = data['task_id'] if 'task_id' in data else ''
    new_task_id = data['new_task_id'] if 'new_task_id' in data else ''
    task_body = data if 'collectors' in data else ''
    host = data['host'] if 'host' in data else current_host
    return str(task_id), str(new_task_id), task_body, str(host)
