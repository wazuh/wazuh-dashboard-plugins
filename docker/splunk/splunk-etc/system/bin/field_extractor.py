import json
import copy
import splunk.rest
import splunk.field_extractor.mgr as mgr
from splunk.field_extractor.RegexBuilder import  FXData, TableUINewRule, TableUIExistingRule, TableUIEvents
from copy import deepcopy

def check(args, kwargs, required=True):
    for rarg, (rtype, rvals) in args.items():
        if rarg not in kwargs:
            if required:
                raise Exception("Missing required argument: %s" % rarg)
            else: continue
        val = kwargs[rarg]
        if rtype == 'choice' and val not in rvals:
            raise Exception("Value for %s must be one of the following: %s" % (rarg, rvals))
        elif rtype == 'int':
            try:
                rmin, rmax = rvals
                val = int(val)
                if val < rmin or val > rmax: raise Exception
                kwargs[rarg] = val
            except:
                raise Exception("Value for %s must be an integer between %d and %d" %(rarg,rmin,rmax))
        elif rtype == "json":
            try:
                kwargs[rarg] = json.loads(kwargs[rarg])
            except Exception as e:
                raise e
                raise Exception("bad json for %s: %s" % (rarg, kwargs[rarg]))
        else: pass
    return kwargs


def checkArgs(required_args, optional_args, kwargs):
    check(required_args, kwargs)
    check(optional_args, kwargs, False)
    for k in kwargs:
        if k not in required_args and k not in optional_args:
            raise Exception("Unknown argument %s" % k)
    return kwargs

def mungeExamples(examples, fieldName):
    munged = copy.deepcopy(examples)
    for example in munged:
        if '_rawtext' in example:
            fulltext = example['_rawtext']
            del example['_rawtext']
            eventDict = dict()
            eventDict[fieldName] = fulltext
            example['_event'] = eventDict
       
    return munged


TableUIHandlers = {
            'rules_new': TableUINewRule(),
            'rules_existing': TableUIExistingRule(),
            'events': TableUIEvents(),
        }

class RegexGenHandler(splunk.rest.BaseRestHandler):
    def handle_GET(self):
        required_args = {
            "field": ('string', None),
            "examples": ('json', None),
            "sid": ('string', None)
        }
        optional_args = {
            "filter": ('string', None),
            "counter_examples": ('json', None),
            "count": ('int', (1,500)),
            "offset": ('int', (0,1000))
        }
        kwargs = checkArgs(required_args, optional_args, self.args)

        ex = mungeExamples(kwargs['examples'], kwargs['field'])
        rules = mgr.gtfo(
            self.sessionKey, 
            kwargs['field'], 
            mungeExamples(kwargs['examples'], kwargs['field']), 
            mungeExamples(kwargs.get('counter_examples', []), kwargs['field']), 
            kwargs.get('filter', ''), 
            kwargs['sid'], 
            kwargs.get('offset', 0), 
            kwargs.get('count', 100)
        )

        self.response.setHeader('content-type', 'application/json')
        response = { 'rules': rules }
        response.update(kwargs)
        self.response.write(json.dumps(response))

    def handle_POST(self):
        fxd = FXData(require={'sid': ('string', None), 
                                'type': ('choice', ('rules_new', 'rules_existing', 'events'))})
        fxd.check(self.args, ignoreOthers=True)
        results = TableUIHandlers[self.args['type']].setSessionKey(self.sessionKey).results(self.args)
        self.response.setHeader('content-type', 'application/json')
        self.response.write(json.dumps(results, indent=2, ensure_ascii=False))

import splunk.search

