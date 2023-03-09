#   Version 4.0
import sys,splunk.Intersplunk
import re
import urllib
import time
from builtins import range, filter
from splunk.util import cmp
from functools import cmp_to_key

""" 
    This script looks for query ids that overlap in time or have time gaps between.
    max and min. The generated results only make sense for inputs that have a min/max 
    time and a query/search id specified. Currently the following fields are required:
        (1) info_min_time
        (2) info_max_time
        (3) info_search_time
        (4) search_name
    Overlaps/gaps are found only between evetns with same info_search_name value, but 
    different info_search_id.vents that do not contain these fields are ignored. If no 
    events contain these fields an error is thrown.
"""

min_time_key    = "info_min_time"
max_time_key    = "info_max_time"
query_id_key    = "info_search_time"
search_name_key = "search_name"
infinity        = 10E200

# windows python infinity float don't play nice - so we parse our own floats
def parse_float(x):
    if x == "+Infinity": 
        return infinity
    return float(x)

def fToStr(x):
    if x == infinity: 
        return "inf"
    
    str = "%.4f" % x
    str = str.rstrip('0')
    if str.endswith('.'): str = str[0:len(str)-1]
    return str

#used to sort result by search name then min_time
def result_compare(x, y):
    x_min = parse_float(x[min_time_key])
    y_min = parse_float(y[min_time_key]) 
    ret   = cmp(x[search_name_key], y[search_name_key])
    if ret == 0 :
        if   x_min == y_min : return cmp(x[query_id_key], y[query_id_key])
        elif x_min <  y_min : return -1
        else                : return  1
    return ret

def valid_result(x):
    return min_time_key in x and max_time_key in x and query_id_key in x and search_name_key in x


def gapsOverlaps(results, findGaps):
    toReturn = []
    try:
        # 
        # algorithm: (1) sort results (uniq qid) by search_name then min_time
        #            (2) iterate over the events and find :
        #                A. the first gap and 
        #                B. all overlaping records
        #                in events that have the same search name [it doesn't make sense to find 
        #                overlaps/gaps for query ids of different saved searches]   
        # Complexity: mn + nlog(n) 
        #  n  - the number of results, 
        #  m  - average number of overlapping results (total_pairwise_overlaps/n)
    
        # prelim: (1) ensure results are valid, ie they contain the required fields
        #         (2) keep only results with unique query ids
        results = filter(valid_result, results)
       
        uniq_qid = {}
        for r in results:
            if r[query_id_key] not in uniq_qid:
               uniq_qid[r[query_id_key]] = r
        results = uniq_qid.values()

        if len(results) == 0:
            return splunk.Intersplunk.generateErrorResults("Invalid events. Events should contain fields: %s, %s, %s and %s" % (min_time_key, max_time_key, query_id_key, search_name_key))

        #### algo start ####
        
        #1. sort the results by min_time
        results = sorted(results, key = cmp_to_key(result_compare))
        
        results_cnt = len(results)
    
        #2. iterate over all results looking for overlaps/gaps
        for i in range(0, results_cnt-1):
            p      = results[i]
            p_min  = parse_float(p[min_time_key])
            p_max  = parse_float(p[max_time_key])    
            p_qid  = p[query_id_key]
            p_name = p[search_name_key]
            
            # look for (1)  all overlaps and (2) the first gap (in events with same search name)
            # need the for loop to find *all* overlaps
            k = 0
            for j in range(i+1, results_cnt):
                c     = results[j] 
                
                if p_name != c[search_name_key]:
                    break

                c_qid = c[query_id_key]                 
                c_min = parse_float(c[min_time_key])
                c_max = parse_float(c[max_time_key])    
                r     = {}
                if  c_min < p_max :  
                    r["_overlap_et"]      = c_min
                    r["_overlap_lt"]      = min(c_max, p_max)
                    r["overlap_earliest"] = time.ctime(c_min)
                    r["overlap_latest"  ] = "+Infinity"
                    if not infinity == r["_overlap_lt"] :  r["overlap_latest"  ] = time.ctime(r["_overlap_lt"])
                    r["_overlap_lt"]      = fToStr(r["_overlap_lt"])
                    r["_time"]            = c_min
                    r["_raw"]             = "Found overlap in saved search '%s' between search ids: '%s' and '%s' from '%s' to '%s'" % (p_name, p_qid, c_qid, r["overlap_earliest"], r["overlap_latest"])
            
                # look for a gap only with the first/next result (ie first gap)
                elif findGaps and k == 0 and c_min > p_max :  
                    r["_gap_et"]      = p_max
                    r["_gap_lt"]      = c_min
                    r["gap_earliest"] = time.ctime(p_max)
                    r["gap_latest"  ] = time.ctime(c_min)
                    r["_time"]        = p_max
                    r["_raw"]         = "Found gap in saved search '%s' between search ids: '%s' and '%s' from '%s' to '%s'" % (p_name, p_qid, c_qid, r["gap_earliest"], r["gap_latest"])
                else: 
                    break
                     
                if len(r) > 0:
                   r["_orig_sid1"] = p_qid
                   r["_orig_sid2"] = c_qid
                   if "source" in p : r["orig_source1"] = p["source"] 
                   if "source" in c : r["orig_source2"] = c["source"] 
                   r["_orig_et1"] = fToStr(p_min)
                   r["_orig_et2"] = fToStr(c_min)
                   r["_orig_lt1"] = fToStr(p_max)
                   r["_orig_lt2"] = fToStr(c_max)
                   toReturn.append(r)  
                k += 1  
                
        # reverse order latest -> earliest 
        toReturn = sorted(toReturn, key=cmp_to_key(lambda x,y: int(x["_time"]-y["_time"])), reverse=True)
    except:
        import traceback
        stack    = traceback.format_exc()
        toReturn = splunk.Intersplunk.generateErrorResults("Error : Traceback: " + str(stack))
        
    return toReturn


results,dummyresults,settings = splunk.Intersplunk.getOrganizedResults()
splunk.Intersplunk.outputResults( gapsOverlaps(results, True) )
