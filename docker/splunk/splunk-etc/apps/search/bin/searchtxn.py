#   Version 4.0
import os, re, sys, time
import splunk
import splunk.search
import splunk.bundle as bundle
import splunk.Intersplunk as si
import splunk.util as util
import splunk.search.TransformerUtil as tu

MAX_SEARCH_COMPLEXITY = 1000 # at most N search terms.
NULL_VAL = "-=NULL=-"

def log(msg):
    pass #print msg

def escVal(val):
    return str(val).replace('\\', '\\\\').replace('"', '\\"')

def isTrue(s):
    s = s.lower().strip()
    return s.startswith("t") or s.startswith("y") or s.startswith("1")

## [purchase]
## maxspan  = 10m
## maxpause = 5m
## fields  = userid
## maxevents = 1000
## fields=host,cookie
## startswith=<transam-filter-string>
## endswith=<transam-filter-string>
## connected=<bool>
## maxopentxn=<int>
## maxopenevents=<int>
## keepevicted=<bool>
## mvlist=<bool>|<field-list>
## delim=<string>

def getTransactionInfo(tname, **kwargs):

    config = bundle.getConf('transactiontypes', **kwargs)

    if tname not in config:
        raise Exception("Unknown transactiontype: %s" % (tname))
        
    stanza = config[tname]
    if 'fields' not in stanza:
        raise Exception("Transactiontype has no fields: %s" % (tname))
        
    field_str = stanza['fields']
    fields = re.split("[ ,]+", field_str)
    base_search = '*'    
    if 'search' in stanza:
        base_search = stanza['search']

    maxspan = None
    if "maxspan" in stanza:
        maxspan = convertSpanToSecs(stanza["maxspan"])

    log("FIELDS: %s" % fields)
    return base_search, fields, maxspan


def convertSpanToSecs(span):
    #maxspan = [<integer> s|m|h|d]
    m = re.search("(\d+)([smhd])", span)
    if m == None:
        return None
    val, units = m.groups()
    val = int(val)
    if units == "m":
        val *= 60
    elif units == "h":
        val *= 60 * 60
    elif units == "d":
        val *= 24 * 60 * 60
    return val


def disjunctify(q):
    ## 'from="david carasso" to=amrit OR to=deep delay>4 AND delay<10 NOT subject=*erik* (rotsky OR rosensteel)'
    ## =====>
    ## '(from="david carasso") OR (to=amrit) OR (to=deep) OR (delay>4) OR (delay<10) OR (NOT subject=*erik*) OR ((rotsky OR rosensteel))'
    return " OR ".join(["(%s)" % term for term in tu.tokenize(q) if term not in ['OR','AND']])


# if popularity of term > N, just assume it's N to limit the cost of getting the most restrictive item
MAX_POPULARITY_EFFORT = 10000
# if a term is rare than this, screw it, just use it rather than spending time figuring out less popular terms
RARENESS_IS_GOOD_ENOUGH = 20

def termPopularity(term, **kwargs):
    return splunk.search.searchCount("search %s|fields|head %s" % (term, MAX_POPULARITY_EFFORT), **kwargs)
    
def getMostRestrictiveTerm(q, **kwargs):
    tokens = tu.tokenize(q)
    if len(tokens) < 2:
        return q
    mostRestrictive = None
    smallestCount = 99999999999
    for term in tokens:
        if term not in ['OR','AND']:
            count = termPopularity(term, **kwargs)
            log("term: %s count: %s" % (term, count))
            if count < smallestCount:
                smallestCount = count
                mostRestrictive = term
                if count <= RARENESS_IS_GOOD_ENOUGH:
                    log("term %s is rare enough (%s) to use and break early." % (term, count))
                    break
    return mostRestrictive

    
