from twisted.internet.defer import Deferred
from twisted.python.failure import Failure

def add_error_back(d, logger=None):
    """
    Add an error callback to a deferred object. If a logger is provide, log the stack trace as well
    when the error callback fires.

    Args:
        d (Deferred):
    """

    def process_failure(failure):
        """

        Args:
            failure (Failure):
        """
        if logger:
            logger.exception(failure.getTraceback())
        return failure

    d.addErrback(process_failure)
    return d