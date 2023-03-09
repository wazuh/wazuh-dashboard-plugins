import unittest
import sys
import os
import re
from math import sqrt
import csv
from time import mktime, localtime, strptime
from datetime import tzinfo, timedelta, datetime
import operator

import splunk.Intersplunk
import splunk.stats_util.statespace as statespace
from splunk.stats_util.dist import Erf
from builtins import range


erf = Erf()
root2 = sqrt(2)


class FC:
    def __init__(self, field=''):
        self.options = {'algorithm':'LLP5', 'holdback':0, 'correlate':None, 'upper':None, 'lower':None, 'suppress':None,
                'period':-1, 'as':'', 'future_timespan':'5', 'ci':'95', 'last':None, 'start':0, 'nonnegative':'f'}
        self.setField(field)
        self.vals = None 
        self.numvals = 0
        self.correlate = []
        self.conf = [erf.inverf(.95)*root2]*2
        self.upper_conf = 95.
        self.lower_conf = 95.
        self.missingValued = False
        self.databegun = False

    def __str__(self):
        ordered_fields = sorted(self.fields.items(), key=operator.itemgetter(1), reverse=True)
        ret = str(ordered_fields) + ", options: {"
        for key in sorted(self.options):
            ret += " %s: %s," %(key, self.options[key])
        ret += "}"
        return ret

    def setField(self, field):
        if field != '':
            self.fields = {field: 'prediction(' + field + ')'}
            self.fieldValMap = {field:0}
            self.options['as'] = self.fields[field]
            self.asNames = {field: field}
        else:
            self.fields = {}
            self.fieldValMap = {}
            self.asNames = {}
        self.iscount = {}

    def addField(self, field):
        self.setAsName(field, 'prediction(' + field + ')' )
        self.fieldValMap[field] = len(self.fields) - 1

    def setAsName(self, field, name):
        self.options['as'] = name
        self.asNames[field] = name
        self.fields[field] = name


    def addVal(self, field, val):
        idx = self.fieldValMap[field]
        self.vals[idx].append(val)

    def setUpperLowerNames(self):
        self.upperNames = {}
        self.lowerNames = {}
        self.UIupperNames = {}
        self.UIlowerNames = {}
        self.UIpredictNames = {}
        for field in self.fields:
            if self.options['upper'] != None:
                self.upperNames[field] = self.options['upper'] + '(' + self.fields[field] + ')'
            else:
                self.upperNames[field] = 'upper' + self.options['ci'] + '(' + self.fields[field] + ')'
            if self.options['lower'] != None:
                self.lowerNames[field] = self.options['lower'] + '(' + self.fields[field] + ')'
            else:
                self.lowerNames[field] = 'lower' + self.options['ci'] + '(' + self.fields[field] + ')'
            self.UIupperNames[field] = '_upper' + field
            self.UIlowerNames[field] = '_lower' + field
            self.UIpredictNames[field] = '_predicted' + field

    def setModel(self):
        if self.options['algorithm']  not in statespace.ALGORITHMS:
            splunk.Intersplunk.generateErrorResults("Unknown algorithm: %s" %self.options['algorithm'])
            sys.exit()
        data_end = self.numvals - self.holdback
        if data_end < statespace.LL.least_num_data():
            splunk.Intersplunk.generateErrorResults("Too few data points: %d. Need at least %d (too many holdbacks (%d) maybe?)" %(data_end, statespace.LL.least_num_data(), self.holdback))
            sys.exit()

        self.data_end = data_end
        self.data_start = 0
        algorithm = self.options['algorithm']
        vals = self.vals
        future_timespan = self.future_timespan

        try:
            if algorithm[:3] == 'LLP': 
                self.model = statespace.Univar(algorithm, vals, self.data_start, self.data_end, period=self.period, forecast_len=future_timespan, missingValued=self.missingValued)
            elif algorithm[:3] == 'LLB': # one of the LLB's
                if len(self.correlate) == 0:
                    splunk.Intersplunk.parseError("No correlate values")
                    sys.exit()
                if data_end < statespace.LLB.least_num_data():
                    splunk.Intersplunk.generateErrorResults("Too few data points: %d. Need at least %d" %(data_end, statespace.LLB.least_num_data()))
                    sys.exit()
                self.model = statespace.Multivar(algorithm, vals, self.numvals, correlate=self.correlate, missingValued=self.missingValued)
            elif algorithm[:2] == 'Bi': # one of the bivariate algorithms
                self.model = statespace.Multivar(algorithm, vals, data_end, forecast_len=future_timespan, missingValued=self.missingValued)
            else:
                self.model = statespace.Univar(algorithm, vals, self.data_start, self.data_end, forecast_len=future_timespan, missingValued=self.missingValued)
        except (AttributeError, ValueError) as e:
            splunk.Intersplunk.parseError(str(e))
            sys.exit()

    def predict(self):
        model = self.model
        if model.datalen() < model.least_num_data():
            splunk.Intersplunk.generateErrorResults("Too few data points: %d. Need at least %d" %(model.datalen(), model.least_num_data()))
            sys.exit()

        if self.options['algorithm'][:3] == 'LLB':
            start = max(self.data_end, 1)
            model.predict(0, start)
            self.future_timespan = 0
            self.lag = start + self.data_start
        else:
            self.lag = model.first_forecast_index() + self.data_start 


    def setNonnegativity(self):
        ''' If user set the 'nonnegative' option to true, then treat the fields as nonnegative and return.
        If not, then detect whether a field should be nonnegative by matching it with the countpattern below.
        '''
        if self.options['nonnegative'].lower() == 't':
            for field in self.fields:
                self.iscount[field] = True
            return
        countpattern = re.compile('^(c|count|dc|distinct_count|estdc)($|\()')
        for field in self.fields:
            if countpattern.match(field.lower()) or countpattern.match(self.asNames[field].lower()): 
                self.iscount[field] = True
            else:
                self.iscount[field] = False


    def getSpans(self, results):
        '''
            My understanding of the span fields is that:
            1. If _spandays isn't set, then _span is correct and counts the number of seconds since the epoch as defined in python.
               In particular, minute and hour spans are converted to _span correctly.
            2. If _spandays is set, then _span isn't always correct because of daylight time saving. So one should ignore _span in this case
               and use _spandays instead. We need to convert _spandays to seconds by using python's struct_time, localtime() and mktime().
            3. There is no _spanmonths field, but our convention is: if _spandays >= 28, then the month must be incremented and after that _spandays
               should be ignored. Hence, if _spandays >= 28, then we define spanmonths = _spandays/28 and then ignore _spandays.
        '''
        spandays = spanmonths = None
        if '_span' in results[0].keys():
            span = int(results[0]['_span'])
            if '_spandays' in results[0].keys():
                spandays = int(results[0]['_spandays'])
                if spandays >= 28:
                    spanmonths = int(spandays/28)
        elif '_time' in results[0].keys() and '_time' in results[1].keys():
            span = int(float(results[1]['_time']) - float(results[0]['_time']))
        else:
            splunk.Intersplunk.generateErrorResults("Unable to predict: data has no time")
            sys.exit()
        return (span, spandays, spanmonths)


    def output(self, results):
        model = self.model
        beginning = self.beginning
        lag = self.lag
        datalen = model.datalen()
        data_start = self.data_start
        options = self.options

        ext = self.numvals - self.holdback + self.future_timespan
        if self.options['algorithm'][:3] == 'LLB': 
            kk = min(len(results)-beginning, self.numvals)
        else:
            kk = min(len(results)-beginning, ext)

        # Since no numbers were present before 'beginning', we should leave those positions empty in the results.
        # All predictions are pushed forward (in the results array) by the 'beginning' amount. Without this forward push the 
        # predictions would be displayed at the wrong positions in the graphs: the predictions would appear
        # before the actual data. See SPL-80502.
        for i in range(beginning + min(lag, datalen)):
            for field in self.fields:
                results[i][self.UIpredictNames[field]] = self.fields[field]  
                results[i][self.fields[field]] = None
                results[i][self.UIupperNames[field]] = self.upperNames[field] 
                results[i][self.upperNames[field]] = None 
                results[i][self.UIlowerNames[field]] = self.lowerNames[field]
                results[i][self.lowerNames[field]] = None 
       
        self.setNonnegativity()
            
        for i in range(lag,kk):
            j = i - data_start
            I = i + beginning
            for field in self.fields:
                if self.options['suppress'] == field:
                    continue
                field_idx = self.fieldValMap[field]
                state = model.state(field_idx,j)

                if model.var(field_idx,j) == None:
                    print("None at j = %s" % j)
                    print("state = %s" % state)
                    continue

                tmp = sqrt(abs(model.var(field_idx,j)))
                upper = state + self.conf[0]*tmp
                lower = state - self.conf[1]*tmp
                if self.iscount[field] and lower < 0: lower = 0.0
                results[I][self.UIpredictNames[field]] = self.fields[field]  
                results[I][self.fields[field]] = str(state)
                results[I][self.UIupperNames[field]] = self.upperNames[field] 
                results[I][self.upperNames[field]] = str(upper)
                results[I][self.UIlowerNames[field]] = self.lowerNames[field]
                results[I][self.lowerNames[field]] = str(lower)

        # SPL-181973 For datasets that have NULL data at the start of the time range, which can occur when "earliest" or the
        # time picker is used, the lasttime will need to account for where the data actually begins.
        # For results with full data sets, the result will always begin at 0
        if '_time' in results[kk + beginning - 1]:
            lasttime = float(results[kk + beginning - 1]['_time'])
        else:
            splunk.Intersplunk.generateErrorResults("Unable to predict: data has no time")
            sys.exit()
        lasttime_struct = list(localtime(lasttime)) # convert to list since localtime() returns readonly objects
        (span, spandays, spanmonths) = self.getSpans(results)
        for i in range(kk,ext): # if this range is non-empty, that means ext > len(results); hence we should append to results
            j = i - data_start
            (extendedtime, lasttime_struct) = self.computeExtendedTime(lasttime_struct, span, spandays, spanmonths)
            newdict = {'_time': str(extendedtime)}
            for field in self.fields:
                if self.options['suppress'] == field:
                    continue
                field_idx = self.fieldValMap[field]
                state = model.state(field_idx, j)
                tmp = sqrt(abs(model.var(field_idx,j)))
                upper = state + self.conf[0]*tmp
                lower = state - self.conf[1]*tmp
                if self.iscount[field] and lower < 0: lower = 0.0
                newdict[self.UIpredictNames[field]] = self.fields[field]  
                newdict[self.fields[field]] = str(state)
                newdict[self.UIupperNames[field]] = self.upperNames[field] 
                newdict[self.upperNames[field]] = str(upper)
                newdict[self.UIlowerNames[field]] = self.lowerNames[field]
                newdict[self.lowerNames[field]] = str(lower)
            results.append(newdict)


    def computeExtendedTime(self, lasttime_struct, span, spandays, spanmonths):
        hour = lasttime_struct[3]
        if spanmonths:
            lasttime_struct[1] += spanmonths # increment the tm_mon field in python's struct_time
        elif spandays:
            lasttime_struct[2] += spandays # increment the tm_mday field in python's struct_time
        else:
            lasttime_struct[5] += span

        extendtime = mktime(tuple(lasttime_struct)) # convert back to seconds
        lasttime_struct = list(localtime(extendtime))

        # Dealing with daylight saving time. If the previous timestamp shows 12AM, we want 
        # the next timestamp to still be 12AM (not 1AM or 23PM) when users set span=1d or span=1mon
        # even when DST is in effect.
        if spandays != None:
            if lasttime_struct[8]==1 and (lasttime_struct[3] > hour or (hour==23 and lasttime_struct[3]==0)):
                extendtime -= 3600
                lasttime_struct = list(localtime(extendtime))
            elif lasttime_struct[8]==0 and (lasttime_struct[3] < hour or (hour==0 and lasttime_struct[3]==23)):
                extendtime += 3600
                lasttime_struct = list(localtime(extendtime))
        return (extendtime, lasttime_struct)


    def checkFutureTimespan(self):
        try:
            self.future_timespan = int(self.options['future_timespan'])
            if self.future_timespan < 0:
                raise ValueError
        except ValueError:
            splunk.Intersplunk.parseError("Invalid future_timespan: '%s'" %self.options['future_timespan'])

    def checkPeriod(self):
        self.period = self.options['period']
        if self.period != -1:
            try:
                self.period = int(self.period)
                if self.period < 1:
                    raise ValueError
            except ValueError:
                splunk.Intersplunk.parseError("Invalid period : '%s'" %self.options['period'])

    def checkHoldback(self):
        self.holdback = self.options['holdback']
        if self.holdback:
            try:
                self.holdback = int(self.options['holdback'])
                if self.holdback < 0:
                    raise ValueError
            except ValueError:
                splunk.Intersplunk.parseError("Invalid holdback: '%s'" %self.options['holdback'])
            
    def checkDataStart(self):
        try:
            self.data_start = int(self.options['start'])
            if self.data_start < 0:
                raise ValueError
        except ValueError:
            splunk.Intersplunk.parseError("Invalid start: '%s'" %self.options['start'])

    def checkNonnegative(self):
        try:
            self.nonnegative = bool(self.options['nonnegative'])
        except ValueError:
            splunk.Intersplunk.parseError("Invalid nonnegative value: '%s'" %self.options['nonnegative'])

    def initVals(self):
        self.vals = [None]*len(self.fields)
        for i in range(len(self.vals)):
            self.vals[i] = []

    def lastCheck(self):
        self.setUpperLowerNames() # if they weren't
        self.checkFutureTimespan()
        self.checkPeriod()
        self.checkHoldback()
        self.checkDataStart()
        self.checkNonnegative()
        self.initVals()


