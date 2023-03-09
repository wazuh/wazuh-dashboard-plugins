# Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
from spacebridgeapp.util.constants import CLOUDGATEWAY
from builtins import object
import logging
from splunk import setupSplunkLogger
from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.Intersplunk import readResults
import os
import sys
from future.utils import with_metaclass

# On Windows System, suppress all logging exceptions
# if os.name == 'nt':
#    logging.raiseExceptions = False

LOG_DEFAULT_FMT = '%(asctime)s %(levelname)s [%(name)s] [%(module)s] [%(funcName)s] [%(process)d] %(message)s'
SEARCH_LOG_FILE = '{}.log'.format(CLOUDGATEWAY)

def setup_logging(logfile_name=None, logger_name=None, logger=None, level=logging.INFO, is_console_header=False,
                  log_format=LOG_DEFAULT_FMT, is_propagate=False):
    '''
    Setup logging

    @param logfile_name: log file name
    @param logger_name: logger name (if logger specified then we ignore this argument)
    @param logger: logger object
    @param level: logging level
    @param is_console_header: set to true if console logging is required
    @param log_format: log message format
    @param is_propagate: set to true if you want to propagate log to higher level
    @return: logger
    '''
    if (logfile_name is None or logger_name is None) and logger is None:
        raise ValueError(("log_name or logger_name is not specified and logger object is not provided."))

    if logger is None:
        # Logger is singleton so if logger is already defined it will return old handler
        logger = logging.getLogger(logger_name)

    logger = logger.logger if isinstance(logger, CloudgatewayLogger) else logger

    # Save the handlers before overwriting logger
    loghandlers = logger.handlers

    # If handlers is already defined then do not create new handler, this way we can avoid file opening again
    # which is issue on windows see ITOA-2439 for more information
    # Now we are checking if we need create new handler(s)
    hasFileHandler = False
    hasConsoleHandler = False
    handlerFormat = None
    for handler in loghandlers:
        if isinstance(handler, logging.handlers.RotatingFileHandler):
            handlerFormat = handlerFormat if handlerFormat else handler.formatter
            hasFileHandler = True
        elif isinstance(handler, logging.StreamHandler):
            handlerFormat = handlerFormat if handlerFormat else handler.formatter
            hasConsoleHandler = True

    # If logger_name is None: will create a child logger with different properties from parent.
    # If the given logger_name is not equal to the existing logger's name, also will create a child logger
    if logger_name is None or logger.name != logger_name:
        # dot(.) in the two log names make the new logger is the child of the existing logger,
        # so new handlers added to the new one will not impact the old one.
        logger = logging.getLogger("%s.%s" % (logger.name, logger_name if logger_name else "sub"))

    logger.propagate = is_propagate  # Prevent the log messages from being duplicated in the python.log file
    logger.setLevel(level)

    if not hasFileHandler:
        try:
            lockdir = make_splunkhome_path(['var', CLOUDGATEWAY, 'lock'])
            if not os.path.exists(os.path.dirname(lockdir)):
                os.mkdir(make_splunkhome_path(['var', CLOUDGATEWAY]))
                os.mkdir(make_splunkhome_path(['var', CLOUDGATEWAY, 'lock']))
            elif not os.path.exists(lockdir):
                os.mkdir(lockdir)
        except OSError as ose:
            #Swallow all "File exists" errors - another thread/process beat us to the punch
            if ose.errno != 17:
                raise

        logfile = logfile_name
        if os.path.basename(logfile_name) == logfile_name:
            logfile = make_splunkhome_path(['var', 'log', 'splunk', logfile_name])
        #Note that there are still some issues with windows here, going to make it so that we dont
        file_handler = logging.handlers.RotatingFileHandler(logfile, maxBytes=2500000, backupCount=5)
        file_handler.setFormatter(handlerFormat if handlerFormat else logging.Formatter(log_format))
        logger.addHandler(file_handler)

    if is_console_header and not hasConsoleHandler:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(handlerFormat if handlerFormat else logging.Formatter(log_format))
        logger.addHandler(console_handler)

    # Read logging level information from log.cfg so it will overwrite log
    # Note if logger level is specified on that file then it will overwrite log level
    LOGGING_DEFAULT_CONFIG_FILE = make_splunkhome_path(['etc', 'log.cfg'])
    LOGGING_LOCAL_CONFIG_FILE = make_splunkhome_path(['etc', 'log-local.cfg'])
    LOGGING_STANZA_NAME = 'python'
    setupSplunkLogger(
        logger,
        LOGGING_DEFAULT_CONFIG_FILE,
        LOGGING_LOCAL_CONFIG_FILE,
        LOGGING_STANZA_NAME,
        verbose=False
    )

    return logger


