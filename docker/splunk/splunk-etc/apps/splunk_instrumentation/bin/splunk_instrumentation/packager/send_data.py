from builtins import range
from builtins import object
import json
import time
import requests
from splunk_instrumentation.report import report
from splunk_instrumentation.datetime_util import json_serial

CDS_API_VERSION = "1"


class SendData(object):
    def __init__(self, endpoint=None, authKey=None,
                 deploymentID=None, deliverySchema=None, transaction_id=None):
        self.deploymentID = deploymentID
        self.deliverySchema = deliverySchema
        self.source = None
        self.transaction_id = transaction_id

    def send_data(self, data, sleep=6):
        time.sleep(sleep)

        n = 100
        groups = [data[i:i + n] for i in range(0, len(data), n)]
        profile = report.start_profiling()
        for group in groups:
            profile2 = report.start_profiling()
            length = self.send_events(group)
            report.report("SendData.log[]", {"count": len(group), "length": length}, profile2)

        report.report("SendData.count", {"count": len(data)}, profile)

    def send_events(self, data):
        headers = {"Content-type": "text/json"}

        payload = self.bundle_DTOs(data)
        url = "/".join([self.deliverySchema.url, self.deploymentID, str(len(data)), "0"]) + "?hash=none"
        requests.post(url, data=payload, headers=headers)

        return len(payload)

    def convert(self, data, timestamp):
        if self.transaction_id:
            data['transactionID'] = self.transaction_id
        data['deploymentID'] = self.deploymentID
        data['version'] = data.get('version') or self.deliverySchema.version

        separator = '^'.join(["{", CDS_API_VERSION, "event", timestamp]) + "}"
        result = {
            "sdkVersion": "4.3",
            "osVersion": "0",
            "event_name": "Deployment",
            "appVersionCode": "3",
            "uuid": self.deploymentID,
            "packageName": "splunk_instrumentation",
            "extraData": data,
            "session_id": self.transaction_id,
            "appVersionName": "1"}

        return json.dumps(result, default=json_serial) + separator

    def bundle_DTOs(self, dtos):
        timestamp = str(int(time.time()))

        result = [self.convert(data, timestamp) for data in dtos]
        return "".join(result)