def parseOps(argv):
    argc = len(argv)
    if argc == 0: raise ValueError("No field specified")

    fcs = [FC()]

    i = 0
    fc = fcs[-1]
    current_field = None
    while i < argc:
        arg = str.lower(argv[i])
        
        if arg == 'as':
            if i+1 == argc or argv[i+1].find('=') != -1:
                raise ValueError("missing new name after 'as'")
            fc.setAsName(current_field,argv[i+1])
            i += 2
            continue

        pos = arg.find("=")
        if pos != -1:
            attr = arg[:pos]
            if attr in fc.options.keys():
                if attr=='as':
                    fc.setAsName(current_field, argv[i][pos+1:])
                else:
                    fc.options[attr] = argv[i][pos+1:]
            elif attr[:5]=="upper":
                try:
                    fc.upper_conf = float(attr[5:])
                    if fc.upper_conf < 0 or fc.upper_conf >= 100: raise ValueError
                    fc.conf[0] = erf.inverf(fc.upper_conf/100.)*root2
                except ValueError:
                    raise ValueError("bad upper confidence interval")
                fc.options['upper'] = argv[i][pos+1:]
            elif attr[:5]=="lower":
                try:
                    fc.lower_conf = float(attr[5:])
                    if fc.lower_conf < 0 or fc.lower_conf >= 100: raise ValueError
                    fc.conf[1] = erf.inverf(fc.lower_conf/100.)*root2
                except ValueError:
                    raise ValueError("bad lower confidence interval")
                fc.options['lower'] = argv[i][pos+1:]
            else:
                raise ValueError("unknown option %s" %arg)
            i +=1
            continue

        if len(fc.fields) == 0:
            isField = True
            while isField:
                fc.addField(argv[i])
                current_field = argv[i]
                i += 1
                if i < argc:
                    arg = str.lower(argv[i])
                    if arg == 'as':
                        if i+1==argc or argv[i+1].find('=') != -1:
                            raise ValueError("missing new name after 'as'")
                        fc.setAsName(current_field,argv[i+1])
                        i += 2
                        if i >= argc: break
                        arg = str.lower(argv[i])
                    if arg.find('=') != -1:
                        isField = False
                else: break
        else:
            fc.lastCheck() # if they weren't set
            fcs.append(FC(argv[i])) # start new FC
            current_field = argv[i]
            fc = fcs[-1]
            i += 1

    fc.lastCheck() # if they weren't set
    return fcs


