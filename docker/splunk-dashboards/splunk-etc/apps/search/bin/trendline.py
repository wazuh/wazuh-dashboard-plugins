#   Version 4.0
import sys
import splunk.Intersplunk
from builtins import range

(isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)

if len(sys.argv) < 2:
    splunk.Intersplunk.parseError("No arguments provided")

trendInfoList = [] # list of dictionaries of information about trendlines

validTypes = ['sma', 'wma', 'ema']
maxPeriod = 10000

i = 1
while i<len(sys.argv):
    # expect argument in format: <type><period>(<fieldname>) [as <newname>]
    arg = sys.argv[i]
    pos = arg.find('(')
    if (pos < 1) or arg[-1] != ')':
        splunk.Intersplunk.parseError("Invalid argument '%s'" % arg)

    name = arg[0:pos]
    field = arg[pos+1:len(arg)-1]
    if len(field) == 0 or field[0:2] == '__':
        splunk.Intersplunk.parseError("Invalid or empty field '%s'" % field)

    trendtype = None
    period = 0
    try:
        for t in validTypes:
            if name[0:len(t)] == t:
                trendtype = t
                period = int(name[len(t):])
                if (period < 2) or (period > maxPeriod):
                    raise ValueError
    except ValueError:
        splunk.Intersplunk.parseError("Invalid trend period for argument '%s'" % arg)

    if trendtype is None:
        splunk.Intersplunk.parseError("Invalid trend type for argument '%s'" % arg)

    newname = arg
    if (i+2<len(sys.argv)) and (sys.argv[i+1].lower() == "as"):
        newname = sys.argv[i+2]
        i += 3
    else:
        i += 1

    trendInfoList.append({'type' : trendtype, 'period' : period,
                          'field' : field, 'newname' : newname,
                          'vals': [], 'last': None})


if isgetinfo:
    splunk.Intersplunk.outputInfo(False, False, True, False, None, True)
    # outputInfo automatically calls sys.exit()


results = splunk.Intersplunk.readResults(None, None, False)

for res in results:
    # each res is a dict of fields to values
    for ti in trendInfoList:
        if ti['field'] in res:
            try:
                ti['vals'].append(float(res[ti['field']]))
            except ValueError:
                pass # ignore non-numeric values

        if len(ti['vals']) > ti['period']:
            ti['vals'].pop(0)
        elif len(ti['vals']) < ti['period']:
            continue # not enough data yet

        newval = None

        if ti['type'] == 'sma':
            # simple moving average
            newval = sum(ti['vals']) / ti['period']
        elif ti['type'] == 'wma':
            # weighted moving average
            Total = 0
            for i in range(len(ti['vals'])):
                Total += (i+1)*(ti['vals'][i])
            newval = Total / (ti['period'] * (ti['period']+1) / 2)
        elif ti['type'] == 'ema':
            # exponential moving average
            if (ti['last'] is None):
                newval = ti['vals'][-1]
            else:
                alpha = float(2.0 / (ti['period'] + 1.0))
                newval = (alpha * ti['vals'][-1]) + (1 - alpha) * ti['last']

        ti['last'] = newval
        res[ti['newname']] = str(newval)


splunk.Intersplunk.outputResults(results)
