#   Version 4.0
#
# NOTE: This script is used for a deprecated form of the 'return' command
# titled 'oldreturn'. The original script can be invoked by replacing usage of
# 'return' with 'oldreturn' -- the C++ implementation of this command can be
# found in src/search/processors/ReturnProcessor.(h/cpp).
#
# GOAL: to make subsearches easier, shorter, more obvious.
# current examples from answers.splunk.com
#     [... | head 2 | eval time=_time | fields time]
#     [... | head 2 | table source ]
#     [... |fields id]
#     [... | head 1 | rename _time as eventtype]
#     [ ... | fields a | rename a as server ]
#     [ ... | head 1 | eval earliest=_time-5 | eval latest=_time+5 | fields earliest,latest | format "(" "(" "" ")" "OR" ")" ]
#     eval foo= count * [ ... | rename size as query | fields query | head 1]
#
# IMPROVEMENTS: with one 'return' command, handle these cases with more convenience and speed:
#    1) limit results with 'head' and 'fields' automatically (punting on 'top' as backend can do better). 
#    2) allows convenient multiple field renaming. 
#    3) allow returning of field=values, or just values.
#    4) multiple rows output as ORs.  AND surpressed as unnecessary.
#    5) dedup rows of values.
#
# OUTPUT: one search result with one attribute: 'search'.  In a
# subsearch, if the top result has a 'search' attribute, that is what
# is used in the parent search pipeline.
#
#
# ONE RESULT VALUES
#     "head 1 | rename _time as foo | fields foo"  ===> "return foo=_time" ===> foo=123123123
# RETURN VAL
#     "rename size as query | fields query | head 1" ===> return $size ===> 3141
#     "fields bizdoc | rename bizdoc as search"      ===> "return $bizdoc"
#      return $srcip, $rip         ===> 10.1.1.1 127.1.1.1
#      return host, sourcetype     ===> host=localhost sourcetype=access_combined
# RETURN QUERY
#     "head 2 | eval time=_time | fields time" ===> "return 2 time=_time" ===> time=123 OR time=345
# ALL VALUES not best use
#     "fields id"  ===> "return -1 id" ===> id=1 OR id=2 OR id=3


import sys,re
import splunk.Intersplunk as si

def findNotInQuotes(text, find, i=0):
    index = -1
    inQuote = False
    l = len(text)
    while i < l:
        ch = text[i]
        if ch == '\\':
            i += 1
        elif ch == '"':
            inQuote = not inQuote
        elif text[i:].startswith(find) and not inQuote:
            index = i
            break
        i += 1
    return index

#return number earliest=_time-5, latest=_time+5
def parseArgs(txt):
    m = re.match('\s*(?:(?P<count>-?\d+)\s+)?(?P<variables>.+)', txt)
    if m == None:
        si.parseError(usage())
    md = m.groupdict()
    counttext = md['count']
    count = 1
    if counttext != None:
        count = int(counttext)
        
    variables = md['variables']
    mapping = []

    matches = re.findall("(?i)\s*(?:(?P<alias>[a-z0-9_.]+)\s*[=])?\s*(?P<field>[$a-z0-9_.]+)", variables)
    for alias, value in matches:
        if value.startswith('$'):
            value = value[1:]
        elif alias == '':
            alias = value
        mapping.append((alias, value))
    return count, mapping
    

def usage():
    return """Usage: [count] attr, $attrval, alias=attr, ..."""
    
def run(messages, count, mapping):
    
    results = si.readResults(None, None, True)

    ORS = []
    seenValues = set() # dedup rows
    for i, result in enumerate(results):
        if count > 0 and i >= count:
            break
        ANDS = []
        for j, (renamed, attr) in enumerate(mapping):
            val = str(result.get(attr,''))
            if renamed == None or renamed == '':
                if val != '':
                    ANDS.append(val)
            else:
                ANDS.append('%s="%s"' % (renamed, val))
        andstr = str(ANDS)        
        if len(ANDS) > 0 and andstr not in seenValues:            
            ORS.append(ANDS)
            seenValues.add(andstr)
                
    output = ""
    if len(ORS) > 1:
        output += "("
    for i, OR in enumerate(ORS):
        if i > 0:
            output += ") OR ("
        for j, AND in enumerate(OR):
            if j > 0:
                output += " " #" AND "
            output += AND
    if len(ORS) > 1:
        output += ")"

    si.outputResults([{'search': output}], messages)


if __name__ == '__main__':
    messages = {}
    try:
        (isgetinfo, sys.argv) = si.isGetInfo(sys.argv)
        argtext = ' '.join(sys.argv[1:])
        count, mapping = parseArgs(argtext)

        if isgetinfo:
            reqsop = True
            preop = "head %s" % count
            fields = [field for alias, field in mapping]
            if len(fields) > 0:
                preop += " | fields %s" % ', '.join(fields)
            si.outputInfo(False, False, False, reqsop, preop) # calls sys.exit()    
        run(messages, count, mapping)

    except Exception as e:
        import traceback
        stack =  traceback.format_exc()
        si.addErrorMessage(messages, "%s. Traceback: %s" % (e, stack.replace('\n','\\n')))
        si.outputResults([], messages)