def readSearchResults(results, fcs):
    if len(results) == 0:
        splunk.Intersplunk.generateErrorResults("No data")
        sys.exit(0)
    for fc in fcs:
        for field in fc.fields:
            if field not in results[0]:
                splunk.Intersplunk.generateErrorResults("Unknown field: %s" %field)
                sys.exit(0)
        fc.beginning = 0
    for res in results:
        for fc in fcs:
            for field in fc.fields:
                if field in res:
                    try:
                        fc.addVal(field, float(res[field]))
                        fc.databegun = True
                    except ValueError:
                        if not fc.databegun:
                            fc.beginning += 1 # increase 'beginning' only when no numbers have been encountered
                        elif res[field]==None or res[field]=='':
                            fc.addVal(field, None)
                            fc.missingValued = True
            if fc.options['correlate'] in res:
                if res[fc.options['correlate']]==None or res[fc.options['correlate']]=='':
                    fc.correlate.append(None)
                    fc.missingValued = True
                else:
                    try:
                        fc.correlate.append(float(res[fc.options['correlate']]))
                    except ValueError:
                        splunk.Intersplunk.parseError("bad correlate field value: " + res[fc.options['correlate']])
    for fc in fcs:
        fc.numvals = len(fc.vals[0])


def predictAll(fcs, results):
    readSearchResults(results, fcs)
    for fc in fcs:
        fc.setModel()
        fc.predict()
        fc.output(results)


