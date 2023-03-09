"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

ContextLogger override a standard Python Logger to append request_context to end of log events
"""
import contextvars
import io
import os
import logging
import sys
import traceback
from spacebridgeapp.util.constants import REQUEST_CONTEXT


class ContextVarNotFoundError(Exception):
    pass


class DuplicateContextVarsFoundError(Exception):
    pass


def get_var_from_ctx(var_name, default=None):
    """
    Return variable value from the ContextVar context associated to the given variable name. Throws an exception
    if multiple variables correspond to the variable name.
    :param var_name: String representing name of the variable
    :return: Object bound to variable name
    """
    ctx = contextvars.copy_context()

    result = []
    # Unfortunately the Context object does not support look up by variable name so we have to iterate to find it.
    for key, value in ctx.items():
        if key.name == var_name:
            result.append(value)

    if not result:
        if not default:
            raise ContextVarNotFoundError('No such context variable found with name={}'.format(var_name))
        return default

    # ContextVars does not enforce that variable names are unique, so we need to handle this edge case. However,
    # with our implementation, request_id will always be a unique because we create a new context for each
    # request.
    if len(result) > 1:
        raise DuplicateContextVarsFoundError(
            'Multiple context variables ({}) matched {}. Context variables must be unique.'.format(len(result),
                                                                                                   var_name))

    return result[0]


def add_ctx(msg):
    """
    Helper method used to append the context string to the end of a msg
    :param msg:
    :return:
    """
    try:
        request_context = get_var_from_ctx(REQUEST_CONTEXT)
    except ContextVarNotFoundError:
        request_context = None
    except DuplicateContextVarsFoundError:
        request_context = "request_id object was not unique"

    log_msg = "{} {}".format(msg, request_context) if request_context else msg
    return log_msg


class ContextLogger(logging.Logger):

    def __init__(self, name, level=logging.NOTSET):
        super(ContextLogger, self).__init__(name, level)

    def findCaller(self, stack_info=False):
        """
        Since we are wrapping the standard Python logger with our own, we lose the function level information
        associated to the call (every log line just gets associated with the ContextLogger as opposed to the function
        calling the logging). To fix this we need to change how the logger parses the call stack and basically skip the
        stack frames associated to the ContextLogger itself.

        This function overrides the base findCaller method and the implementation is nearly identical to the base
        implementation (which can be found at: https://github.com/python/cpython/blob/3.7/Lib/logging/__init__.py#L1446)
        except we change the stackframe to skip the current level.


        Find the stack frame of the caller so that we can note the source
        file name, line number and function name.
        """
        f = sys._getframe(3)
        if f is not None:
            f = f.f_back
        rv = "(unknown file)", 0, "(unknown function)", stack_info
        while hasattr(f, "f_code"):
            co = f.f_code
            filename = os.path.normcase(co.co_filename)
            if filename == __file__:
                f = f.f_back
                continue
            sinfo = None
            if stack_info:
                sio = io.StringIO()
                sio.write('Stack (most recent call last):\n')
                traceback.print_stack(f, file=sio)
                sinfo = sio.getvalue()
                if sinfo[-1] == '\n':
                    sinfo = sinfo[:-1]
                sio.close()
            rv = (co.co_filename, f.f_lineno, co.co_name, sinfo)
            break
        return rv

    def exception(self, msg, *args, **kwargs):
        super(ContextLogger, self).exception(add_ctx(msg), *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        super(ContextLogger, self).error(add_ctx(msg), *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        super(ContextLogger, self).warning(add_ctx(msg), *args, **kwargs)

    warn = warning

    def info(self, msg, *args, **kwargs):
        super(ContextLogger, self).info(add_ctx(msg), *args, **kwargs)

    def debug(self, msg, *args, **kwargs):
        super(ContextLogger, self).debug(add_ctx(msg), *args, **kwargs)


def override_logger():
    logging.setLoggerClass(ContextLogger)
