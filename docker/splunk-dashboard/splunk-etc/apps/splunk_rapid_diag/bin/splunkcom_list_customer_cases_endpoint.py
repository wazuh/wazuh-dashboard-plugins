# python imports
import os
import sys
import json
import ssl
from urllib import error as urllib_error
from typing import Optional, Union

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

# splunk imports
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib import info_gather

# local imports
import logger_manager as log
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload
from rapid_diag.serializable import JsonObject
from rapid_diag.util import generate_splunkcom_payload

_LOGGER = log.setup_logging("splunkcom_list_customer_cases_endpoint")


class SplunkcomListCustomerCasesEndpoint(PersistentServerConnectionApplication):
    """ Persisten REST endpoint for listing customer cases.

    """
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None) -> None:
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        """ Main handler body
        """
        return persistent_handler_wrap_handle(self._handle, args, ['POST'])

    def _handle(self, args : JsonObject) -> JsonObject:
        try:
            data = json.loads(args['payload'])
            info_gather.logging_horrorshow()
            sn_upload = generate_splunkcom_payload(data)
            case_list = []
            for case in info_gather.fetch_case_list(sn_upload):
                case_list.append({"case_number": case.case_number, "title":case.title})
            return create_rapiddiag_payload(data=case_list)
        except (urllib_error.URLError, urllib_error.HTTPError) as e:
            _LOGGER.error("Check splunk URL and login details: %s", str(e))
            return create_rapiddiag_payload(error='Check your credentials.', status=401)
        except ssl.SSLError as e:
            _LOGGER.error("SSL error check logs for more info: %s", str(e))
            return create_rapiddiag_payload(error='SSL error check logs for more info.', status=401)
        finally:
            del data
            del sn_upload