############# Unit tests ##############
TIMEPATTERN = '%Y-%m-%dT%H:%M:%S'

def importData(csvfile, timefield='_time', timepattern=TIMEPATTERN):
    data = []
    with open(csvfile) as inputfile:
        reader = csv.DictReader(inputfile)
        for row in reader:
            if timefield in row:
                timestr = row[timefield][:-9]
                try:
                    row[timefield] = float(mktime(strptime(timestr,timepattern)))
                except ValueError as ve:
                    try:
                        timestr = row[timefield]
                        row[timefield] = float(mktime(strptime(timestr,timepattern)))
                    except ValueError:
                        try:
                            row[timefield] = float(row[timefield]) # value is number of seconds
                        except ValueError:
                            print("Unable to parse time field")
                            return []
            data.append(row)
        return data        


import time

class TestPredict(unittest.TestCase):
    def __init__(self, testname, dir=None):
        super(TestPredict,self).__init__(testname)

        ''' If dir is None, then we assume that we're running these tests from main/cfg/bundles/search/bin, the directory
        that contains predict.py. An example is:
        python -m unittest predict.TestPredict.test_predict1
        Hence we need to set dir so that we can find the input and output files. The input directory is
        main/src/search/testing/input and the output directory is main/src/search/testing/output/predict.conf.
        '''
        if not dir:
            dir = os.path.join('src','search','testing')
            for i in range(4):
                dir = os.path.join(os.pardir,dir)
        self.input_dir = os.path.join(dir,'input')
        self.output_dir = os.path.join(dir,'output')
        self.output_dir = os.path.join(self.output_dir,'predict.conf')

    def testEqual(self, list1, list2):
        ''' list1 and list2 are the test result and expected result from search queries. For example, an item in list1 would be:
        [foo, prediction(foo), lower95(prediction(foo)), upper95(prediction(foo))]
        '''
        self.assertEqual(len(list1), len(list2))
        for i in range(len(list1)):
            for j in range(len(list1[i])):
                if list1[i][j]=='' or list2[i][j]=='':
                    if list1[i][j] != list2[i][j]:
                        print("i=%d j=%d list1=%s list2=%s" %(i,j,list1[i][j],list2[i][j]))
                        print("list1 = %s" % list1)
                        print("list2 = %s" % list2)
                    self.assertTrue(list1[i][j]==list2[i][j])
                else:
                    self.assertAlmostEqual(float(list1[i][j]), float(list2[i][j]), 0)

    @classmethod
    def getResults(cls, data, fields):
        cols = []
        for fieldname in fields:
            pr = 'prediction(' + fieldname + ')'
            lo = 'lower95(' + pr + ')'
            up = 'upper95(' + pr + ')'
            cols.extend([fieldname, pr, lo, up])
        results = []
        for row in data:
            results.append([row.get(col,'') for col in cols])
        return (cols,results)


    def test_predict(self, input_file, expect_output_file, query, fieldlist, timepattern=TIMEPATTERN, update=False):
        ''' This function runs the given query using data from input_file and compares the result to expect_output_file.
        The rows in the result are restricted to the fields in fieldlist.
        Example: self.test_predict('NorFin.csv', "NorFin_out.csv', 'Nor Fin algorithm=LLP5', ['Nor','Fin'])
        See test_predict1, test_predict2, etc. below for more examples.
        If update==True, then this function simply writes the results to the expect_output_file, so that those results will be 
        used as expected output in later tests. Hence to update these tests' outputs, simply edit update=True, run the tests, then edit
        it back to update=False.
        '''
        self.maxDiff = None
        fcs = parseOps(query.split())
        input = os.path.join(self.input_dir, input_file)
        data = importData(input, timepattern=timepattern)
        predictAll(fcs, data)
        cols, result = self.getResults(data, fieldlist)
        self.cleanupResult(result)
        expected_file = os.path.join(self.output_dir, expect_output_file)
        if update:
            updated = []
            with open(expected_file) as csvfile:
                expected = csv.DictReader(csvfile, skipinitialspace=True)
                headers = expected.fieldnames
                i = 0
                for row in expected:
                    for j in range(len(cols)):
                        row[cols[j]] = result[i][j]
                    i += 1
                    updated.append(row)
            with open(expected_file, 'w') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=headers)
                writer.writeheader()
                for row in updated:
                    writer.writerow(row)
            return

        with open(expected_file) as csvfile:
            cols, expected = self.getResults(csv.DictReader(csvfile), fieldlist)