class TestFilterHandler(splunk.rest.BaseRestHandler):

    ''' 
    Expectation is that by specifying a filter it will be added to the rule.
    Current actual behavior is an exception: "too many values to unpack"
    '''

    def handle_GET(self):
        try:
            query = '| search sourcetype=access_combined | head 100' 
            job = splunk.search.dispatch(
                query, 
                sessionKey=self.sessionKey, 
                status_buckets=1, 
                required_field_list='*'
            )
            splunk.search.waitForJob(job)
    
            examples = [
                {
                    "_rawtext": "10.1.1.43 - webdev [07/Aug/2005:23:58:08 -0700] \"GET / HTTP/1.0\" 200 1163 \"-\" \"check_http/1.10 (nagios-plugins 1.4)\"",
                    "clientip": [0,9]
                }
            ]
    
            rules = mgr.gtfo(
                self.sessionKey, 
                '_raw', 
                mungeExamples(examples, '_raw'), 
                [], 
                'webdev', 
                job.id, 
                0, 
                100
            )
    
            self.response.setHeader('content-type', 'application/json')
            response = { 'rules': rules }
            # response.update(kwargs)
            self.response.write(json.dumps(response))
        except Exception:
            import traceback
            raise Exception("%s Traceback: %s\n" % (e, traceback.format_exc()))

class TestCounterExampleHandler(splunk.rest.BaseRestHandler):

    ''' 
    Expectation is that by specifying a counter-example it will be adjusted for in the rules.
    Current actual behavior is an empty list of rules is returned. 
    '''

    def handle_GET(self):
        try:
            query = '| search sourcetype=access_combined | head 100' 
            job = splunk.search.dispatch(
                query, 
                sessionKey=self.sessionKey, 
                status_buckets=1, 
                required_field_list='*'
            )
            splunk.search.waitForJob(job)
    
            examples = [
                {
                    "_rawtext": "10.1.1.43 - webdev [07/Aug/2005:23:58:08 -0700] \"GET / HTTP/1.0\" 200 1163 \"-\" \"check_http/1.10 (nagios-plugins 1.4)\"",
                    "clientip": [0,9]
                }
            ]
    
            counterExamples = [
                {
                    "_rawtext": "This event has no IP address",
                    "clientip": [0,4]
                }
            ]
    
            rules = mgr.gtfo(
                self.sessionKey, 
                '_raw', 
                mungeExamples(examples, '_raw'), 
                mungeExamples(counterExamples, '_raw'), 
                '', 
                job.id, 
                0, 
                100
            )
    
            self.response.setHeader('content-type', 'application/json')
            response = { 'rules': rules }
            # response.update(kwargs)
            self.response.write(json.dumps(response))
        except Exception as e:
            import traceback
            raise Exception("%s Traceback: %s\n" % (e, traceback.format_exc()))

class TestMFMEHandler(splunk.rest.BaseRestHandler):

    ''' 
    Expectation is that by specifying two different examples with two different fields to extract,
    that one or more rules will be returned that handle both extractions.
    Current actual behavior is an empty list of rules is returned 
    '''

    def handle_GET(self):
        try:
            query = '| search sourcetype=access_combined | head 100' 
            job = splunk.search.dispatch(
                query, 
                sessionKey=self.sessionKey, 
                status_buckets=1, 
                required_field_list='*'
            )
            splunk.search.waitForJob(job)
    
            examples = [
                {
                    "_rawtext": "10.1.1.43 - webdev [07/Aug/2005:23:58:08 -0700] \"GET / HTTP/1.0\" 200 1163 \"-\" \"check_http/1.10 (nagios-plugins 1.4)\"",
                    "clientip": [
                        0,
                        9
                    ]
                },
                {
                    "_rawtext": "10.1.1.0 - webdev [07/Aug/2005:23:58:08 -0700] \"GET / HTTP/1.0\" 200 1163 \"-\" \"check_http/1.10 (nagios-plugins 1.4)\"",
                    "method": [
                        48,
                        51
                    ]
                }
            ]
            rules = mgr.gtfo(
                self.sessionKey, 
                '_raw', 
                mungeExamples(examples, '_raw'), 
                [], 
                '', 
                job.id, 
                0, 
                100
            )
    
            self.response.setHeader('content-type', 'application/json')
            response = { 'rules': rules }
            # response.update(kwargs)
            self.response.write(json.dumps(response))
        except Exception as e:
            import traceback
            raise Exception("%s Traceback: %s\n" % (e, traceback.format_exc()))



