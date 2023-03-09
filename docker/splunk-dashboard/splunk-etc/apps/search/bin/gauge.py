#   Version 4.0
import sys
import splunk.Intersplunk

(isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)

if len(sys.argv) < 2:
    splunk.Intersplunk.parseError("Arguments are required")

if isgetinfo:
    splunk.Intersplunk.outputInfo(False, False, False, False, None)

results = splunk.Intersplunk.readResults(None, None, False)

newresult = {}
offset = 0
header = []

if len(results) > 0:
    for arg in sys.argv[1:]:
        val = None
        try:
            numarg = float(arg)
            val = arg
        except ValueError:
            # arg is not a number, interpret as a field name
            if arg in results[0]:
                val = results[0][arg]
        if val is not None:
            if offset == 0:
                newresult['x'] = val
                header.append('x')
            else:
                newresult[("y%d" % offset)] = val
                header.append("y%d" % offset)
            offset = offset + 1
            
newresults = []

if len(newresult) > 0:
    newresults.append(newresult)
        
splunk.Intersplunk.outputResults(newresults, None, header)
