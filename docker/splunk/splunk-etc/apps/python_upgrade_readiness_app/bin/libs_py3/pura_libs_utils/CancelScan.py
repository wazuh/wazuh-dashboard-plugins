import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'libs_py3'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'libs_py3','pura_libs_utils'))

from pura_libs_utils import pura_utils
from pura_libs_utils import pura_storage_utils
from pura_libs_utils import pura_logger_manager as logger_manager
logging = logger_manager.setup_logging('eura_check_python_tls')

class CancelScanException(Exception):
    def __init__(self, proceed, write_hash, message):
        super().__init__(message)
        self.proceed = proceed
        self.write_hash = write_hash
        self.message = message

    def __str__(self):
        return self.message


class CancelScan:
    __instance = None

    @staticmethod
    def get_instance(scan_details=None):
        if CancelScan.__instance is None:
            CancelScan(scan_details)
        return CancelScan.__instance

    def __init__(self, scan_details):
        if CancelScan.__instance is None:
            self.scan_details = scan_details
            CancelScan.__instance = self

    def check_cancelled_scan(self):
        scan_details = self.scan_details
        host = scan_details["host"]
        user = scan_details["user"]
        cancel_scan_key = scan_details["cancel_scan_key"]
        get_progress_collection = scan_details["get_progress_collection"]
        cancel_scan_collection = scan_details["cancel_scan_collection"]

        c_value = dict()

        cancelled, entry = pura_utils.is_cancelled(cancel_scan_key, user, host, cancel_scan_collection)
        if cancelled:
            file_details = pura_storage_utils.create_dirs_if_not_exists(get_progress_collection, user, host)
            _ = pura_storage_utils.add(file_details["file_path"], c_value, replace_file_contents=True)
            logging.info("Scan is cancelled hence raising exception.")
            raise CancelScanException(False, False, "The scan has been cancelled")

        return True, True
