import csv
import sys
import splunk.Intersplunk
from builtins import range

from splunk.stats_util.x11 import *


(isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)

if len(sys.argv) < 2:
    splunk.Intersplunk.parseError("No arguments provided")

x11InfoList = [] # list of dictionaries of information about x11

validTypes = ['add', 'mult']
maxPeriod = 10000

i = 1
period = 0
while i<len(sys.argv):
    # expect argument in format: [<type>][<period>](<fieldname>) [as <newname>]
    # or simply: <fieldname> [as <newname>]
    arg = sys.argv[i]
    pos = arg.find('(')
    if pos >= 0:
        if arg[-1] != ')':
            splunk.Intersplunk.parseError("Invalid argument '%s': missing closing )" % arg)
        field = arg[pos+1:len(arg)-1]
    else:
        if arg[-1] == ')':
            splunk.Intersplunk.parseError("Invalid argument '%s': missing openning (" % arg)
        field = arg
    if len(field) == 0 or field[0:2] == '__':
        splunk.Intersplunk.parseError("Invalid or empty field '%s'" % field)

    x11type = None
    if pos > 0:
        period_pos = 0
        name = arg[0:pos]
        for t in validTypes:
            if name[0:len(t)] == t:
                x11type = t
                period_pos = len(t)
                break
        if period_pos == len(name):
            period = 0
        else:
            try:
                period = int(name[period_pos:])
                if (period < 5) or (period > maxPeriod):
                    splunk.Intersplunk.parseError("Invalid x11 period for argument '%s': period can't be smaller than 5 or larger than %d" %(arg,maxPeriod))
            except ValueError:
                splunk.Intersplunk.parseError("Invalid x11 period or type for argument '%s'" % arg)

    if x11type is None:
        x11type = 'mult' # default type

    newname = arg;
    if i + 2 < len(sys.argv) and sys.argv[i+1].lower() == "as":
        newname = sys.argv[i+2]
        i += 3
    else:
        i += 1

    x11InfoList.append({'type' : x11type, 'period' : period,
                          'field' : field, 'newname' : newname,
                          'vals': [], 'last': None})


if isgetinfo:
    splunk.Intersplunk.outputInfo(False, False, True, False, None, True)
    # outputInfo automatically calls sys.exit()


results = splunk.Intersplunk.readResults(None, None, False)

for res in results:
    # each res is a dict of fields to values
    ti = x11InfoList[0]
    if ti['field'] in res:
        try:
            ti['vals'].append(float(res[ti['field']]))
        except ValueError:
            pass # ignore non-numeric values


ti = x11InfoList[0]
vals = ti['vals']

if len(vals) == 0:
    exit(0)

if period == 0:
    ti['period'] = findPeriod(vals)
    if ti['period'] < 5: ti['period'] = 5
if ti['period'] > 0 and len(vals) > 7*ti['period']: # number of values must be at least 7 times period, otherwise errors will happen
    ts = TS.fromlist (vals)
    ts.setPeriod (ti['period'])
    if x11type == "mult":
        x11 = X11(ts, "MULT")
    else:
        x11 = X11(ts,"ADD")

    sa = x11.seasonal_adjust()

    for i in range(min(len(results),len(ts))):
        results[i][ti['newname']] = str(sa[i])
else: # not enough values to do x11, so output original values
    for i in range(len(results)):
        results[i][ti['newname']] = str(vals[i])

splunk.Intersplunk.outputResults(results)
