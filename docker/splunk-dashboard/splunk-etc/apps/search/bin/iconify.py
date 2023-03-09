import hashlib
import sys
import splunk.Intersplunk as si

if __name__ == '__main__':
    try:
        keywords,options = si.getKeywordsAndOptions()
        if len(keywords) == 0:
            si.generateErrorResults('Requires fields list.')
            exit(0)
        search = ' '.join(keywords)
        results,dummyresults,settings = si.getOrganizedResults()

        for result in results:
                eventSignature = '-=XXX=-'.join([result.get(field,'') for field in keywords])
                if sys.version_info >= (3, 0):
                    eventSignature = eventSignature.encode('utf-8')
                sigHash = hashlib.sha1(eventSignature).hexdigest()
                result['_icon'] = sigHash
        si.outputResults(results)
    except Exception as e:
        import traceback
        stack =  traceback.format_exc()
        si.generateErrorResults("Error '%s'. %s" % (e, stack))
