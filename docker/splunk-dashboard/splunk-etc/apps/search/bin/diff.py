#   Version 4.0
import sys,splunk.Intersplunk
import difflib,time
import splunk.mining.dcutils as dcu

logger = dcu.getLogger()

##  COMPARE TWO RESULTS
##  ARGS [pos1 pos2] [attribute to compare]
##
##  DEFAULTS = 1 2 _raw
##

help = """------------------------------------------------------------------------------------
diff x y compares x to y
  - indicates a line present in x but missing in y
  + indicates a line present in y but missing in x
  ! indicates a line that exists in both x and y, but contains different information 
------------------------------------------------------------------------------------"""

contexthelp = """------------------------------------------------------------------------------------
diff x y compares x to y
  *** a,b **** precedes results from x, lines a through b
  --- a,c ---- precedes results from y, lines a through c
  - indicates a line present in x but missing in y
  + indicates a line present in y but missing in x
  ! indicates a line that exists in both x and y, but contains different information 
------------------------------------------------------------------------------------"""




def diff(results, pos1, pos2, attr, showHeader, context, maxlen, diffheader):
    resultcount = len(results)

    if (pos1 > resultcount):
        return splunk.Intersplunk.generateErrorResults("pos1=%d is out of bounds" % pos1)
    if (pos2 > resultcount):
        return splunk.Intersplunk.generateErrorResults("pos2=%d is out of bounds" % pos2)
    
    val1 = results[pos1-1].get(attr, "")
    val2 = results[pos2-1].get(attr, "")
    source1 = results[pos1-1].get("source", "")
    source2 = results[pos2-1].get("source", "")
    outresults = []
    cutoff = False
    if val1.strip() == val2.strip():
        diff = "\n** Results are the Same **\n"
    else:
      if maxlen and (len(val1) > maxlen or len(val2) > maxlen):
          # cut text off at maxlen if nonzero
          val1 = val1[:maxlen]
          val2 = val2[:maxlen]
      
      if html:
          htmldiffer = difflib.HtmlDiff()
          diff = htmldiffer.make_file(val1.splitlines(), val2.splitlines())
          
      elif context or unified:
          if context:
            differ = difflib.context_diff
            headersize = 3
          else:
            differ = difflib.unified_diff
            headersize = 2
          difflist = list(differ(val1.splitlines(), val2.splitlines(), source1, source2, lineterm=""))
          if not diffheader:
              # trim off +++/--- and such for when the events have no meaningful name
              difflist = difflist[headersize:]
          diff = "\n".join(difflist)
          if showHeader:
              diff = contexthelp + "\n\n" + diff
      else:
          d = difflib.Differ()
          difflist = list(d.compare(val1.splitlines(), val2.splitlines()))
          diff = "\n".join(difflist)
          if showHeader:
              diff = help + "\n\n" + diff
      
    result = {}
    # fill in attributes with default values from top result
    for key, otherval in results[pos1-1].items():
        result[key] = otherval

    # set diff
    result["_raw"] = diff
    result["_decoration"] = "diff"
    result["linecount"] = len(diff.splitlines())
   
    outresults.append(result)
    return outresults


results = []
(isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)
    
try:
    html = False
    unified = True 
    header = False
    context = False
    attribute = "_raw"
    index1 = 1
    index2 = 2
    maxlen = 100000
    diffheader = False


    # poor mans opt
    for a in sys.argv[1:]:

        # This (old) feature just put a 'help' header for people who don't know
        # how to read diff
        # Commenting out for now since the header has been put into the decorations stuff.
        if a.startswith("header="):
            where = a.find('=')
            value = a[where+1:len(a)]
            if value.startswith('t') or value.startswith("T"):
                header = True

        elif a.startswith("context="):
            where = a.find('=')
            value = a[where+1:len(a)]
            if value.startswith('t') or value.startswith("T"):
                context = True
        
        elif a.startswith("html="):
            where = a.find('=')
            value = a[where+1:len(a)]
            if value.startswith('t') or value.startswith("T"):
                html = True

        elif a.startswith("unified="):
            where = a.find('=')
            value = a[where+1:len(a)]
            if value.startswith('t') or value.startswith("T"):
                unified = True

        elif a.startswith("tofile="):
            splunk.Intersplunk.parseError("The 'tofile' argument is no longer supported.")
            # sure would be nice to emit an info message, but our own interfaces
            # are unworkably undocumented. oh well.

        elif a.startswith("attribute="):
            where = a.find('=')
            attribute = a[where+1:len(a)]

        elif a.startswith("maxlen="):
            param, value = a.split('=', 1)
            try:
                maxlen = int(value)
            except:
                if isgetinfo:
                    splunk.Intersplunk.parseError("Invalid value (%s) for %s. Must be integer quantity of bytes" % (value, param))

        elif a.startswith("diffheader="):
            param, value = a.split('=', 1)
            if value.lower().startswith('t'):
                diffheader = True
            else:
                diffheader = False

        elif a.startswith("position1=") or a.startswith("pos1="):
            where = a.find('=')
            try:
                index1 = int(a[where+1:len(a)])
                if (index1 < 1):
                    raise ValueError
            except:
                if isgetinfo:
                    splunk.Intersplunk.parseError("Invalid value (%s) for %s" % (a[where+1:len(a)],a[:where]))

        elif a.startswith("position2=") or a.startswith("pos2="):
            where = a.find('=')
            try:
                index2 = int(a[where+1:len(a)])
                if (index2 < 1):
                    raise ValueError
            except:
                if isgetinfo:
                    splunk.Intersplunk.parseError("Invalid value (%s) for %s" % (a[where+1:len(a)],a[:where]))

        elif isgetinfo:
            splunk.Intersplunk.parseError("Invalid argument '%s'" % a)

    if isgetinfo:
        splunk.Intersplunk.outputInfo(False, False, True, False, None, False)

    results = splunk.Intersplunk.readResults(None, None, False)
       
    results = diff(results, index1,index2, attribute, header, context, maxlen, diffheader)

except Exception as e:
    import traceback
    stack =  traceback.format_exc()
    if isgetinfo:
        splunk.Intersplunk.parseError(str(e))
        
    results = splunk.Intersplunk.generateErrorResults(str(e))
    logger.warn("invalid arguments passed to 'diff' search operator. Traceback: %s" % stack)

splunk.Intersplunk.outputResults(results)
