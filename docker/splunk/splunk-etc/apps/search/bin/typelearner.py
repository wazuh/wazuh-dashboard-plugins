#!/usr/bin/env python
# This work contains trade
#secrets and confidential material of Splunk Inc., and its use or disclosure in
#whole or in part without the express written permission of Splunk Inc. is prohibited.

import os,re,sys,time,operator
import splunk.Intersplunk as si
import splunk.searchhelp.utils as sutils
from builtins import range


RAW_FIELD = "_raw"
EVENTTYPE_FIELD = "eventtype"
MISC_BUCKET = "misc"
BAD_ATTRS = set(['date_wday', 'date_hour', 'date_minute', 'date_second', 'date_mday', 'date_month', 'date_year', 'date_zone', 'referer', 'bytes', 'referer_domain', 'source', 'punct', 'timeendpos', 'timestartpos', 'splunk_server'])

MAX_EXAMPLE_LEN = 1000

MAXRESULTS = 5000           # ONLY LOOK AT 5000 RESULTS AT MOST

MIN_DISTINCTION_PERC = 0.1  # ignore subbuckets that apply to less than 10%
MAX_DISTINCTION_PERC = 0.9  # ignore subbuckets that apply to more than 90%
MIN_DISTINCT_SIZE = 3       # ignore subbuckets that are smaller than 3

# distinct enough if the total is really small and we made some distinction, or if we're between the min-max in distinction
def distinctEnough(count, maxcount):
  return (maxcount < MIN_DISTINCT_SIZE and 0<count<maxcount) or MIN_DISTINCTION_PERC*maxcount < count < MAX_DISTINCTION_PERC*maxcount

# pivot should support numerics, and multiple pivots.
# e.g.  attr='delay', type='continuous', buckets =[(0,5), (6,10), (11,)]
# e.g.  attr='color', type='discrete', buckets = ['blue', 'red', 'white']

DISCRETE_TYPE = "normal"
CONTINUOUS_TYPE = "continuous"
RAW_SUBSTRING_TYPE = "raw_substring"


class Pivot:
  def __init__(self, field, pivotType):
    self.field = field
    self.ptype = pivotType
    self.values = set()
  def __str__(self):
    return "field: %s type: %s values: %s" % (self.field, self.ptype, str(self.values)[:50])
  def addValue(self, val):
    self.values.add(val)
  def getValues(self):
    return self.values
  def getField(self):
    return self.field
  def getType(self):
    return self.ptype

  def getKVStr(self, val):
    if val != '' and (val[0] in '*"' or val.startswith("NOT")):
      return val
    if self.ptype == CONTINUOUS_TYPE:
      return '%s>%s AND %s<%s' % (self.field, val[0], self.field, val[1])
    elif self.ptype == RAW_SUBSTRING_TYPE:
      if needsQuotes(val):
        return '"%s"' % val
      else:
        return val
    else:
      if len(val) == 0:
        return 'NOT %s=*' % self.field
      return '%s="%s"' % (self.field, val)  # "%s"
    
  def getMatch(self, result):
    if self.field not in result:
      return MISC_BUCKET
    myval = result[self.field]
    # check for min-max range matching
    if self.ptype == CONTINUOUS_TYPE:
      for val in self.values:
        minval, maxval = val
        if minval < myval < maxval:
          return val
    elif self.ptype == RAW_SUBSTRING_TYPE:
      myval = myval.lower()
      for val in self.values:
        if val in myval:
          return val
      return ' '.join(['NOT ' + self.getKVStr(v) for v in self.values])
    else:
      # check for exact value matching
      for val in self.values:
        if myval == val:
          return val
    return MISC_BUCKET


def incCount(counts, key):
  if key not in  counts:
    counts[key] = 1
  else:
    counts[key] += 1

def getExampleText(result):
  example = result.get(RAW_FIELD,'')
  if len(example)>MAX_EXAMPLE_LEN:
    example = example[:MAX_EXAMPLE_LEN] + "..."
  return example 

