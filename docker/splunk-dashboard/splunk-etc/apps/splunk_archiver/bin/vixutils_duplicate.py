#
# THIS FILE IS A COPY OF $SPLUNK_SOURCE/python-site/splunk/vix/vixutils.py
#

import sys
import os
import shutil
from distutils import dir_util
import splunkio_duplicate as splunkio



def _trimDirToTemplate(template, target):
    """
    Recursively removes any files from target that are not also extant in template. Does not do much error checking, as it
    assumes that template files have already been written into target.
    """
    for f in os.listdir(target):
        templateChild = os.path.join(template, f)
        targetChild = os.path.join(target, f)
        if (os.path.isfile(targetChild) and (not os.path.exists(templateChild))):
            os.remove(targetChild)
        elif (os.path.isdir(targetChild)):
            if (os.path.exists(templateChild)):
                _trimDirToTemplate(templateChild, targetChild)
            else:
                shutil.rmtree(targetChild)

def _copyJars(splunkhome, appbinjars):
    splunkjars = os.path.join(splunkhome, 'bin', 'jars') 
    dir_util.copy_tree(splunkjars, appbinjars, update=1, verbose=0)
    _trimDirToTemplate(splunkjars, appbinjars)

def getAppBinJars():
    """
    Get the directory into which Splunk jars will be copied by copyJars(), i.e. the jar library home for this app.
    :return: A path string showing where Java processes launched by this app can find Hunk jars.
    """
    scriptDir = os.path.dirname(sys.argv[0])
    return os.path.abspath(os.path.join(scriptDir, '..', 'java-bin', 'jars'))

def copyJars():
    """
    Copy all the jars that Hunk ships with into the directory structure of an app. Assumes that python was invoked in the
    bin dir of that app. This allows bundle replication to distribute all the jars necessary to run a Hunk ERP command.
    Should be periodically re-invoked, in case Splunk was upgraded and the jars were refreshed.
    """
    _copyJars(os.environ['SPLUNK_HOME'], getAppBinJars())

# Using this function instead of splunk.Intersplunk.generateErrorResults
# since Intersplunk's function will output csv to stdout and we need to output
# splunkio format, because we're running 'generate = stream' search commands.
def generateErrorResults(msg):
    """
    Write a error as a nicely formatted event.
    :param msg: The error message.
    :return:
    """
    splunkio.write([{'ERROR':msg, '_raw':'ERROR ' + msg}])




