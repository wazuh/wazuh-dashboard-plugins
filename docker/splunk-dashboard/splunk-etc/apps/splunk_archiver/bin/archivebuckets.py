#
# Gets everything for executing hunkroll
#

import os
import sys
import splunk.Intersplunk as isp
import splunk.entity as en
import splunk.search
import splunk.rest as rest
from collections import OrderedDict
import vixutils_duplicate as vixutils
import json
import splunkio_duplicate as splunkio
import time
import itertools
import logging
import erp_launcher_duplicate as erp_launcher
from builtins import range, map
from splunk.mining.dcutils import LOGGING_FORMAT
from splunk.mining.dcutils import LoggingFormatterWithTimeZoneOffset

APP_NAME = 'splunk_archiver'
INDEXER_SEARCH_COMMAND_NAME = 'copybuckets'

defMaxBytes = 26214400
defMaxBackupIndex = 10
logger = logging.getLogger("splunk.archiver")
archiverLogHandler = logging.handlers.RotatingFileHandler(filename=os.path.join(os.environ['SPLUNK_HOME'], 'var', 'log', 'splunk', 'splunk_archiver.log'), mode='a', maxBytes=defMaxBytes, backupCount=defMaxBackupIndex)
archiverLogHandler.setFormatter(LoggingFormatterWithTimeZoneOffset(LOGGING_FORMAT))
logger.addHandler(archiverLogHandler)
logger.propagate = 0

class ErrorSet:
    def __init__(self, capacity):
        self.capacity = capacity
        self.errs = OrderedDict()
    
    def __setitem__(self, key, value):
        ''' Store items in the order the keys were last added 
        and remove the least recently used item if we're over capacity
        '''
        if key in self.errs:
            del self.errs[key]
        if len(self.errs) >= self.capacity:
            self.errs.popitem(last=False)
        self.errs[key] = value

    def __contains__(self, item):
        ''' check if item is in error set and update error set'''
        exists = item in self.errs
        self[item] = None
        return exists

ERRORS_POSTED = ErrorSet(1000)
ERRMSGS_ENABLED = True


def filterRollProviders(vixes, providers):
    rollProviders = {}
    for k,indexMap in vixes.items():
        p = indexMap['provider']
        if p not in rollProviders and p in providers:
            rollProviders[p] = providers[p]
    return rollProviders

def genSearchString(vixes, providers):
    m = {'vixes' : vixes, 'providers' : providers}
    # Uses nested json.dumps to escape the returned json string from the inner json.dumps
    return '| ' + INDEXER_SEARCH_COMMAND_NAME + ' json=' + json.dumps(json.dumps(m))

def executeSearch(search, **kwargs):
    return splunk.search.searchAll(search, **kwargs)

def prepareSearchExecution():
    vixutils.copyJars()

def resToDict(res):
    ret = {}
    for k in res.keys():
        ret[k] = res[k]
    return ret

def writeResults(results, sessionKey):
    dicts = [resToDict(x) for x in results]
    if len(dicts) is not 0:
        splunkio.write(dicts)
        postErrors(sessionKey, dicts)

def resultHasError(result):
    if ERRMSGS_ENABLED and 'prefix' in result.keys():
        prefix = str(result['prefix'])
        return prefix.startswith('Error') and isNewError(result['_raw'])
    return False

def isNewError(raw):
    return raw not in ERRORS_POSTED

def postErrors(sessionKey, dicts):
    try:
        if sys.version_info >= (3, 0):
            errors = filter(resultHasError, dicts)
        else:
            errors = itertools.ifilter(resultHasError, dicts)
        for err in errors:
            args = { "name": "rollercontroller_"+str(time.time()),
                     "severity": "error",
                     "value": str(err['_time'])+" "+str(err['_raw']) }
            rest.simpleRequest('messages', sessionKey, postargs=args,
                               method='POST', raiseAllErrors=True);
    except Exception as e:
        import traceback
        splunkio.write([{"stack":traceback.format_exc(),"exception":str(e)}])
        
def streamSearch(search, sessionKey):
    count = 0
    it = search.__iter__()
    while not search.isDone:
        while count is search.count and not search.isDone:
            time.sleep(0.1)
        take = search.count - count
        taken = list(itertools.islice(it, 0, take))
        count += len(taken)
        writeResults(taken, sessionKey)
    writeResults(list(it), sessionKey)

def cancelSearch(search):
    try:
        search.finalize()
        search.cancel()
    except:
        pass

def execute():
    try:
        keywords, argvals = isp.getKeywordsAndOptions()
        results,dummyresults,settings = isp.getOrganizedResults()
        sessionKey = settings.get('sessionKey')

        if sessionKey == None:
            return vixutils.generateErrorResults('sessionKey not passed to the search command, something\'s very wrong!')
       
        #check that the command is being executed by the scheduler 
        sid = settings.get('sid')
        if not sid.startswith('scheduler_') and not argvals.get('forcerun', '') == '1':
           return vixutils.generateErrorResults('rollercontroller is supposed to be ran by the scheduler, add forcerun=1 to force execution')

        # check if error messaging is disabled
        global ERRMSGS_ENABLED
        ERRMSGS_ENABLED = 'disablemsgs' not in keywords

        providers = erp_launcher.listProviders(sessionKey)
        rollVixes = erp_launcher.listVixes(sessionKey, 'disabled=0 AND vix.output.buckets.from.indexes=*')
        rollProviders = filterRollProviders(rollVixes, providers)
        searchString = genSearchString(rollVixes, rollProviders)

        kwargs = {}
        for k in ['owner', 'namespace','sessionKey','hostPath']:
            if k in settings:
                kwargs[k] = settings[k]

        if not os.path.exists(vixutils.getAppBinJars()):
            # first time we're copying jars, force bundle replication
            kwargs['force_bundle_replication'] = 1

        prepareSearchExecution()

        numRetries = argvals.get("retries", 1)

        for i in range(0, int(numRetries)):
            logger.info("Dispatching the search: %s" % searchString)
            search = splunk.search.dispatch(searchString, **kwargs)
            try:
                streamSearch(search, sessionKey)
            finally:
                cancelSearch(search)

    except Exception as e:
        import traceback
        splunkio.write([{"stack":traceback.format_exc(),"exception":str(e)}])
    finally:
        sys.stdout.flush()

if __name__ == '__main__':
    execute()