from time import time
from uuid import uuid1
class InstrumentCall(object):
    '''
    Instrument a call - i.e. see how long this thing takes and potentially trace through it in
                        order to gain understanding of how long it takes for either 1) This
                        particular method to run or 2) What other things
    is this method doing on the inside.
    If you just want to put transaction tracing on a method - use @InstrumentCall(logger)
    to decorate your method
    If you want to do more detailed tracing, use the push and the pop methods to instrument
    what you want to trace through.  Use the transaction_id returned (recommended) by the first
    push or define your own (doable, but be careful of duplicate values in multi-threaded
    environments
    '''
    start_times = {}
    owners = {}
    def __init__(self, logger, loginfo=True):
        '''
        Create the instrument call object (half decorator, half not)
        @param loginfo: A flag indicating that we want to log at info (vs debug)
        @param logger: The logger to log to
        '''
        self.logger = logger
        self.loginfo = loginfo


    def __call__(self, f):
        def wrapper(decorated_self, *args, **kwargs):
            start_time = time()
            if hasattr(f, '__name__'):
                method_name = f.__name__
            else:
                method_name = str(f)
            temporary_transaction_id = self.push(method_name)
            retval = f(decorated_self, *args, **kwargs)
            self.pop(method_name, temporary_transaction_id)

            return retval
        return wrapper

    def push(self, method, transaction_id=None, owner=None):
        '''
        Push based on the passed in transaction id
        '''
        start_time = time()
        if transaction_id is None:
            transaction_id = uuid1().hex

        if self.loginfo:
            log_method = self.logger.info
        else:
            log_method = self.logger.debug
        if owner is None:
            owner = "None"
        log_method("Invoked tid=%s method=%s start_time=%s owner='%s'",
                       transaction_id,
                       method,
                       start_time,
                       owner)

        InstrumentCall.owners[transaction_id] = owner
        if transaction_id not in InstrumentCall.start_times:
            InstrumentCall.start_times[transaction_id] = [start_time]
        else:
            InstrumentCall.start_times[transaction_id].append(start_time)
        return transaction_id


    def pop(self, method, transaction_id):
        '''
        Pop based on the transaction id
        '''
        if transaction_id not in InstrumentCall.start_times:
            self.logger.error("Timing information could not be determined ttid=%s", transaction_id)
            return

        start_time = InstrumentCall.start_times[transaction_id].pop()
        end_time = time()
        transaction_time = end_time - start_time

        owner = InstrumentCall.owners.get(transaction_id, "Missing")

        if self.loginfo:
            log_method = self.logger.info
        else:
            log_method = self.logger.debug
        log_method("Finished tid=%s method=%s start_time=%s end_time=%s transaction_time=%s owner='%s'",
                    transaction_id,
                    method,
                    start_time,
                    end_time,
                    transaction_time,
                    owner)
        if len(InstrumentCall.start_times[transaction_id]) == 0:
            #In longer runs, we would run into a memory problem, although unlikely, its easier
            #To deal with now
            del InstrumentCall.start_times[transaction_id]

UNTRACKED_LOG = "{}.untracked".format(CLOUDGATEWAY)
UNTRACKED_LOG_FILE = "{}_untracked.log".format(CLOUDGATEWAY)

currentframe = lambda: sys._getframe(3)
logging._srcfile = os.path.normcase(currentframe.__code__.co_filename)

"""
Singleton Meta Class for Cloudgateway logging

To be more precisely, this is singleton + proxy approach that allow dependencies
initialize logger first and use later. As long as process entry point initialize
it with logger name and logger file before sub module use it, sub module can still
log to the file that entry point specified.

It doesn't hurt for the sequence of getting/initializing the logger. It is only
hurt when sub module use it before entry point initialize the logger. In this
'bad' case(that may cause log conflict in multi-process environment), the logs go
to UNTRACKED_LOG_FILE. It is developer's responsibility that NOT logging to
UNTRACKED_LOG_FILE.
"""
class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        log = cls._instances[cls]
        if (args or 'logger_name' in kwargs) \
                and log.logger.name == UNTRACKED_LOG:
            # Reset logger from entry point
            for h in log.logger.handlers:
                # Make sure the old handlers are completely closed.
                h.close()
                log.logger.removeHandler(h)
            old_logger = log.logger
            try:
                log.logger = setup_logging(*args, **kwargs)
            except IOError as e:
                old_logger.exception(e)
                log.logger = old_logger
        return log

