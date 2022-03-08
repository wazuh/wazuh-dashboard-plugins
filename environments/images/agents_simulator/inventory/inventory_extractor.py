#!/usr/bin/python
# Wazuh inventory extractor from API
# Transform API results into Inventory sample dataset for agents_simulator.py
# Copyright (C) 2015-2020, Wazuh Inc.
# Feburary 17, 2020.
#
# This program is free software; you can redistribute it
# and/or modify it under the terms of the GNU General Public
# License (version 2) as published by the FSF - Free Software
# Foundation.

# Python 3.7 or superior


import json
import os
import requests
import sys

# Configuration
base_url = 'http://172.16.5.10:55000'
auth = requests.auth.HTTPBasicAuth('foo', 'bar')
verify = False
requests.packages.urllib3.disable_warnings()

# Arguments
if len(sys.argv) < 2:
    print("Required one argument: AgentID. Example: inventory_extractor.py <agent_id>")
    sys.exit()
# Request
url = '{0}/syscollector/{1}/packages?limit=1000'.format(base_url, sys.argv[1])
r = requests.get(url, auth=auth, params=None, verify=verify)
items = r.json()["data"]["items"]

for item in items:
    program = item
    timestamp = item["scan"]["time"]
    del program['scan']
    message = {"type": "program", "ID":"<scan_id>", "timestamp": timestamp, "program":program}
    print (json.dumps(message).replace('"<scan_id>"','<scan_id>'))
end_scan = {"type": "program_end", "ID": "<scan_id>", "timestamp": timestamp}
print (json.dumps(end_scan).replace('"<scan_id>"','<scan_id>'))
