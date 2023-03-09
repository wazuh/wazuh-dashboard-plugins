#
# Copyright 2021 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""This module provides log functionalities."""

import logging
import logging.handlers
import os.path as op
from threading import Lock

from .pattern import Singleton
from .splunkenv import make_splunkhome_path

__all__ = ["log_enter_exit", "LogException", "Logs"]


def log_enter_exit(logger: logging.Logger):
    """Decorator for logger to log function enter and exit.

    This decorator will generate a lot of debug log, please add this
    only when it is required.

    Arguments:
        logger: Logger to decorate.

    Examples:
        >>> @log_enter_exit
        >>> def myfunc():
        >>>     doSomething()
    """

    def log_decorator(func):
        def wrapper(*args, **kwargs):
            logger.debug("%s entered", func.__name__)
            result = func(*args, **kwargs)
            logger.debug("%s exited", func.__name__)
            return result

        return wrapper

    return log_decorator


class LogException(Exception):
    """Exception raised by Logs class."""

    pass


class Logs(metaclass=Singleton):
    """A singleton class that manage all kinds of logger.

    Examples:
      >>> from solnlib.import log
      >>> log.Logs.set_context(directory='/var/log/test',
                               namespace='test')
      >>> logger = log.Logs().get_logger('mymodule')
      >>> logger.set_level(logging.DEBUG)
      >>> logger.debug('a debug log')
    """

    # Normal logger settings
    _default_directory = None
    _default_namespace = None
    _default_log_format = (
        "%(asctime)s %(levelname)s pid=%(process)d tid=%(threadName)s "
        "file=%(filename)s:%(funcName)s:%(lineno)d | %(message)s"
    )
    _default_log_level = logging.INFO
    _default_max_bytes = 25000000
    _default_backup_count = 5

    # Default root logger settings
    _default_root_logger_log_file = "solnlib"

    @classmethod
    def set_context(cls, **context: dict):
        """Set log context.

        List of keyword arguments:

            directory: Log directory, default is splunk log root directory.
            namespace: Logger namespace, default is None.
            log_format: Log format, default is `_default_log_format`.
            log_level: Log level, default is logging.INFO.
            max_bytes: The maximum log file size before rollover, default is 25000000.
            backup_count: The number of log files to retain,default is 5.
            root_logger_log_file: Root logger log file name, default is 'solnlib'   .

        Arguments:
            context: Keyword arguments. See list of arguments above.
        """
        if "directory" in context:
            cls._default_directory = context["directory"]
        if "namespace" in context:
            cls._default_namespace = context["namespace"]
        if "log_format" in context:
            cls._default_log_format = context["log_format"]
        if "log_level" in context:
            cls._default_log_level = context["log_level"]
        if "max_bytes" in context:
            cls._default_max_bytes = context["max_bytes"]
        if "backup_count" in context:
            cls._default_backup_count = context["backup_count"]
        if "root_logger_log_file" in context:
            cls._default_root_logger_log_file = context["root_logger_log_file"]
            cls._reset_root_logger()

    @classmethod
    def _reset_root_logger(cls):
        logger = logging.getLogger()
        log_file = cls._get_log_file(cls._default_root_logger_log_file)
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            mode="a",
            maxBytes=cls._default_max_bytes,
            backupCount=cls._default_backup_count,
        )
        file_handler.setFormatter(logging.Formatter(cls._default_log_format))
        logger.addHandler(file_handler)
        logger.setLevel(cls._default_log_level)

    @classmethod
    def _get_log_file(cls, name):
        if cls._default_namespace:
            name = f"{cls._default_namespace}_{name}.log"
        else:
            name = f"{name}.log"

        if cls._default_directory:
            directory = cls._default_directory
        else:
            try:
                directory = make_splunkhome_path(["var", "log", "splunk"])
            except KeyError:
                raise LogException(
                    "Log directory is empty, please set log directory "
                    'by calling Logs.set_context(directory="/var/log/...").'
                )
        log_file = op.sep.join([directory, name])

        return log_file

    def __init__(self):
        self._lock = Lock()
        self._loggers = {}

    def get_logger(self, name: str) -> logging.Logger:
        """Get logger with the name of `name`.

        If logger with the name of `name` exists just return else create a new
        logger with the name of `name`.

        Arguments:
            name: Logger name, it will be used as log file name too.

        Returns:
            A named logger.
        """

        with self._lock:
            log_file = self._get_log_file(name)
            if log_file in self._loggers:
                return self._loggers[log_file]

            logger = logging.getLogger(log_file)
            handler_exists = any(
                [True for h in logger.handlers if h.baseFilename == log_file]
            )
            if not handler_exists:
                file_handler = logging.handlers.RotatingFileHandler(
                    log_file,
                    mode="a",
                    maxBytes=self._default_max_bytes,
                    backupCount=self._default_backup_count,
                )
                file_handler.setFormatter(logging.Formatter(self._default_log_format))
                logger.addHandler(file_handler)
                logger.setLevel(self._default_log_level)
                logger.propagate = False

            self._loggers[log_file] = logger
            return logger

    def set_level(self, level: int, name: str = None):
        """Set log level of logger.

        Set log level of all logger if `name` is None else of
        logger with the name of `name`.

        Arguments:
            level: Log level to set.
            name: The name of logger, default is None.
        """

        with self._lock:
            if name:
                log_file = self._get_log_file(name)
                logger = self._loggers.get(log_file)
                if logger:
                    logger.setLevel(level)
            else:
                self._default_log_level = level
                for logger in list(self._loggers.values()):
                    logger.setLevel(level)
                logging.getLogger().setLevel(level)
