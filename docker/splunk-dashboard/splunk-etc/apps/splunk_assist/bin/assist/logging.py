import logging
import datetime
import os
import sys
from datetime import timezone
from typing import Tuple
from enum import Enum, auto

from assist import constants
from assist.constants import LOG_PREFIX
from splunk import setupSplunkLogger
from splunk.clilib.bundle_paths import make_splunkhome_path

# logging.Formatter.formatTime = (lambda self, record, datefmt: datetime.datetime.fromtimestamp(record.created, datetime.timezone.utc).astimezone(timezone.utc).isoformat())

# LOG_DEFAULT_FMT = '%(asctime)s %(levelname)s %(message)s'
LOG_STDERR_FMT = '%(levelname)s [%(name)s:%(lineno)d] [%(funcName)s] [%(process)d] %(message)s'
LOG_FILE_FMT  = '%(asctime)s %(levelname)s [%(name)s] [%(module)s] [%(funcName)s] [%(process)d] %(message)s'

LOG_NAME_PREFIX=f'{LOG_PREFIX}::'

class LogOutput(Enum):
    STDERR = auto()
    FILE = auto()

def logger_name(file_name):
    return f'{LOG_NAME_PREFIX}{os.path.basename(file_name)}'

def configure_stderr_log(log: logging.Logger):
    formatter = logging.Formatter(LOG_STDERR_FMT)
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(formatter)
    log.addHandler(handler)

def configure_file_log(log: logging.Logger, name: str):
    if name.endswith('.py'):
        name = name[:-3]

    name = name.replace(LOG_NAME_PREFIX, '')

    logfile = make_splunkhome_path(['var', 'log', 'splunk', f'splunk_assist_{name}.log'])
    file_handler = logging.handlers.RotatingFileHandler(logfile, maxBytes=2500000, backupCount=5)

    formatter = logging.Formatter(LOG_FILE_FMT)
    file_handler.setFormatter(formatter)
    log.addHandler(file_handler)

def setup_logging(name, level=logging.INFO, output=LogOutput.STDERR):
    logging.addLevelName(logging.WARNING, 'WARN')
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if output == LogOutput.FILE:
        configure_file_log(logger, name)
    else:
        configure_stderr_log(logger)

    return logger

def level_for_supervisor_log(line: str) -> Tuple[int, str]:
  level = logging.DEBUG
  matches = [
      ("DEBUG ", logging.DEBUG),
      ("INFO ", logging.INFO),
      ("WARN ", logging.WARN),
      ("WARNING ", logging.WARN),
      ("ERROR ", logging.ERROR)
  ]

  for prefix, log_level in matches:
    if line.startswith(prefix):
      level = log_level
      line = line.replace(prefix, '')

  return level, line

def log_process_output(log: logging.Logger, output: bytes):
    logs = output.decode(constants.CHARSET_UTF8)
    log_lines = logs.split("\n")
    for line in log_lines:
        level, value = level_for_supervisor_log(line)
        log.log(level, value)

