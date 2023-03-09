import base64
import logging
import sys, subprocess, getopt
from logging.handlers import RotatingFileHandler

from splunk.clilib.bundle_paths import make_splunkhome_path
logPath = make_splunkhome_path(['var', 'log', 'splunk'])

# keys we'll be using when talking with splunk.
USERNAME    = "username"
# secure inputs configured in authentication.conf as key:value;key:value
# should be available to all functions that extract user information.
# This information is stored in a python dictionary 'args' and the
# readInputs() function below parses these arguments.
SCRIPT_SECURE_INPUTS = "--scriptSecureArguments"
SEC_INPUTS_DELIM = ";"
SEC_INPUTS_SUB_DELIM = ":"
USERTYPE    = "role"
SUCCESS     = "--status=success"
FAILED      = "--status=fail"
ERROR_MSG   = "--errorMsg="


def getLogger(path, idp):
    logger = logging.getLogger("splunk_scripted_authentication_{}".format(idp))
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler = RotatingFileHandler(path, maxBytes=25000000,
                                  backupCount=10)
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger

# read the inputs coming in and put them in a dict for processing.
def readInputs():
   optlist, args = getopt.getopt(sys.stdin.readlines(), '', ['username=', 'password=', 'scriptSecureArguments=', 'userInfo='])

   returnDict = {}
   for name, value in optlist:
      if name == SCRIPT_SECURE_INPUTS:
        # handle all the secure script inputs configured in authentication.conf
        secInputs = value.split(SEC_INPUTS_DELIM)
        for secInput in secInputs:
            tokens = secInput.split(SEC_INPUTS_SUB_DELIM, 1)
            returnDict[tokens[0]] = tokens[1].strip()
      else:
        returnDict[name[2:]] = value.strip()

   return returnDict

def urlsafe_b64encode_to_str(string):
    if sys.version_info < (3, 0):
        return base64.urlsafe_b64encode(string)

    return base64.urlsafe_b64encode(string.encode('utf-8')).decode('utf-8')
