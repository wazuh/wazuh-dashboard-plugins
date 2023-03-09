#   Version 4.0
import sys,splunk.Intersplunk
import re
import urllib
import xml.sax.saxutils as sax


try:
    results,dummyresults,settings = splunk.Intersplunk.getOrganizedResults()
    
    for r in results:
        if "_raw" in r:
            raw = r["_raw"]
            rawOut = sax.unescape( raw )
            while( rawOut != raw ):
                raw = rawOut
                rawOut = sax.unescape( raw )                
            r["_raw"] = rawOut            
                
except:
    import traceback
    stack =  traceback.format_exc()
    results = splunk.Intersplunk.generateErrorResults("Error : Traceback: " + str(stack))

splunk.Intersplunk.outputResults( results )
