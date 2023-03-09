#   Version 4.0
import sys
import splunk.Intersplunk as isp

if len(sys.argv) != 3:
    isp.parseError("Usage: indextimerange <earliest_time_epoch> <latest_time_epoch>")

a = 0
b = 0
try:
    a = int(sys.argv[1])
    b = int(sys.argv[2])
    if (b < a):
        raise ValueError
    
except:
    isp.parseError("Invalid earliest and/or latest epoch times")    
    
disjuncts = []

while a < b:
    level = 10

    while a % level == 0 and (a + level) <= b:
        level = level*10

    level = level/10

    disjuncts.append('_indextime=%d%s' % (a/level, level > 1 and '*' or ''))

    a = a + level

results = [{'search' : " OR ".join(disjuncts)}]
    
isp.outputResults(results)
