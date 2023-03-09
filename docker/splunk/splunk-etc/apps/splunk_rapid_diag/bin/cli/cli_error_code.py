from enum import IntEnum

class ErrorCodes(IntEnum):
    """ Error codes used in CLI module.
    """
    SUCCESS = 0
    FILE_DOESNT_EXIST = 1
    FILE_EXIST = 2
    FILE_ACCESS_ERROR = 3
    UNKNOWN_ERROR = 4
    JSON_VALIDATION = 5
    INVALID_COMMAND = 6
    DUPLICATE_TASK_ID = 7
    ACTION_ABORTED = 8
    COLLECTION_FAILED = 9
    UPLOAD_FAILED = 10