#            import pprint
#            print("result = ")
#            pprint.pprint(result)
#            print("expected = ")
#            pprint.pprint(expected)
            self.testEqual(result, expected)
           
    
    def test_quick(self, input_file, query, fieldlist, timefield='_time', timepattern=TIMEPATTERN):
        ''' This function runs the given query using data from input_file and prints the results to screen.
        This is meant to be a quick test to see if things run at all.
       '''
        import pprint
        fcs = parseOps(query.split())
        print(fcs[0])
        input = os.path.join(self.input_dir, input_file)
        print("reading input ...")
        data = importData(input, timefield=timefield, timepattern=timepattern)
        print("predicting ...")
        start = time.time()
        predictAll(fcs, data)
        print("predict time = %s" % time.time()-start)
        cols, result = self.getResults(data, fieldlist)
        pprint.pprint(result[:20])



    def test_parseOps(self):
        arg = "splk upper98=high lower90=low algorithm=LLT future_timespan=20 holdback=9 nonnegative=t as=splunk period=7 \
            googl as google algorithm=LLP5 future_timespan=33"
        expect = [
                "[('splk', 'splunk')], options: { algorithm: LLT, as: splunk, ci: 95, correlate: None, future_timespan: 20, holdback: 9, last: None, lower: low, nonnegative: t, period: 7, start: 0, suppress: None, upper: high,}",
                "[('googl', 'google')], options: { algorithm: LLP5, as: google, ci: 95, correlate: None, future_timespan: 33, holdback: 0, last: None, lower: None, nonnegative: f, period: -1, start: 0, suppress: None, upper: None,}"
                ]
        fcs = parseOps(arg.split())
        result = [str(fc) for fc in fcs]
        self.assertEqual(expect, result)

    def test_parseOps2(self):
        arg = "splk as splunk googl as google upper98=high lower90=low algorithm=LLT future_timespan=20 holdback=9 nonnegative=t period=7" 
        expect = [
                "[('splk', 'splunk'), ('googl', 'google')], options: { algorithm: LLT, as: google, ci: 95, correlate: None, future_timespan: 20, holdback: 9, last: None, lower: low, nonnegative: t, period: 7, start: 0, suppress: None, upper: high,}"
                ]
        fcs = parseOps(arg.split())
        result = [str(fc) for fc in fcs]
        self.assertEqual(expect, result)

    def test_parseOps3(self):
        arg = "count as foobar"
        expect = [
                "[('count', 'foobar')], options: { algorithm: LLP5, as: foobar, ci: 95, correlate: None, future_timespan: 5, holdback: 0, last: None, lower: None, nonnegative: f, period: -1, start: 0, suppress: None, upper: None,}"
                ]
        fcs = parseOps(arg.split())
        result = [str(fc) for fc in fcs]
        self.assertEqual(expect, result)



    def test_readSearchResults(self):
        results = [
                {'SPLK': 67.01, 'GOOGL': 564.92, 'XOM': 86.88},
                {'SPLK': 68.31, 'GOOGL': 578.48, 'XOM': 87.32},
                ]
        arg = 'SPLK XOM'
        fcs = parseOps(arg.split())
        readSearchResults(results, fcs)
        self.assertEqual(fcs[0].vals, [[67.01, 68.31], [86.88, 87.32]])
    

    def test_readSearchResults2(self):
        results = [
                {'SPLK': 67.01, 'GOOGL': 564.92, 'XOM': 86.88},
                {'SPLK': 68.31, 'GOOGL': 578.48, 'XOM': 87.32},
                ]
        arg = 'SPLK correlate=XOM GOOGL'
        fcs = parseOps(arg.split())
        readSearchResults(results, fcs)
        self.assertEqual(fcs[0].vals, [[67.01, 68.31]])
        self.assertEqual(fcs[0].correlate, [86.88, 87.32])
        self.assertEqual(fcs[1].vals, [[564.92, 578.48]])


    @classmethod
    def cleanupResult(cls, result):
         for row in result:
            for i in range(len(row)):
                if not row[i]:
                    row[i] = ''

    def test_predict1(self):
        self.test_predict(input_file='eggprice.csv', expect_output_file='predict_eggprice2.csv', query='pr', fieldlist=['pr'])


    def test_predict2(self):
        self.test_predict(input_file='NorFin.csv', expect_output_file='predict_NorFin.csv', query='Nor Fin', fieldlist=['Nor','Fin'])


    def test_predict3(self):
        self.test_predict('eggprice.csv', 'eggprice_LL.csv', "pr algorithm=LL holdback=10 future_timespan=10", ['pr'])
 

    def test_predict4(self):
        self.test_predict('eggprice.csv', 'eggprice_LLT_hb10_ft10.csv', "pr algorithm=LLT holdback=10 future_timespan=10", ['pr'])


    def test_predict5(self):
        self.test_predict('eggprice.csv', 'eggprice_LLP5.csv', "pr algorithm=LLP5 holdback=10 future_timespan=10", ['pr'])


    def test_predict6(self):
        self.test_predict('NorFin.csv', 'NorFin_LL.csv', 'Nor algorithm=LL holdback=10 future_timespan=10', ['Nor'])


    def test_predict7(self):
        self.test_predict('NorFin.csv', 'nor_LLT_hb10_ft10.csv', 'Nor algorithm=LLT holdback=10 future_timespan=10', ['Nor'])


    def test_predict8(self):
        self.test_predict('NorFin.csv', 'NorFin_LLP1.csv', 'Nor algorithm=LLP1 holdback=10 future_timespan=10', ['Nor'])


    def test_predict9(self):
        self.test_predict('NorFin.csv', 'NorFin_LLB.csv', 'Nor algorithm=LLB correlate=Fin holdback=10', ['Nor'])


    def test_predict10(self):
        self.test_predict('NorFin.csv', 'Nor_LLT2_hb10_ft10.csv', 'Nor algorithm=LLT2 holdback=10 future_timespan=10', ['Nor'])


    def test_predict11(self):
        self.test_predict('XOM_08_15.csv', 'XOM_08_15_LLT2_hb15_ft15.csv', 'open algorithm=LLT2 holdback=15 future_timespan=15', ['open'])


    def test_predict12(self):
        self.test_predict('NorFin.csv', 'NorFin_BiLL_hb10_ft10.csv', 'Nor Fin algorithm=BiLL holdback=10 future_timespan=10', ['Nor', 'Fin'])


    def test_predict13(self):
        self.test_predict('NorFin.csv', 'NorFin_LLP5_hb10_ft10.csv', 'Nor Fin algorithm=LLP5 holdback=10 future_timespan=10', ['Nor', 'Fin'])


    def test_predict14(self):
        self.test_predict('NorFin2.csv', 'countFin_LL_hb5_ft15_Nor_LLT_hb5_ft15.csv',\
                'count(Fin) algorithm=LL holdback=5 future_timespan=15  Nor algorithm=LLT holdback=5 future_timespan=15', ['Nor', 'count(Fin)'])


    def test_predict15(self):
        self.test_predict('hoskiss_outer_inner.csv', 'hoskiss_outer_inner_LLP5.csv', 'outer', ['outer'])
   

    def test_predict16(self):
        self.test_predict('ts_na_irregular_repeat_500.csv', 'ts_na_irregular_repeat_500_LLB.csv', 'outer algorithm=LLB correlate=inner holdback=40', ['outer'])


    def test_LL(self):
        self.test_predict3()
        self.test_predict6()
        self.test_predict14()


    def test_LLT(self):
        self.test_predict('hoskiss_linear_trend.csv', 'hoskiss_linear_trend_LLT.csv', 'count algorithm=LLT', ['count'], timepattern='%Y-%m-%d')
        self.test_predict('hoskiss_outer_inner.csv', 'hoskiss_LLT.csv', 'outer algorithm=LLT', ['outer'])
        self.test_predict('bluetooth.csv', 'bluetooth_LLT.csv', 'address_count algorithm=LLT holdback=706', ['address_count'])
        self.test_predict4()
        self.test_predict7()


    def test_LLP(self):
        self.test_predict1()
        self.test_predict2()
        self.test_predict5()
        self.test_predict8()
        self.test_predict13()
        self.test_predict15()
        self.test_predict('NorFin.csv', 'Nor_LLP.csv', 'Nor algorithm=LLP', ['Nor'])
        self.test_predict('NorFin.csv', 'Nor_LLP1.csv', 'Nor algorithm=LLP1', ['Nor'])
        self.test_predict('NorFin.csv', 'Nor_LLP2.csv', 'Nor algorithm=LLP2', ['Nor'])
        self.test_predict('NorFin.csv', 'Nor_LLP5.csv', 'Nor algorithm=LLP5', ['Nor'])

    def test_LLB(self):
        self.test_predict9()
        self.test_predict16()


    def test_missingvalue(self):
        self.test_predict('NorFin_ms2.csv', 'NorFin_ms2_LL.csv', 'Nor algorithm=LL', ['Nor'])
        self.test_predict('NorFin_ms2.csv', 'NorFin_ms2_LLT.csv', 'Nor algorithm=LLT', ['Nor'])
        self.test_predict('hoskiss_outer_inner_ms2.csv', 'hoskiss_outer_inner_ms2_LLP.csv', 'outer algorithm=LLP', ['outer'])
        self.test_predict('NorFin_ms2.csv', 'NorFin_ms2_BiLL_hb10_ft10.csv', 'Nor Fin algorithm=BiLL holdback=10 future_timespan=10', ['Nor','Fin'])
        self.test_predict('NorFin_ms2.csv', 'NorFin_ms2_Nor_corFin_hb10.csv', 'Nor algorithm=LLB correlate=Fin holdback=10', ['Nor'])
        self.test_predict('NorFin_ms2.csv', 'NorFin_ms2_Fin_corNor_hb10.csv', 'Fin algorithm=LLB correlate=Nor holdback=10', ['Fin'])


    def findPeriod(self, input_filename, fieldname, timepattern=TIMEPATTERN, expected_period=-1):
        input_file = os.path.join(self.input_dir, input_filename)
        data = importData(input_file, timepattern=timepattern)
        cols, rows = self.getResults(data, [fieldname])
        fieldvals = [None]*len(rows)
        for i in range(len(rows)):
            try:
                fieldvals[i] = float(rows[i][0])
            except ValueError: pass
 #       start = time.time()
        period = statespace.findPeriod3(fieldvals, 0, len(fieldvals))
        self.assertEqual(period, expected_period)
