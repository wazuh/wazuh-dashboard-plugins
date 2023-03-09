#   Version 4.0
import sys,splunk.Intersplunk
import re
import urllib
import xml.sax.saxutils as sax

XML_KV_RE = re.compile("<(.*?)(?:\s[^>]*)?>([^<]*)</\\1>")

field = "_raw"

if len(sys.argv)>1:
    field = sys.argv[1]

try:
    results,dummyresults,settings = splunk.Intersplunk.getOrganizedResults()
    
    for r in results:
        if field in r:
            raw = r[field]
            rawOut = sax.unescape( raw )
            while( rawOut != raw ):
                raw = rawOut
                rawOut = sax.unescape( raw )                
            r[field] = rawOut

            for kvpair in XML_KV_RE.findall(rawOut):
                r[kvpair[0]] = kvpair[1]

except:
    import traceback
    stack =  traceback.format_exc()
    results = splunk.Intersplunk.generateErrorResults("Error : Traceback: " + str(stack))

splunk.Intersplunk.outputResults( results )
