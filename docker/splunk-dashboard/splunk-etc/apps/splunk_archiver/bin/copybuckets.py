#
# Executes bucket copying on peers/indexers
#

import sys, json
import vixutils_duplicate as vixutils
import splunk.Intersplunk as isp
from builtins import map
if sys.version_info >= (3, 0):
    from splunk.vix import erp_launcher
else:
    import erp_launcher_duplicate as erp_launcher

def splitCommaList(commaSeparatedList):
    return map(lambda x: x.strip(), commaSeparatedList.split(','))

def keepRollingIndexes(indexes, vixes):
    indexesToKeep = set([])
    rollKey = 'output.buckets.from.indexes'
    for vixMap in vixes:
        if rollKey in vixMap and vixMap[rollKey]:
            indexesToKeep.update(set(splitCommaList(vixMap[rollKey])))

    return {k : v for k, v in indexes.items() if k in indexesToKeep}

def getProvidersAndVixesFromStdIn():
    # Ghetto parsing since splunk's parsing doesn't care about quote escaping
    # Only works when there's one and only one argument.
    jsonStr = sys.argv[1:][0].split("=",1)[1]
    if jsonStr == None:
        raise Exception("Missing required json blob in arguments " + str(sys.argv))
    jzon = json.loads(jsonStr)
    return (jzon['providers'], jzon['vixes'])


if __name__ == '__main__':
    providers, vixes = getProvidersAndVixesFromStdIn()

    results,dummyresults,settings = isp.getOrganizedResults()
    sessionKey = settings.get("sessionKey")
    if sessionKey == None:
        vixutils.generateErrorResults("username/password authorization not given to 'input'.")
    else:
        erp_launcher.launchSplunkMRForIndexes(sessionKey, 'roll', 'splunk_archiver.log', providers, vixes, keepRollingIndexes)
