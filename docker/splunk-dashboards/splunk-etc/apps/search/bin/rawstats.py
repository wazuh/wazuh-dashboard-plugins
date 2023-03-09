#   Version 4.0
import sys,splunk.Intersplunk
import re
import urllib


ipre = re.compile("\d+\.\d+\.\d+\.\d+")

results = []

def charCount(text):
    return len(text)

def stats(r):
    """returns the median, average, standard deviation, min and max of a sequence"""
    tot = sum(r)
    avg = tot/len(r)
    sdsq = sum([(i-avg)**2 for i in r])
    s = sorted(r)
    return s[len(s)//2], avg, (sdsq/(len(r)-1 or 1))**.5, min(r), max(r)

# return stats on width
def widthStats(lines):
    widths = [len(line) for line in lines]
    return stats(widths)

# return stats on left margin
wsre = re.compile("\s*")
def marginStats(lines):
    leftMargins = [wsre.match(line).end() for line in lines]
    return stats(leftMargins)


# first character of each line. javastack: firstchars="[ttttt*" (t=tab). conffile: firstchars = "*[==*[=="
def firstChars(lines):
    firstchars = [line[0] for line in lines]
    return '"' + "".join(firstchars) + '"'


breakers = re.compile("[\\t ,;#$%&+./:=?@'|*(){}<>\\[\\]^!-]")
# take first punc of each line and give most common one.
def firstPuncts(lines):
    firstpuncts = []
    for line in lines:
        match = breakers.search(line)
        if match:
            if match == '\t':
                match = 't'
            elif match == '\r':
                match = 'r'
            elif match == '\\':
                match = 'r'
            firstpuncts.append(match.group())
    return '"' + "".join(firstpuncts) + '"'

def classCounts(text):
     cisalnum = cisalpha = cislower = cisupper = cisdigit = cisspace = cother = 0
     for c in text:
         if c.isalnum():
             cisalnum = cisalnum + 1
             if c.isalpha():
                 cisalpha = cisalpha + 1
                 if c.islower():
                     cislower = cislower + 1
                 elif c.isupper():
                     cisupper = cisupper + 1
             elif c.isdigit():
                 cisdigit = cisdigit + 1
         if c.isspace():
             cisspace = cisspace + 1
         else:
             cother = cother + 1
     return [cisalnum, cisalpha, cislower, cisupper, cisdigit, cisspace, cother]
             
def blanklines(lines):
    count = 0
    for line in lines:
        if len(line.strip()) == 0:
            count = count + 1
    return count

try:
     results,dummyresults,settings = splunk.Intersplunk.getOrganizedResults()
     PREFIX = "rawstat_"
     for r in results:
         if "_raw" in r:
             raw = r["_raw"]
             r['stat_len'] = len(raw)
             lines = raw.split('\n')

             TYPE = "width_"
             median, avgval, stddev, minval, maxval = widthStats(lines)
             r[PREFIX + TYPE + 'median'] = median
             r[PREFIX + TYPE + 'avg'] = avgval
             r[PREFIX + TYPE + 'stddev'] = stddev
             r[PREFIX + TYPE + 'min'] = minval
             r[PREFIX + TYPE + 'maxval'] = maxval
             
             TYPE = "leftmargin_"
             median, avgval, stddev, minval, maxval = marginStats(lines)
             r[PREFIX + TYPE + 'median'] = median
             r[PREFIX + TYPE + 'avg'] = avgval
             r[PREFIX + TYPE + 'stddev'] = stddev
             r[PREFIX + TYPE + 'min'] = minval
             r[PREFIX + TYPE + 'maxval'] = maxval

             r[PREFIX + 'blanklines'] = blanklines(lines)

             # trucate at 50 chars
             r[PREFIX + 'firstchars'] = firstChars(lines)[0:50]
             r[PREFIX + 'firstpuncts'] = firstPuncts(lines)[0:50]
             
             cisalnum, cisalpha, cislower, cisupper, cisdigit, cisspace, cother = classCounts(raw)
             r[PREFIX + 'isalnum'] = cisalnum
             r[PREFIX + 'isalpha'] = cisalpha
             r[PREFIX + 'islower'] = cislower
             r[PREFIX + 'isupper'] = cisupper
             r[PREFIX + 'isdigit'] = cisdigit
             r[PREFIX + 'isspace'] = cisspace
             r[PREFIX + 'otherchar'] = cother

             # most common char = "=,[],&"

              
except:
    import traceback
    stack =  traceback.format_exc()
    results = splunk.Intersplunk.generateErrorResults("Error : Traceback: " + str(stack))

splunk.Intersplunk.outputResults( results )
