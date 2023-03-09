# pylint: disable=missing-function-docstring,missing-class-docstring
from typing import Callable, Dict, Optional
from enum import Enum
from logging import Logger
from splunklib import six

DefaultException = Exception

# local imports
from rapid_diag.serializable import Serializable, JsonObject

class CollectorResult(Serializable):
    class Status(Enum):
        INITIAL = -1
        SUCCESS = 0
        PARTIAL_SUCCESS = 1
        FAILURE = 2
        ABORTED = 3
        TIMEOUT = 4

    STATUS_STRINGS : Dict[str, 'CollectorResult.Status'] = {
        'Initial': Status.INITIAL,
        'Success': Status.SUCCESS,
        'Partial Success': Status.PARTIAL_SUCCESS,
        'Failure': Status.FAILURE,
        'Aborted': Status.ABORTED,
        'Timeout' : Status.TIMEOUT
    }

    def __init__(self, status : 'CollectorResult.Status' = Status.INITIAL,
            message : Optional[str] = None,
            logger : Optional[Logger] = None,
            exception : Optional[DefaultException] = None,
            func : Optional[Callable] = None):
        Serializable.__init__(self)
        self.status = status
        self.message = message
        self.exception = exception
        if logger is not None and message:
            log_func = logger.info
            except_str = ''
            if status not in [CollectorResult.Status.SUCCESS, CollectorResult.Status.ABORTED]:
                if func is not None:
                    log_func = func
                else:
                    log_func = logger.error
                if exception is not None:
                    log_func = logger.exception
                    except_str = ' exception: ' + str(exception)
            # TODO maybe store message in the future so we can display all or some of it in the UI?
            log_func(message + except_str)

    @staticmethod
    def Success(message : Optional[str] = None, # pylint: disable=invalid-name
                logger : Optional[Logger] = None) -> 'CollectorResult':
        return CollectorResult(CollectorResult.Status.SUCCESS, message, logger)

    @staticmethod
    def Failure(message : Optional[str] = None, # pylint: disable=invalid-name
                logger : Optional[Logger] = None,
                func : Optional[Callable] = None) -> 'CollectorResult':
        return CollectorResult(CollectorResult.Status.FAILURE, message, logger, None, func)

    @staticmethod
    def Exception(exception : Optional[DefaultException] = None, # pylint: disable=invalid-name
                  message : Optional[str] = None,
                  logger : Optional[Logger] = None) -> 'CollectorResult':
        return CollectorResult(CollectorResult.Status.FAILURE, message, logger, exception)

    @staticmethod
    def Aborted(message : Optional[str] = None, # pylint: disable=invalid-name
                logger : Optional[Logger] = None,
                exception : Optional[DefaultException] = None) -> 'CollectorResult':
        return CollectorResult(CollectorResult.Status.ABORTED, message, logger, exception)

    @staticmethod
    def Timedout(message : Optional[str] = None, # pylint: disable=invalid-name
                 logger : Optional[Logger] = None,
                 exception : Optional[DefaultException] = None) -> 'CollectorResult':
        return CollectorResult(CollectorResult.Status.TIMEOUT, message, logger, exception)

    def isSuccess(self) -> bool: # pylint: disable=invalid-name
        return self.status==CollectorResult.Status.SUCCESS

    def isFailure(self) -> bool: # pylint: disable=invalid-name
        return self.status==CollectorResult.Status.FAILURE

    def isPartialSuccess(self) -> bool: # pylint: disable=invalid-name
        return self.status==CollectorResult.Status.PARTIAL_SUCCESS

    def isAborted(self) -> bool: # pylint: disable=invalid-name
        return self.status==CollectorResult.Status.ABORTED

    def get_status_string(self) -> str:
        return [key for key, value in CollectorResult.STATUS_STRINGS.items() if value == self.status][0]

    def to_json_obj(self) -> JsonObject:
        obj = {
            'status': self.get_status_string()
        }
        if self.message:
            obj['message'] = self.message
        if self.exception:
            obj['exception'] = str(self.exception)
        return obj

    @staticmethod
    def validate_json(obj : JsonObject) -> None:
        data_types = {"message": (six.text_type, type(None)), "exception": (six.text_type, type(None)),
                        "status": (six.text_type,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj : JsonObject) -> 'CollectorResult':
        try:
            status_int = CollectorResult.STATUS_STRINGS[obj['status']]
        except KeyError as e:
            raise ValueError('Unexpected \'status\' value status=' + str(obj['status'])) from e
        return CollectorResult(status=status_int, message=obj.get('message', None), exception=obj.get('exception', None))

Serializable.register(CollectorResult)

class AggregatedCollectorResult(CollectorResult):
    def __init__(self) -> None:
        CollectorResult.__init__(self)

    # TODO consider getting token instead, and storing result and task info for better reporting
    def add_result(self, result : CollectorResult) -> None:
        if self.status == CollectorResult.Status.INITIAL:
            self.status = result.status
        elif self.status!=result.status:
            if CollectorResult.Status.ABORTED in {result.status, self.status}:
                self.status = CollectorResult.Status.ABORTED
            else:
                self.status = CollectorResult.Status.PARTIAL_SUCCESS

Serializable.register(AggregatedCollectorResult)
