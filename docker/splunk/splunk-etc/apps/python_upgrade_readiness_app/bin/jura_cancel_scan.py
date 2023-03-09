import os
import re
import sys
import splunk.rest as sr
from splunk.persistconn.application import PersistentServerConnectionApplication

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from builtins import str
import pura_storage_utils

logging = logger_manager.setup_logging('jura_scan_deployment')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


class CancelScanHandler(PersistentServerConnectionApplication):
    """
    This is a REST handler base-class that makes implementing a REST handler easier.

    This works by resolving a name based on the path in the HTTP request and calls it.
    This class will look for a function that includes the HTTP verb followed by the path.abs
    """

    def __init__(self, command_line, command_arg):
        PersistentServerConnectionApplication.__init__(self)

    @classmethod
    def get_function_signature(cls, method, path):
        """
        Get the function that should be called based on path and request method.

        :param cls: class
        :param method: type of call (get/post/delete)
        :param path: the rest endpoint for which method is to be called

        :return name of the function to be called
        """

        if method == 'delete':
            return path.split('/jura_')[1]
        elif len(path) > 0:
            return method + re.sub(r'[^a-zA-Z0-9_]', '_', path).lower()
        else:
            return method

    def handle(self, in_string):
        """
        Handler function to call when REST endpoint is hit and process the call

        :param in_string: string of arguments

        :return Result of REST call
        """
        try:

            logging.info("Handling a request")

            # Parse the arguments
            args = utils.parse_in_string(in_string)

            # Get the user information
            self.session_key = args['session']['authtoken']
            self.user = args['session']['user']
            self.host = args['server']['hostname']

            # Get the method
            method = args['method']

            # Get the path and the args
            if 'rest_path' in args:
                path = args['rest_path']
            else:
                return utils.render_error_json(MESSAGE_NO_PATH_PROVIDED, 403)


            # Get the function signature
            function_name = self.get_function_signature(method, path)

            try:
                function_to_call = getattr(self, function_name)
            except AttributeError:
                function_to_call = None

            # Try to run the function
            if function_to_call is not None:
                logging.info("Executing function, name={}".format(function_name))

                return function_to_call()

            else:
                logging.warn("A request could not be executed since the associated function is missing, name={}"
                             .format(function_name))
                return utils.render_error_json(MESSAGE_PATH_NOT_FOUND, 404)

        except Exception as exception:
            logging.exception(MESSAGE_FAILED_HANDLE_REQUEST)
            return utils.render_error_json(str(exception))

    def cancel_scan(self):
        """
        Cancel a scan for a given user on given host.

        :return Cancel message and status
        """

        content = None
        file_details = pura_storage_utils.create_dirs_if_not_exists(jra_get_progress_collection, self.user, self.host)
        content = pura_storage_utils.read(file_details["file_path"])
        if content is None:
            logging.error(MESSAGE_ERROR_CANCEL_SCAN.format(self.user, self.host))
            return utils.render_error_json(MESSAGE_ERROR_CANCEL_SCAN.format(self.user, self.host))
        else:
            get_progress_entry = None
            for entry in content:
                if self.host == entry['host'] and self.user == entry['user']:
                    get_progress_entry = entry
                    break
            if get_progress_entry:
                file_details = pura_storage_utils.create_dirs_if_not_exists(jra_cancel_scan_collection, self.user, self.host)
                content = pura_storage_utils.read(file_details["file_path"])
                if not content:
                    logging.error(MESSAGE_ERROR_CANCEL_SCAN.format(self.user, self.host))
                    return utils.render_error_json(MESSAGE_ERROR_CANCEL_SCAN.format(self.user, self.host))
                for entry in content:
                    if not entry['cancelled']:
                        scan_report = {
                            'status': PROGRESS_COMPLETE,
                            'message': MESSAGE_CANCEL_SCAN_SUCCESS.format(self.user, self.host),
                            'progress': 100
                        }
                        cancelled_status = self.set_cancelled(entry, get_progress_entry)
                        if cancelled_status:
                            return utils.render_json(scan_report)
                        else:
                            break
        return utils.render_error_json(MESSAGE_NO_ENTRY_FOUND, 404)

    def set_cancelled(self, cancel_scan_entry, get_progress_entry):
        """
        Set cancelled flag true for given entry in KV store.

        :param entry: current scan report

        :return cancel status(true/false)
        """
        key = get_progress_entry['_key']
        get_progress_entry['progress'] = 100
        get_progress_entry['status'] = PROGRESS_COMPLETE
        file_details = pura_storage_utils.create_dirs_if_not_exists(jra_get_progress_collection, self.user, self.host)
        response = pura_storage_utils.update(file_details["file_path"], get_progress_entry, key)
        key = cancel_scan_entry['_key']
        cancel_scan_entry['cancelled'] = True
        file_details = pura_storage_utils.create_dirs_if_not_exists(jra_cancel_scan_collection, self.user, self.host)
        response = pura_storage_utils.update(file_details["file_path"], cancel_scan_entry, key)

        if not response:
            logging.error(MESSAGE_ERROR_CANCEL_SCAN.format(self.user, self.host))
            return False

        return True
