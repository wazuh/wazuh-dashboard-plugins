#   Version 4.0
import splunk.Intersplunk as si
import splunk.mining.FieldLearning as ifl
import re
import traceback

import splunk.mining.dcutils as dcu
logger = dcu.getLogger()

if __name__ == '__main__':
    try:
        keywords,options = si.getKeywordsAndOptions()
        examples    = options.get('examples', None)
        badexamples = options.get('counterexamples', None)
        fromfield   = options.get('fromfield', '_raw')
        maxtrainers = options.get('maxtrainers', '100')
        msg = None

        if examples != None and  examples.startswith('"') and examples.endswith('"'):
           examples = examples[1:-1]

        if badexamples != None and badexamples.startswith('"') and badexamples.endswith('"'):
           badexamples = badexamples[1:-1]

        logger.info("erex run with examples: %s" % examples)


        if len(keywords) == 0:
            msg = "A required fieldname is missing"
        elif examples == None:
            msg = "Value for 'examples' is required"
        else:
            try:
                maxtrainers = int(maxtrainers)
                if maxtrainers < 1 or maxtrainers > 1000:
                    raise Exception()
            except: msg = "Value for 'maxtrainers' must be an integer between 1-1000"
        if msg != None:
            si.generateErrorResults(msg)                
            exit(0)
        messages = {}
        
        results,dummyresults,settings = si.getOrganizedResults()
        values = []
        # for first N result used as training
        for result in results[:maxtrainers]:
            val = result.get(fromfield, None)
            if val != None:
                values.append(val)

        examples = [ex.strip() for ex in examples.split(",")]
        if badexamples == None:
            badexamples = []
        else:
            badexamples = [ex.strip() for ex in badexamples.split(",")]

        try:
            regexes, extractions = ifl.learn(values, examples, badexamples)
        except Exception as e:
            # log error
            stack =  traceback.format_exc()
            logger.error("Exception encountered: %s" % e)
            logger.info("Traceback: %s" % stack)
            # just tell user that we couldn't extract anything
            regexes = ""

        if len(regexes) == 0:
            si.generateErrorResults('Unable to learn any extractions.  Provide different examples, counterexamples, or searchresults') 
            exit(0)

        rex = regexes[0]

        rex = rex.replace("?P<FIELDNAME>", "?P<%s>" % keywords[0])
        si.addInfoMessage(messages, 'Successfully learned regex.  Consider using: | rex "%s"' % rex.replace('"', '\\"'))
        
        # for each result
        for result in results:
            val = result.get(fromfield, None)
            # match regex and put values in
            match = re.search(rex, val)
            if match:
                extractions = match.groupdict()
                for k,v in extractions.items():
                    result[k] = v
        
        si.outputResults(results, messages)
    except Exception as e:
        stack =  traceback.format_exc()
        si.generateErrorResults("Error '%s'" % e)
        logger.error("Exception encountered: %s" % e)
        logger.info("Traceback: %s" % stack)