def findTransaction(tname, tconstraint, useORs, eventsOnly, maxTerms, messages, **kwargs):

    base_search, fields, maxspan = getTransactionInfo(tname, **kwargs)

    if maxspan == None:
        si.addWarnMessage(messages, "Add a maxspan contraint to the %s transactiontype definition to improve performance.  Searching over all time for transitive values." % tname)

    log("MAXSPAN: %s" % maxspan)
    
    # require one field in transaction definition
    fieldsearch = " OR ".join(["%s=*" % field for field in fields])

    initialConstraint = tconstraint
    if useORs:
        ## forces an OR of terms. slow and unnessary
        ## initialConstraint = disjunctify(tconstraint)
        # get the most restrictive term in the search and use that as the initial constrait to find events
        restrictiveTerm = getMostRestrictiveTerm(tconstraint, **kwargs)
        log("MOST RESTRICTIVE: %s" % restrictiveTerm)
        initialConstraint = restrictiveTerm
    # e.g., "sourcetype=sendmail" + "from=amrit" + "(qid=* OR mid=* OR pid=*)"
    index_search = "search (%s) (%s) (%s)" % (base_search, initialConstraint, fieldsearch)
    log("INDEX SEARCH: %s" % index_search)
    
    field_list_str = " ".join(fields)
    max_combos = maxTerms / len(fields)
    log("MAX_COMBINATION: %s" % max_combos)


    needsTIME = ""
    if maxspan != None:
        needsTIME = "_time"
        
    # make search to get field value pairs.
    #    # e.g. | stats values(qid) as qid values(mid) as mid values(pid) as pid
    #    stats_search = "| stats " + " ".join("values(%s) as %s" % (field, field) for field in fields)
    #    # use top
    #    stats_search = '| fillnull value="%s" %s | top %s %s showperc=false | addcoltotals' % (NULL_VAL, field_list_str, MAX_FIELD_COMBOS, field_list_str)
    #
    # TODO: if transactiondefinition contains maxspan, consider making
    # first stats_search return time ranges to limit values of fields
    stats_search = '| table %s %s | fillnull value="%s" %s | dedup %s | head %d' % (field_list_str, needsTIME, NULL_VAL, field_list_str, field_list_str, max_combos)

    seenFields = set()

    while True:

        search =  index_search + stats_search

        log("running search: %s" % search)
        results = splunk.search.searchAll(search, **kwargs)

        ## generate an OR of ANDS of field combinations -- (qid=1 pid=2) OR (qid=3 pid=4)..."
        ors = []
        # for each top permuation of field values
        for result in results:
            ands = []
            # for each field
            for field in result:
                if field == '_time': # if we have time field we must have maxspan
                    # if we have maxspan info about event, use it to limit window of events to +/- maxspan of window
                    # we don't need float precision, because subseconds don't matter in maxpan spec
                    eventtime = int(util.dt2epoch(util.parseISO(str(result['_time']))))
                    ands.append('_time>=%s' % (eventtime - maxspan))
                    ands.append('_time<=%s' % (eventtime + maxspan))
                else:
                    val = result[field]
                    # ignore empty values
                    if val != NULL_VAL:
                        seenFields.add(field) # add to list of fields with a value
                        ands.append('%s="%s"' % (field, escVal(result[field])))
                                
            ands_str = "(" + " ".join(ands) + ")"
            ors.append(ands_str)
        field_constraints = " OR ".join(ors)
        # e.g., "sourcetype=sendmail (qid=1 pid=2) OR (qid=3 pid=4)..."
        index_search = "search (%s) (%s)" % (base_search, field_constraints)
        log("INDEXSEARCH: %s" % index_search)
        
        if len(results) >= max_combos:
            si.addWarnMessage(messages, "Reached max complexity in trying to find transaction events with %s unique values per field.  Preferring more recent values.  A more detailed initial transaction constraint will allow more complete transactions" % max_combos)

        if seenFields == set(fields):
            log("SEEN VALUES FOR ALL FIELDS: %s" % fields)
            break

        if len(results) == 0:
            msg = "No results in searching for required fields"
            si.addWarnMessage(messages, msg)
            return []



    # we've retrieved all the events we're going to with the last index_search!


    if eventsOnly:
        # no transaction search, just return the events
        transaction_search = ""
    else:
        # this is it, find the transactions!
        transaction_search = '| transaction name="%s" | search %s' % (tname, tconstraint)

    search =  index_search + transaction_search
    log("running final search! %s" % search)
    results = splunk.search.searchAll(search, **kwargs)
        
    return results

def error(msg):
    # for some reason the old style generateErrorResults aren't making their way into the ui.
    #    si.generateErrorResults("Usage: searchtxn <transaction_type> <transaction_search>. Ex: searchtxn loginsessions user=bob")
    messages = {}
    si.addErrorMessage(messages, msg)
    si.outputResults([], messages)
    exit(0)

def usage():
    error("Usage: searchtxn <transaction_type> <transaction_search>. Ex: searchtxn loginsessions user=bob")
    
def main():
    if len(sys.argv) < 3:
        usage()
        
    tname = sys.argv[1]
    #log("args")
    #for v in sys.argv:
    #    log(v)

    options = ["max_terms", "use_disjunct", "eventsonly"]
    srchargs = []
    log("ARGS: %s" % sys.argv[2:])
    for arg in sys.argv[2:]:
        for option in options:
            if arg.startswith(option):
                break
        else:
            srchargs.append(arg)
    if len(srchargs) == 0:
        usage()

    tsearch = ' '.join(srchargs)
    log("SEARCH: %s" % tsearch)
        
    results,dummyresults,settings = si.getOrganizedResults()
    results = [] # we don't care about incoming results

    ########TEST#####################
    if 'sessionKey' not in settings:
        settings['owner']      = 'admin'
        settings['password']   = 'changeme'
        settings['namespace']  = 'search'
        settings['sessionKey'] = splunk.auth.getSessionKey('admin', 'changeme')
    ########TEST####################
    kwargs = {}
    for f in ['owner','namespace','sessionKey','hostPath']:
        if f in settings:
            kwargs[f] = settings[f]

    messages = {}
    try:
        maxTerms = int(settings.get("max_terms", MAX_SEARCH_COMPLEXITY))
        if maxTerms > MAX_SEARCH_COMPLEXITY or maxTerms < 1:
            si.addWarnMessage(messages, "max_terms must be between 1 and %s.  Using default." % MAX_SEARCH_COMPLEXITY)
            maxTerms = MAX_SEARCH_COMPLEXITY
    except Exception as e:
        maxTerms = MAX_SEARCH_COMPLEXITY

    dummy,options = si.getKeywordsAndOptions()
    makeORs    = isTrue(options.get("use_disjunct", "t"))
    eventsOnly = isTrue(options.get("eventsonly",   "f"))

    log("MAXTERMS: %s MAKEORS: %s eventsOnly: %s" % (maxTerms, makeORs, eventsOnly))
    log("tsearch: %s" % tsearch)

    results = []
    try:
        results = findTransaction(tname, tsearch, makeORs, eventsOnly, maxTerms, messages, **kwargs)
    except Exception as e:
        error(e)

    events = []
    log("RESULTS: %s" % len(results))
    for result in results:  # api fail
        event = {}
        for field in result:
            if field == '_time':
                event['_time'] = util.dt2epoch(util.parseISO(str(result['_time'])))
            else:
                event[field] = result[field]
        events.append(event)

    si.outputResults(events, messages)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        error(e)
