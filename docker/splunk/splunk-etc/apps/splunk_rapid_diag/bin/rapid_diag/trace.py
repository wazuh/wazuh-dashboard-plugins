import sys
import traceback
import signal
import threading
from types import FrameType
from typing import Callable, Any

# local imports
import logger_manager as log

_LOGGER = log.setup_logging("trace")

def stacktrace_signal_handler(_sig : int, _frame : FrameType) -> None:
    """Signal handler used to dump call stack to the log file.

    Useful when checking blocked handlers.
    """
    _LOGGER.info("Signal received - printing traceback")

    for thread in threading.enumerate():
        if thread.ident:
            # in python 3.8 we will have TID - use 'native_id' when available for TID
            _LOGGER.info("TID %d (%s) ID %d:", thread.ident, thread.name, thread.ident)
            sframe = sys._current_frames()[thread.ident]  # pylint: disable=protected-access
            for filename, lineno, name, line in traceback.extract_stack(sframe):
                _LOGGER.info("\t%s\t(%s:%d)", name, filename, lineno)
                _LOGGER.info("\t%s", line)

            _LOGGER.info("\tlocals: %s", str(sframe.f_locals))


def invoked_only_once(function : Callable) -> Any:
    """Decorator used to make sure given function is invoked only once"""

    def wrapper(*args : str, **kwargs : int) -> Any:
        if not wrapper.has_run: # type: ignore
            wrapper.has_run = True # type: ignore
            return function(*args, **kwargs)
        return lambda *args, **kwargs: None
    wrapper.has_run = False # type: ignore
    return wrapper


@invoked_only_once
def enable_call_stacks() -> None:
    """ Registers for SIGUSR1 which is used to generate the call stacks
    """
    if sys.platform != 'win32':
        signal.signal(signal.SIGUSR1, stacktrace_signal_handler)

# yes, we want this to be invoked on load
enable_call_stacks()
