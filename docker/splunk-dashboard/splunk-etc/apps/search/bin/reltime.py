#   Version 5.0
import splunk.Intersplunk as si
import time

MINUTE = 60
HOUR = 60 * MINUTE
DAY = 24 * HOUR
MONTH = 30 * DAY
YEAR = 12 * MONTH

# handle plurals nicely
def unitval(unit, val):
    plural = ""
    if val >= 2: plural = "s"
    return "%s %s%s ago" % (int(val), unit, plural)

def getReltime(results, timeFields, prefix):
    now = time.time()
    outResults = []

    # for each result
    for result in results:
        for fieldName in timeFields:
            utc = result.get(fieldName)
            if isinstance(utc, list):
                reltime = "unknown"
            elif utc == None:
                reltime = "unknown"
            else:
                diff = int(now - float(utc))
                if diff < -60:
                    reltime = "future"
                elif diff < 0: # handle weird case of client clock off slightly
                    reltime = "now"
                elif diff == 0:
                    reltime = "now"
                elif diff < MINUTE:
                    reltime = unitval("second", diff)
                elif diff < HOUR:
                    reltime = unitval("minute", diff / MINUTE)
                elif diff < DAY:
                    reltime = unitval("hour", diff / HOUR)
                elif diff < MONTH:
                    reltime = unitval("day", diff / DAY)
                elif diff < YEAR:
                    reltime = unitval("month", diff / MONTH)
                else:
                    reltime = unitval("year", diff / YEAR)
            if prefix:
                result[prefix+fieldName] = reltime
            else:
                result['reltime'] = reltime

        outResults.append(result)
    return outResults

if __name__ == '__main__':
    try:
        keywords,options = si.getKeywordsAndOptions()
        results,dummyresults,settings = si.getOrganizedResults()

        # _time is used as a default field if nothing is provided
        timefields = options.get('timefield', '_time')
         
        # prefix is required for multiple fields to ensure output fields are distinct
        prefix = options.get('prefix')

        timefields = timefields.strip('"')
        fields = [field.strip() for field in timefields.split(',')]
        
        # add default prefix for multiple timefields if not provided
        if (',' in timefields) and (not prefix):
            prefix = 'reltime_'
        
        results = getReltime(results, fields, prefix)

        si.outputResults(results)

    except Exception as e:
        import traceback
        stack =  traceback.format_exc()
        si.generateErrorResults("Error '%s'" % e)
