# python imports
import os
import sys
import json
import ssl
import re
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
from rapid_diag.conf_util import RapidDiagConf
from rapid_diag.serializable import JsonObject
from rapid_diag.detach_process import DetachProcess
from rapid_diag.util import generate_splunkcom_payload
from rapid_diag.util import get_splunkhome_path

_LOGGER = log.setup_logging("splunkcom_upload_file_endpoint")

DEFAULT_OUTPUT_ROOT = RapidDiagConf.get_general_outputpath()
SPLUNK_BIN_PATH = get_splunkhome_path(["bin","splunk"])
APP_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
RAPIDDIAG_CLI_PATH = os.path.join(APP_ROOT, "splunk_rapid_diag", "bin", "cli", "__main__.py")

class SplunkcomUploadFileEndpoint(PersistentServerConnectionApplication):
    """ Persisten REST endpoint responsible for File upload to splunk.com.

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
            upload_file = data['upload_file']
            regexp = re.compile(r'.*gz$')
            # if upload file not inside the default output root then throw error
            # If the filename doesn't start with diag and end in tgz throw error
            if not str(upload_file).startswith(DEFAULT_OUTPUT_ROOT) or not regexp.search(os.path.basename(upload_file)):
                return create_rapiddiag_payload(error='Invalid directory path provided', status=404)

            sn_upload = generate_splunkcom_payload(data)
            sn_upload.case_number = int(data['case_number'])
            sn_upload.upload_user = data['upload_user']
            sn_upload.upload_description = data['upload_description']

            if not info_gather.ensure_upload_options(sn_upload):
                _LOGGER.error('Error parsing upload options')

            check_permission = info_gather.splunkcom_upload_permitted(upload_file, sn_upload)
            if not check_permission[0]:
                _LOGGER.error(check_permission[2])
                return create_rapiddiag_payload(error=check_permission[2], status=401)

            DetachProcess.spawnv_detached_with_stdin(
            SPLUNK_BIN_PATH, [SPLUNK_BIN_PATH, 'cmd', RAPIDDIAG_CLI_PATH, '--token_auth', 'upload', upload_file,
                            f"{int(data['case_number'])}", f"--upload_description=\"{data['upload_description']}\"",
                            f"--auth={data['upload_user']}:{data['upload_password']}",
                            f"--username=\"{data['upload_user']}\""],
                            args['system_authtoken'] + '\n')
            return create_rapiddiag_payload("File upload has started")

        except (urllib_error.URLError, urllib_error.HTTPError) as e:
            _LOGGER.error("Check splunk URL and login details: %s", str(e))
            return create_rapiddiag_payload(error='Check your credentials.', status=401)
        except ssl.SSLError as e:
            _LOGGER.error("SSL error check logs for more info: %s", str(e))
            return create_rapiddiag_payload(error='SSL error check logs for more info.', status=401)
        except (KeyError, ValueError) as e:
            _LOGGER.error("Value error check logs for more info: %s", str(e))
            return create_rapiddiag_payload(error='Key/Value Error check logs for more details')
        finally:
            if data:
                del data