#        end = time.time()
#        print("period = %s" % period)
 #       print("time to compute period = %s" % (end-start))

    def test_findPeriod(self):
        testdata = [['ts_na_irregular_repeat_500.csv','outer',TIMEPATTERN,60],
                ['ts_na_irregular_repeat_1s_500.csv','outer',TIMEPATTERN,60],
                ['ts_irregular_repeat_5k.csv','outer','%m/%d/%Y %H:%M:%S',60],
                ['hoskiss_outer_inner.csv','outer',TIMEPATTERN,7]]

        for dat in testdata:
            self.findPeriod(*dat)


    def tmp(self):
        query = 'close algorithm=LLP5 holdback=10 future_timespan=5'
        fcs = parseOps(query.split())
        input_file = 'XOM_close.csv'
        input = os.path.join(self.input_dir, input_file)
        data = importData(input)
        predictAll(fcs, data)
        cols, result = self.getResults(data, ['close'])
        self.cleanupResult(result)
        import pprint
        pprint.pprint(result)
 

    def tmp2(self):
        query = 'close algorithm=LLP5 holdback=10 future_timespan=5'
        fcs = parseOps(query.split())
        input_file = 'XOM_open_close_low_14_15.csv'
        input = os.path.join(self.input_dir, input_file)
        data = importData(input)
        predictAll(fcs, data)
        cols, result = self.getResults(data, ['close'])
        self.cleanupResult(result)
        import pprint
        pprint.pprint(result)

    def tmp3(self):
        query = 'outer algorithm=LLP'
        fcs = parseOps(query.split())
        input_file = 'ts_irregular_2_8m.csv'
        input = os.path.join(self.input_dir, input_file)
        data = importData(input)
        print("len(data) = %u" % len(data))
        predictAll(fcs, data)
        cols, result = self.getResults(data, ['outer'])
        print("len(result) = %u" % len(result))