"""
A wrapper class for logger by calling setup_logging, and it is a singleton class
"""
class CloudgatewayLogger(with_metaclass(Singleton, object)):
    def __init__(self, logfile_name = UNTRACKED_LOG_FILE, logger_name = UNTRACKED_LOG,
                 level=logging.INFO, is_console_header=False, log_format=LOG_DEFAULT_FMT):
        """
        @param logfile_name: the log file name
        @param logger_name:  the name of the logger.
            This class is singleton and initialized at the entry point of process.
            And the logger name will be set by the entry point
            If the entry point does't initialize it, the first python module that
            constructs this object will set the name of this logger.
        @param level: logging level
        @param is_console_header: set to true if console logging is required
        @param log_format: log message format

        If the non-entry point of the process call the constructor, it will return
        the already created instance.

        But entry points should provide logfile_name and logger_name, otherwise, all
        logs belong to this process will log to UNTRACKED_LOG_FILE which should
        NEVER happen. Since UNTRACKED_LOG_FILE is a rescue approach to prevent ITSI
        from stop running.
        """
        self.logfile_name = logfile_name
        self.logger_name = logger_name
        self.logger = setup_logging(logfile_name, logger_name, level=level,
                                    is_console_header=is_console_header, log_format=log_format)
        

    def exception(self, msg, *args, **kwargs):
        self.logger.exception(msg, *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        self.logger.error(msg, *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        self.logger.warning(msg, *args, **kwargs)

    warn = warning

    def info(self, msg, *args, **kwargs):
        self.logger.info(msg, *args, **kwargs)

    def debug(self, msg, *args, **kwargs):
        self.logger.debug(msg, *args, **kwargs)

    def setLevel(self, level):
        self.logger.setLevel(level)

    def addFilter(self, filter):
        self.logger.addFilter(filter)

    def getLogFilePath(self):
        return make_splunkhome_path(['var', 'log', 'splunk', self.logfile_name])


"""
Default Logger
"""
logger = CloudgatewayLogger()

"""
Function to get logger for Modular Inputs
"""
def getLogger4ModInput(input_config, logger_name=None):
    """
    @param input_config:
        The stanza config section
    @param logger_name:
        The logger name
    @return:
        The singleton logger
    """

    # Use module name as stanza name if it is empty
    stanza_name = __name__ + '://' + __name__ if input_config is None or len(input_config) == 0 else list(input_config)[0]
    sourcetype, name = stanza_name.split('://')
    return CloudgatewayLogger("%s-%s.log" % (sourcetype if sourcetype.startswith('{}_'.format(CLOUDGATEWAY)) else '_'.format(CLOUDGATEWAY) + sourcetype, name),
                              logger_name if logger_name else "{}.".format(CLOUDGATEWAY) + sourcetype[5:] if
                      sourcetype.startswith('_'.format(CLOUDGATEWAY)) else sourcetype)

"""
Function to get logger for search command, the logger will write to search.log.
It also returns the settings and record from context if
So no target log file is required.
"""
def getLogger4SearchCmd(logger_name=None, level=logging.INFO, is_console_header=False,
                          has_header=True, return_all=False):
    """
    @param logger_name:
        The logger name
    @param level:
        The level of the logger
    @param is_console_header:
        Do we need console output for this logger?
    @param has_header:
        Do we need skip headers while reading settings from input?
    @param return_all:
        Do we need return settings and record?
    @return:
        Tuple of 3 elements: the singleton logger, the settings, and
        the record returned from readResults.
    """
    settings = dict()
    record = readResults(settings=settings, has_header=has_header)
    if logger_name is None:
        exec_file = os.path.basename(sys.argv[0])[:-3]
        logger_name = exec_file[8:] if exec_file.startswith('command_') else exec_file
    log_file = make_splunkhome_path(['var', 'run', 'splunk', 'dispatch', settings['sid'],
                                     SEARCH_LOG_FILE])

    logger = CloudgatewayLogger(log_file, logger_name, level=level, is_console_header=is_console_header)
    if return_all:
        return (logger, settings, record)
    return logger

"""
Function to get logger for other python process entry files.
"""
def getLogger(logger_name=None, logger_file=None, level=logging.INFO, is_console_header=False, log_format=LOG_DEFAULT_FMT):
    exec_file = os.path.basename(sys.argv[0])[:-3]
    if exec_file == 'root':
        # REST implementation files are started by root.py,
        # but we want get the implementation file from module_file
        exec_file = '_log'.format(CLOUDGATEWAY)
    if logger_name is None:
        logger_name = CLOUDGATEWAY + exec_file[5:] if exec_file.startswith(CLOUDGATEWAY) else exec_file
    if logger_file is None:
        logger_file = (exec_file if exec_file.startswith('_'.format(CLOUDGATEWAY)) else '{}_'.format(CLOUDGATEWAY) + exec_file) + ".log"
    return CloudgatewayLogger(logger_file, logger_name, level=level, is_console_header=is_console_header, log_format=log_format)
