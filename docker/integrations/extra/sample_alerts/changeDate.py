import datetime
import random
def random_date(start,end,prop):
    ptime = start + prop * (end - start)
    return ptime

current_time = datetime.datetime.now()
seven_days_before = datetime.datetime.now() - datetime.timedelta(days=7)
file = 'sample.json'
destination='/var/ossec/logs/alerts/sample_alerts.json'
with open(file,'r') as f:
    newlines = []
    for line in f.readlines():
        result = str(random_date(seven_days_before,current_time,random.random()).strftime('%Y-%m-%dT%H:%M:%S.%f+0000'))
        newlines.append(line.replace('dateToChange',result))
with open(destination,'w') as f:
    for line in newlines:
        f.write(line)