#        self.cleanupResult(result)
#        import pprint
#        pprint.pprint(result)

    def tmp4(self):
        self.test_quick('eggprice.csv', "pr algorithm=LL holdback=10 future_timespan=10", ['pr'])

    def tmp5(self):
        self.test_quick('ts_irregular_repeat_50k.csv', 'outer algorithm=LLP', ['outer'])
#        self.test_quick('ts_irregular_2_8m.csv', 'outer algorithm=LL', ['outer'])
 
    def tmp6(self):
#        self.test_quick('ts_irregular_repeat_50k.csv', 'outer algorithm=LLP5', ['outer'])
        self.test_quick('ts_irregular_1m.csv', 'outer algorithm=LLP5', ['outer'])
#        self.test_quick('data5M.csv', 'count algorithm=LLP5', ['count'])

    def tmp7(self):
        self.test_quick('XOM_08_15.csv', 'open algorithm=LL0 holdback=15 future_timespan=15', ['open'])

    def tmp8(self):
        self.test_quick('XOM_08_15.csv', 'open algorithm=LLP holdback=15 future_timespan=15', ['open'])

    def tmp9(self):
        self.test_quick('eggprice.csv', "pr algorithm=LL holdback=10 future_timespan=20", ['pr'])

    def tmp10(self):
        s1 = 'outer algorithm=LLP5 '
        s3 = ' future_timespan=10'
        for i in range(1):
            s2 = ' holdback=%d'%i
            s = s1 + s2 + s3
            self.test_quick('hoskiss_outer_inner.csv', s, ['outer'])
