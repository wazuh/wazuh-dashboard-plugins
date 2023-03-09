"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Logging helper module
"""
import logging

from spacebridgeapp.logging.setup_logging import setup_logging as itoa_logger
from spacebridgeapp.logging import context_logger
from spacebridgeapp.util.config import secure_gateway_config as config



context_logger.override_logger()


def get_log_level():
    """
    Helper method to get log_level from config and validate value or else return default
    :return:
    """
    log_level = config.get_log_level()
    if log_level is not None:
        log_level = log_level.strip().upper()
        if log_level == 'CRITICAL':
            return logging.CRITICAL
        elif log_level == 'ERROR':
            return logging.ERROR
        elif log_level == 'WARNING' or log_level == 'WARN':
            return logging.WARNING
        elif log_level == 'DEBUG':
            return logging.DEBUG
    # default value
    return logging.INFO


def setup_logging(log_name, logger_name, level=get_log_level(), is_console_header=False):
    return itoa_logger(log_name, logger_name, level=level, is_console_header=is_console_header)