class Bucket:

    def __init__(self, results):
        self.results = []
        self.pivot = None
        self.subBuckets = {}
        self.count = 0
        self.eventtypes = {}
        self.hasEventtypeCount = 0        
        self.example = None        
        if results != None and len(results)>0:
          for result in results:
            self.addResult(result)
          #self.count = len(results)
          #self.example = getExampleText(results[0])

    def __str__(self):
      return self.toString(0)
    
    def toString(self, depth):
      out = ""
      #if depth > 3: return ""
      out +=  "%spivot: [%s]\n" % (tab(depth), self.pivot)
      if self.results == None:
        pass #out += tab(depth) + "No results\n"
      else:
        out += "%s%s results" % (tab(depth), len(self.results))
        #for r in self.results:
        #  out += tab(depth) + "\t%s\n" % r

      for name, buck in self.subBuckets.items():
        out += "-"*80 + "\n"
        out += "%sname: %s\n%s\n" % (tab(depth+1), name[:50], buck.toString(depth+1))
      return out

        
    # doesn't support raw phrases yet
    def getPivot(self):
      counts = {}
      uniqueValCounts = {}
      # for each result
      for result in self.results:
        # for each attr-val
        for attr,val in result.items():
          if attr[0] == '_' or attr in BAD_ATTRS:
            continue
          
          # inc count of attr-val, attr-*
          incCount(counts, (attr,val))
          incCount(counts, (attr,'*'))
          # keep track of unique values for attr
          if attr not in uniqueValCounts:
            uniqueValCounts[attr] = set()
          uniqueValCounts[attr].add(val)
      
      # best pivot splits results in 2
      idealCount = len(self.results) / 2
      bestCount = 999999999
      bestPair = None
      for pair, count in counts.items():
        if abs(count - idealCount) < abs(bestCount - idealCount):
          bestCount = count
          bestPair = pair

          
      #print("BEST PAIR: %s COUNT: %s IDEAL: %s" % (bestPair, bestCount, idealCount))
      bestField, bestValue = bestPair
      resultCount = len(self.results)
      fieldValues = uniqueValCounts[bestField]
      #print("DISTINCT %s (%s=%s) BEST %s IDEAL %s RESULTS %s FIELDVALSLEN %s" % (distinctEnough(bestCount, resultCount), bestField, bestValue, bestCount, idealCount, resultCount, len(fieldValues)))
      # if every result has a unique value, or all results have the same count, we've failed to make a pivot
      if not distinctEnough(bestCount, resultCount) : #not len(fieldValues) == resultCount or not distinctEnough:
        #print("FAILED TO MAKE PIVOT. BestCount: %s ResultCount: %s UniqueValueCount: %s Field: %s Values: %s" % (bestCount, resultCount, len(fieldValues), bestField, list(fieldValues)[:5]))
        return None
      pivot = Pivot(bestField, DISCRETE_TYPE) # not continuous YET!!
      #??!! go over counts to get best attr to split into more than two groups
      #print("FIELDVALUES:%s" % fieldValues)
      for val in fieldValues:
        pivot.addValue(val) 
      return pivot
      
        
    def getRawPivot(self):
      counts = {}
      # for each result
      for result in self.results:
        if '_phrases' in result:
            phrases = result['_phrases']
        else:
            raw = result.get(RAW_FIELD, "")
            phrases = set(getPhrases(raw))
            result['_phrases'] = phrases
        #print(phrases)
        for phrase in phrases:
          incCount(counts, phrase)
      #print(counts)
      # best pivot splits results in 2
      idealCount = len(self.results) / 2
      bestCount = 999999999
      bestPhrase = None
      for phrase, count in counts.items():
        if abs(count - idealCount) < abs(bestCount - idealCount):
          bestCount = count
          bestPhrase = phrase
      #print("BEST PHRASE: %s COUNT: %s IDEAL: %s SELF: %s" % (bestPhrase, bestCount, idealCount, self))

      resultCount = len(self.results)

      
      #if bestCount == resultCount: # if all results have the phrase, we've failed to find a pivot 
      if not distinctEnough(bestCount, resultCount): 
        #print("FAILED TO MAKE RAW PIVOT. BestCount: %s ResultCount: %s " % (bestCount, resultCount))
        return None

      pivot = Pivot(RAW_FIELD, RAW_SUBSTRING_TYPE) # not continuous YET!!
      pivot.addValue(bestPhrase)
      return pivot


      

    def addResult(self, result):
      #print("ADD RESULTS: %s " % result)
      self.results.append(result)
      self.count += 1
      if 'eventtype' in result:
        self.hasEventtypeCount += 1
        eventtypes = result['eventtype']        
        if isinstance(eventtypes, list):
          for mytype in eventtypes:
            incCount(self.eventtypes, mytype)
        else:
            incCount(self.eventtypes, eventtypes)
            
      if self.example == None or self.example == '':
        self.example = getExampleText(result)
        #print("ADDED: %s %s" % (self.example, self.toString(0)))



      
    # support pivot of attr
    def splitOnPivot(self, useraw = False):
        #print("SPLITONPIVOTRESULTS: %u" % len(self.results))
        if len(self.results) <= 1:
          return
        self.pivot = self.getPivot()
        if self.pivot == None and useraw:
            self.pivot = self.getRawPivot()
        if self.pivot == None:
          return
        # for each result
        for result in self.results:
          # get matching pivot bucket
          match = self.pivot.getMatch(result)
          if match not in self.subBuckets:
            self.subBuckets[match] = Bucket([])
          #print("PUT INTO %s : %s" % (match, result))
          # put result into child bucket
          self.subBuckets[match].addResult(result)
        # free up ungrouped copy of results
        self.results = None
        if len(self.subBuckets) < 2:
          return
        # recursively split on children
        for bucket in self.subBuckets.values():
          #print("SUBBUCKET RESULT COUNT %s" % len(bucket.results))
          bucket.splitOnPivot(useraw)

    def getEventTypes(self, root, types, keywords, parentStr = "", value = "", depth = 0):
      if self.pivot != None:
        # get eventtypes from all children, in order from most populous to least
        countBuckets = [(value,subBucket, subBucket.count) for value,subBucket in self.subBuckets.items()]        
        countBuckets.sort(key=operator.itemgetter(2), reverse=True)
        for value, subBucket, count in countBuckets:
        #for value, subBucket in self.subBuckets.items():
          kvStr = self.pivot.getKVStr(value)
          myStr = '%s %s' % (parentStr, kvStr)
          search = (keywords + ' ' + myStr).strip()
          # not set all important values (taking precidence over kv of same name)
          eventtype = {
            'eventtype':'discovered_eventtype',
            '_search': search,
            '_raw':  '%s%s \t(count=%s)' % (' '*depth, search, subBucket.count),
            '_time': int(time.time()),
            '_count': subBucket.count,
            '_example': subBucket.example,
            '_coverage': "%.5s" % (100 * float(subBucket.count) / root.count),
            '_depth' : depth,
            '_cooccurring-eventtypes': subBucket.eventtypes.keys(), 
            '_percent-with-eventtypes': "%.5s" % (100.0 * float(subBucket.hasEventtypeCount) / subBucket.count),
            '_tags' : None,
            '_pos'  : len(types)
          }
          # get all kv values of search 
          kvs = KVS_REGEX.findall(myStr)
          # for each kv, add to eventtype.  useful for filtering
          for kv in kvs:
            k,v = kv
            if k[0] != '_' and k != 'eventtype':
              eventtype[k] = v

          types.append(eventtype)

          subBucket.getEventTypes(root, types, keywords, myStr, value, depth+1)