#        self.test_quick('hoskiss_outer_inner.csv', 'outer algorithm=LLP holdback=1 future_timespan=10', ['outer'])

    def tmp11(self):
        s1 = 'outer algorithm=LLP future_timespan=100'
        for i in range(1):
            s2 = ' holdback=%d'%i
            s = s1 + s2 
            self.test_quick('ts_irregular_10000.csv', s, ['outer'])


    def tmp12(self):
        self.test_quick('NorFin_ms4.csv', 'Nor algorithm=LL future_timespan=15', ['Nor'])

    def tmp13(self):
        self.test_quick('hoskiss_outer_inner.csv', 'outer algorithm=LLP period=7', ['outer'])
#        self.test_predict('hoskiss_outer_inner.csv', 'hoskiss_outer_inner_LLP5.csv', 'outer algorithm=LLP0', ['outer'])

    def tmp14(self):
        timepattern = '%m/%d/%Y %H:%M:%S' 
#        self.test_quick("ts_irregular_repeat_100k.csv", "inner algorithm=LLB correlate=outer  holdback=10", ["inner"], timepattern)
        self.test_quick("ts_irregular_repeat_100k.csv", "inner algorithm=LLP holdback=10", ["inner"], timepattern)
#        self.test_quick("ts_irregular_trend_100k.csv", "inner algorithm=LLB correlate=outer holdback=10", ["inner"], timepattern)
#        self.test_quick("ts_irregular_repeat_5k.csv", "inner algorithm=LL holdback=100", ["inner"], timepattern)

    def tmp15(self):
        self.test_quick('logins.csv', 'logins algorithm=LLP future_timespan=15 upper20=high lower20=low', ['logins'])

    def tmp16(self):
#        self.test_quick('ts_irregular_10000.csv', 'outer algorithm=LLP period=60', ['outer'])
        self.test_quick('ts_na_irregular_repeat_500.csv', 'outer algorithm=LLP period=60', ['outer'])

    def tmp17(self):
#        self.test_quick('ts_irregular_10000.csv', 'outer algorithm=LLP period=60', ['outer'])
#        self.test_quick('ts_na_irregular_repeat_500.csv', 'outer algorithm=LLP', ['outer'])
#        self.test_quick('ts_na_irregular_repeat_500_2.csv', 'outer algorithm=LLP', ['outer'])
#        self.test_quick('hoskiss_10_weeks_repeat_trend_ms2.csv', 'count algorithm=LLP period=7', ['count'])
        self.test_quick("ts_irregular_repeat_5k.csv", "inner algorithm=LLP holdback=100", ["inner"], timepattern='%m/%d/%Y %H:%M:%S')

    def tmp18(self):
        self.test_quick('ts_test.csv', 'outer algorithm=LL future_timespan=10', ['outer'])

    def tmp19(self):
        self.test_quick('ts_na_irregular_trend_500.LLT.csv', 'outer algorithm=LLT', ['outer'])

    def tmp20(self):
        timepattern = '%Y-%m-%d'
        self.test_quick("hoskiss_linear_trend.csv", "count algorithm=LLT", ["count"], timepattern=timepattern)

    def tmp21(self):
        # expecting: ERROR
        # period can't be greater than 2000
        self.test_quick("ts_irregular_repeat_5k.csv", "inner algorithm=LLP5 period=10000000000", ["inner"], timepattern='%m/%d/%Y %H:%M:%S')

    def test_time_val_float(self):
        self.test_predict("internet_traffic_300.csv", "internet_traffic_300_LLP5.csv", "bits_transferred algorithm=LLP5 future_timespan=112 holdback=112", ["bits_transferred"], update=False)

    def test_raise_no_timefield_error(self):
        fcs = parseOps("petal_length".split())
        input = os.path.join(self.input_dir, "iris_10.csv")
        data = importData(input)
        with self.assertRaises(SystemExit):
            predictAll(fcs, data)


if __name__ == "__main__":
    (isgetinfo, sys.argv) = splunk.Intersplunk.isGetInfo(sys.argv)
    if isgetinfo:
        splunk.Intersplunk.outputInfo(False, False, True, False, None, True)
        # outputInfo automatically calls sys.exit()
    try:
        forecaster = parseOps(sys.argv[1:])
    except ValueError as e:
        splunk.Intersplunk.parseError(str(e))
    results = splunk.Intersplunk.readResults(None, None, False)
    predictAll(forecaster, results)
    splunk.Intersplunk.outputResults(results)
#    unittest.main()
