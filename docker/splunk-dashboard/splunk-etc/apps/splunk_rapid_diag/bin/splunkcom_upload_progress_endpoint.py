# python imports
import os
import sys
import json
import ssl
import glob
from urllib import error as urllib_error
from typing import Optional, Union

# Reloading the rapid_diag bin path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

# splunk imports
from splunk.persistconn.application import PersistentServerConnectionApplication

# local imports
import logger_manager as log
from rapid_diag_handler_utils import persistent_handler_wrap_handle, create_rapiddiag_payload
from rapid_diag.serializable import JsonObject
from rapid_diag.conf_util import RapidDiagConf

_LOGGER = log.setup_logging("splunkcom_upload_progress_endpoint")
DEFAULT_OUTPUT_ROOT = RapidDiagConf.get_general_outputpath()

class SplunkcomUploadProgressEndpoint(PersistentServerConnectionApplication):
    """ Persisten REST endpoint responsible for upload progress to splunk.com.

    """
    def __init__(self, command_line : Optional[str] = None, command_arg : Optional[str] = None) -> None:
        pass

    def handle(self, args : Union[str, bytes]) -> JsonObject:
        """ Main handler body
        """
        return persistent_handler_wrap_handle(self._handle, args, ['POST'])

    def _handle(self, args: JsonObject) -> JsonObject:

        try:
            ret = {}
            data = json.loads(args['payload'])
            diag_file = os.path.basename(data['diag'])
            _LOGGER.debug("Filtering by diag: %s", str(data['diag']))
            for file_name in glob.glob(DEFAULT_OUTPUT_ROOT + '/*/*upload.json'):
                if not diag_file and not diag_file in file_name:
                    continue
                with open(file_name) as file:
                    try:
                        data = json.load(file)
                    except ValueError as e:
                        return create_rapiddiag_payload(error='Error has occured reading status from file', status=401)
                    else:
                        ret[os.path.basename(file_name)] = data
            return create_rapiddiag_payload(data=json.dumps(ret))

        except (urllib_error.URLError, urllib_error.HTTPError) as e:
            _LOGGER.error("Check splunk URL and login details: %s", str(e))
            return create_rapiddiag_payload(error='Check your credentials.', status=401)
        except ssl.SSLError as e:
            _LOGGER.error("SSL error check logs for more info: %s", str(e))
            return create_rapiddiag_payload(error='SSL error check logs for more info.', status=401)
