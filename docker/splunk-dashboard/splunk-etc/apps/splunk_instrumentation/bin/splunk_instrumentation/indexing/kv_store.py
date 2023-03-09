import json
import xml.dom.minidom as dom
if sys.version_info >= (3, 0):
    from urllib.parse import urlencode
else:
    from urllib import urlencode

from splunk_instrumentation.report import report

from splunk_instrumentation.constants import SPLUNKRC, INST_KV_OWNER, INST_KV_APP, KV_STORE_ENDPOINT, COLLECTION_NAME

from splunk_instrumentation.indexing.base_class import BaseClass


class KvStore(BaseClass):

    def __init__(self, splunkrc=None):
        splunkrc = (splunkrc or SPLUNKRC).copy()
        splunkrc['owner'] = splunkrc.get('owner') or INST_KV_OWNER
        splunkrc['app'] = splunkrc.get('app') or INST_KV_APP

        super(KvStore, self).__init__(splunkrc)
        self.headers = [('content-type', 'application/json')]
        self.service = self._splunkd.service
        self.prepare_collection()

    def to_json(self, data):
        return json.dumps(data)

    def prepare_collection(self):
        payload = self.service.request(KV_STORE_ENDPOINT["config"], method="GET", headers=self.headers,
                                       owner=self.splunkrc['owner'], app=self.splunkrc['app'])
        collections = self.parse_collection(payload)
        if COLLECTION_NAME not in collections:
            report.report('noKVStore', True)

    def parse_collection(self, payload):
        data = dom.parseString(payload['body'].read())
        return [node.firstChild.data for node in data.getElementsByTagName('title')]

    def create_collection(self, name):
        data = urlencode({"name": name})
        try:
            self.service.request(KV_STORE_ENDPOINT["config"], method="POST", body=data, headers=self.headers,
                                 owner=self.splunkrc['owner'], app=self.splunkrc['app'])
        except Exception:
            return False
        return True

    def set_key(self, key, value):
        # _key is unique to each of the entries.
        value = json.dumps({"value": value, "_key": key})
        try:
            self.service.request(KV_STORE_ENDPOINT["document"], method="POST", body=value, headers=self.headers,
                                 owner=self.splunkrc['owner'], app=self.splunkrc['app'])
        except Exception:
            self.service.request(KV_STORE_ENDPOINT["document"]+"/"+key, method="POST", body=value, headers=self.headers,
                                 owner=self.splunkrc['owner'], app=self.splunkrc['app'])

    def get_key(self, key, default=None):
        try:
            payload = self.service.request(KV_STORE_ENDPOINT["document"]+"/"+key, method="GET", headers=self.headers,
                                           owner=self.splunkrc['owner'], app=self.splunkrc['app'])
            value = json.loads(str(payload['body']))
            return value.get('value')
        except Exception:
            return default