def tab(depth):
  return "\t"*depth

def needsQuotes(val):
  special = '"[]()| \t\n\r'
  for s in special:
    if s in val:
      return True
  return False


# TEMPORARY HACKERY.  SHOULD GET VALUES FROM EVENTDISCOVER.CONF

ignored_keywords = 'sun', 'mon', 'tue', 'tues', 'wed', 'thu', 'thurs', 'fri', 'sat', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', '2003', '2004', '2005', '2006', 'am', 'pm', 'ut', 'utc', 'gmt', 'cet', 'cest', 'cetdst', 'met', 'mest', 'metdst', 'mez', 'mesz', 'eet', 'eest', 'eetdst', 'wet', 'west', 'wetdst', 'msk', 'msd', 'ist', 'jst', 'kst', 'hkt', 'ast', 'adt', 'est', 'edt', 'cst', 'cdt', 'mst', 'mdt', 'pst', 'pdt', 'cast', 'cadt', 'east', 'eadt', 'wast', 'wadt', 'about', 'after', 'again', 'against', 'all', 'almost', 'already', 'also', 'although', 'always', 'among', 'an', 'and', 'any', 'anyone', 'are', 'as', 'at', 'away', 'be', 'became', 'because', 'become', 'becomes', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'could', 'does', 'during', 'each', 'either', 'else', 'ever', 'every', 'following', 'for', 'from', 'further', 'gave', 'gets', 'give', 'given', 'giving', 'gone', 'got', 'had', 'has', 'have', 'having', 'here', 'how', 'however', 'if', 'in', 'into', 'is', 'it', 'itself', 'just', 'keep', 'kept', 'like', 'made', 'make', 'many', 'might', 'more', 'most', 'much', 'must', 'neither', 'nor', 'noted', 'now', 'of', 'often', 'on', 'only', 'or', 'other', 'our', 'out', 'owing', 'perhaps', 'please', 'quite', 'rather', 'really', 'regarding', 'said', 'same', 'seem', 'seen', 'several', 'shall', 'should', 'show', 'showed', 'shown', 'shows', 'similar', 'since', 'so', 'some', 'sometime', 'somewhat', 'soon', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'therefore', 'these', 'they', 'this', 'those', 'though', 'through', 'throughout', 'to', 'too', 'toward', 'under', 'unless', 'until', 'upon', 'use', 'used', 'usefulness', 'using', 'various', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'whether', 'which', 'while', 'who', 'whose', 'why', 'will', 'with', 'within', 'without', 'would', 'yet', 'net', 'org', 'com', 'edu', 'co'

