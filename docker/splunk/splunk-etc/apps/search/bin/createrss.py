#   Version 4.0
import os, sys, time, random
import splunk.Intersplunk, splunk.mining.dcutils as dcu
from splunk.util import format_local_tzoffset
from xml.sax import saxutils
from stat import *

# Create an rss file with the appropriate path
logger = dcu.getLogger()
graceful = 0


def writeRSSItem(path, rss_header, item, rss_footer):
        # nothing todo
        if len(item) == 0 and os.path.exists(path):
           return

        wrote_item = False
        # needed to ensure no two SH are writing into the same temp file
        tmp_path   = path + ".tmp." + str(random.randint(0, 100000))   

        # if file exists, start looking for existing items
        if os.path.exists(path) and os.stat(path)[ST_SIZE] > 0:
            rssfile    = open(path, "r")
            tmprssfile = open(tmp_path, "w+")
            foundFirstItem = 0
            itemCount      = 1
            skipItem       = 0

            for line in rssfile.readlines():
                lineTmp = line.strip()
                if lineTmp == '<item>':
                        # print("itemcount: %d, thresh: %d" % (itemCount, thresh))
                        if itemCount < thresh:
                                itemCount =     itemCount+1
                                if foundFirstItem == 0:
                                        # found the first item, add the new one first
                                        tmprssfile.write(item)
                                        tmprssfile.write(line)
                                        foundFirstItem = 1
                                else:
                                        tmprssfile.write(line)
                        else:
                                skipItem = 1
                elif lineTmp == '</item>':
                        if skipItem == 0:
                                tmprssfile.write(line)
                        else:
                                skipItem = 0
                else:
                        if skipItem == 0:
                                tmprssfile.write(line)
            rssfile.close()
            tmprssfile.close()
            wrote_item = foundFirstItem == 1
 
        if not wrote_item:
            # make parent dirs if they don't exist
            try:
                os.makedirs(os.path.dirname(path))
            except OSError as e:
                pass
            tmprssfile = open(tmp_path, "w")
            tmprssfile.write(rss_header)
            tmprssfile.write(item)
            tmprssfile.write(rss_footer)
            tmprssfile.close()


        logger.info("Atomically updating RSS feed: " + str(path))
        try:
            os.rename(tmp_path, path)
        except OSError as e:
             try:    # remove path and retry 
                   os.unlink(path)
                   os.rename(tmp_path, path)
             except OSError as e:
                   logger.error("Could not rename %s to %s. Error message: %s" % (str(tmp_path), str(path), str(e)))
                   splunk.Intersplunk.generateErrorResults("Could not rename %s to %s. Error message: %s" % (str(tmp_path), str(path), str(e)))
            
def trimQuotes(str):
   if len(str) == 0:
      return str
   if str.startswith("'") and str.endswith("'"):
      str = str[1:-1]
   if str.startswith('"') and str.endswith('"'):       
      str = str[1:-1]
   return str        


results,dummyresults,settings = splunk.Intersplunk.getOrganizedResults()
keywords, args = splunk.Intersplunk.getKeywordsAndOptions() # args = dcu.getArgValues()

if(len(sys.argv) < 5):
    results = dcu.getErrorResults(results, graceful, 'Usage: createrss <path = rss path> <name = name/title of the rss item> <link = rss item link> <descr = rss item description> <count = maximum number of items> [graceful = (1|0)]')
    splunk.Intersplunk.outputResults( results )
    sys.exit()
  
path   = trimQuotes(args["path"] )  if "path"  in args  else ""
name   = trimQuotes(args["name"] )  if "name"  in args  else ""
link   = trimQuotes(args["link"] )  if "link"  in args  else ""
desc   = trimQuotes(args["descr"])  if "descr" in args  else ""
thresh = int(args["count"]) if "count" in args  else 100

graceful  = 0
if("graceful" in args):
    graceful = int(args["graceful"])

# ensure nothing dangerous
if ".." in path or "/" in path or "\\" in path:
    results = dcu.getErrorResults(results, graceful, 'createrss Path location cannot contain "..", "/", or "\\".  Path was "' + str(path) + '".')
    splunk.Intersplunk.outputResults( results )
    sys.exit()

sharedStorage = settings.get('sharedStorage', splunk.Intersplunk.splunkHome())
baseStorage = os.path.join(sharedStorage, 'var', 'run', 'splunk')
path = os.path.join(baseStorage, 'rss', path)

rss_header = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>Alert: %s</title>
        <link>%s</link>
        <description>Saved Searches Feed for saved search %s</description>
""" % (        saxutils.escape(name),        # <title>
                saxutils.escape(link),        # <link>
                saxutils.escape(name))        # <description>

rss_footer ="""    </channel>
</rss>
""" 

correct_tz_time = time.strftime("%a, %d %b %Y %H:%M:%S ") + format_local_tzoffset()
item = """        <item>
            <title>%s</title>
            <link>%s</link>
            <description>%s</description>
            <pubDate>%s</pubDate>
        </item>
""" % (        saxutils.escape(name),        # <item><title>
                saxutils.escape(link),        # <item><link>
                saxutils.escape(desc),        # <item><desc>
                correct_tz_time) # <item><pubDate>

if len(link) == 0:
   item = ''

writeRSSItem(path, rss_header, item, rss_footer)

splunk.Intersplunk.outputResults( results ) 
