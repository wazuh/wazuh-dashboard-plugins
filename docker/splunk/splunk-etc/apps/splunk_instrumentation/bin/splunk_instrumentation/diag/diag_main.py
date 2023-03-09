#!/usr/bin/python
import os
import sys
import json

"""Spawn multiple workers and wait for them to complete"""

path = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                     '..', '..', '..', 'bin'))
sys.path.append(path)
from splunk_instrumentation.diag.batch_runner import BatchRunner  # noqa
from splunk_instrumentation.diag.diag_task import DiagTask  # noqa
from splunk_instrumentation.splunkd import Splunkd  # noqa
from splunk_instrumentation.diag.diag_service import DiagService  # noqa


configurationStr = sys.stdin.read()

configuration = json.loads(configurationStr)

splunkd = Splunkd(token=configuration['token'], server_uri=configuration['server_uri'])

diag_service = DiagService(splunkd)

batchRunner = BatchRunner(config=configuration['payload'])
diag_service.batch_id = batchRunner.batch_id

for config in configuration['payload']['nodes']:
    batchRunner.add_task(DiagTask({"node": config, "configuration": configuration['payload']['configuration']},
                                  diag_service=diag_service))

print(json.dumps({'batch_id': batchRunner.batch_id}) + '\r\n')
sys.stdout.flush()

batchRunner.run()