ONLY_PHRASES = False
NO_NUMBER_PHRASES = True
OK_CONNECTORS = "._-,:\\/"
TERM_REGEX = re.compile('([^\s~!@#$%^&*()+{}|[\]\:"<>?;,./_-]+)') 
KVS_REGEX  = re.compile('(\S+)="(.*?)"\s*')

def addPhrase(phrases, phrase):
  phrase = phrase.strip()    
  if len(phrase) > 0:
    if phrase[-1] in OK_CONNECTORS:
      phrase = phrase[:-1]
      phrase = phrase.strip()
  if len(phrase) > 0:
    phrases.add(phrase.strip())
  return ""

def getPhrases(text):

  text = text.lower()
  tokens = set(TERM_REGEX.findall(text))
  tokensAndGarbage = TERM_REGEX.split(text)
  #print("T: %s" % tokens)
  #print("TG %s:" % tokensAndGarbage)
  phrase = ""
  phrases = set()
  if not ONLY_PHRASES:
    phrases.update(tokens)
  for tok in tokensAndGarbage:
    if tok == '' or tok.isspace() or ((len(phrase)>0) and tok in OK_CONNECTORS):
      phrase += tok
    elif tok in ignored_keywords:
      #print("1ADDING PHRASE: %s BECAUSE OF %s" %(phrase, tok))
      phrase = addPhrase(phrases, phrase)      
    elif tok in tokens:
      phrase += tok
    else:
      #print("2ADDING PHRASE: %s BECAUSE OF %s" %(phrase, tok))
      phrase = addPhrase(phrases, phrase)
  addPhrase(phrases, phrase)
  #print("T: %s" % text)
  #print("P: %s" % phrases)
  if NO_NUMBER_PHRASES:
    phrases = [phrase for phrase in phrases if not numericPhrase(phrase)]
  return phrases

NUMERIC_CHARS = set('01234567890 \t.:,')
def numericPhrase(phrase):
  if phrase[0].isdigit():
    return True
  for ch in phrase:
    if ch not in NUMERIC_CHARS:
      return False
  return True

def redundant(search):
  """returns true if search consists of just an eventtype (e.g. 'eventtype=foo' or 'eventtype="foo bar")"""
  return re.match('^eventtype=(?:"[^"]*")|(?:[^"][^ ]*)$', search) != None


def discover(results, keywords, maxtypes, ignore_covered, useraw):
    root = Bucket(results)  
    root.splitOnPivot(useraw)
    
    eventtypes = []
    root.getEventTypes(root, eventtypes, keywords)

    if ignore_covered:
        filteredEventTypes = []
        for e in eventtypes:
            if e['_cooccurring-eventtypes'] == "" or redundant(e['_search']):
              filteredEventTypes.append(e)
        eventtypes = filteredEventTypes

    # get N largest clusters
    eventtypes.sort(key=operator.methodcaller('get', '_count'), reverse=True)
    eventtypes = eventtypes[:maxtypes]
    # resort by position for understandable tree view
    eventtypes.sort(key=operator.methodcaller('get', '_pos'))
    
    #print(root)
    #print("EVENTTYPES: %s" % eventtypes)
    
    return eventtypes


def profileMain():
  import profile
  pr = profile.Profile()
  total = 0
  for i in range(5):
    total += pr.calibrate(10000)
  avg = total / 5
  profile.Profile.bias = avg
  profile.run('main()', 'profresults.txt')
  import pstats
  p = pstats.Stats('profresults.txt')
  p.strip_dirs().sort_stats(-1).print_stats()
  print("CUMULATIVE")
  p.sort_stats('cumulative').print_stats(30)
  print("TIME")
  p.sort_stats('time').print_stats(30)


def main():
  try:    
    messages = {}

    keywords,options = si.getKeywordsAndOptions()
    DEFAULT_MAX_TYPES = 10
    maxtypes = options.get('max', str(DEFAULT_MAX_TYPES))

    error = None
    if not maxtypes.isdigit():
        error = 'max must be an integer between 1-%s.' % MAXRESULTS
    else:
        maxtypes = int(maxtypes)
        if not (0 < maxtypes <= MAXRESULTS):
            error = 'max must be an integer between 1-%s.' % MAXRESULTS
    if error:
      si.generateErrorResults(error)
      return

    ignore_covered = 'notcovered' in keywords
    useraw         = 'useraw' in keywords
      
    results,dummyresults,settings = si.getOrganizedResults()
    #for r in results:
    #  for attr in r:
    #     print("%s %s %u" % (attr, r[attr], len(r[attr])))
    if len(results) > MAXRESULTS:
      results = results[:MAXRESULTS]
      si.addWarnMessage(messages, "For performance reasons, the maximum number of results used to discover event types was capped at %s. Consider a more restrictive search." % MAXRESULTS)

    argc = len(sys.argv)
    argv = sys.argv

    sessionKey  = settings.get("sessionKey", None)
    owner       = settings.get("owner", None)
    namespace   = settings.get("namespace", None)

    searchhead = ''
    try:
      searches = sutils.getCommands(settings.get("search", ''), None)
      firstcmd = searches[0][0][0]
      firstarg = searches[0][0][1].strip()
      if firstcmd == 'search' and firstarg != '*':
        searchhead = firstarg
    except Exception as e:
      pass
    
    results = discover(results, searchhead, maxtypes, ignore_covered, useraw)

    if len(results) == 0:
      si.addWarnMessage(messages, "Unable to isolate useful groups of events.")


  except:
    import traceback
    stack =  traceback.format_exc()
    results = si.generateErrorResults("Error : Traceback: " + str(stack))

  si.outputResults( results, messages )


if __name__ == '__main__':
  #profileMain()
  main()
