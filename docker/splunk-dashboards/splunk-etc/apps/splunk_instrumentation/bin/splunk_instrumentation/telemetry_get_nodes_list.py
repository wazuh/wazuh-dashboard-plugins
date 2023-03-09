import json
import os
import sys

import splunk.rest as rest
from splunk.persistconn.application import PersistentServerConnectionApplication

path = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                     '..', '..', 'bin'))
sys.path.append(path)

try:
    from splunk_instrumentation.deployment_node_list import NodeList
    from splunk_instrumentation.splunkd import Splunkd
except Exception:
    raise

TEST_NODES = [
    {'host': 'superfakehost1-clustermaster',
     'uri': 'https://superfakeclustermaster.com:8089',
     'roles': ['cluster master']},
    {'host': 'superfakehost2-searchhead',
     'uri': 'https://superfakesearchhead.com:8089',
     'roles': ['search head']},
    {'host': 'superfakehost3-indexer',
     'uri': 'https://superfakeindexer.com:8089',
     'roles': ['indexer']},
]


class ListNodes(PersistentServerConnectionApplication):
    """
    Getting the list of nodes in a deployment
    GET request coming into services/telemetry/nodes
    Proposed payload:
        {
           nodes : [{host: <hostname>,
                    'uri':https://<hostip>:<port>,
                    'roles':[]}],
           errors: []
        }
    """

    def handleStream(self, handle, in_string):
        pass

    def __init__(self, command_line=None, command_arg=None):
        PersistentServerConnectionApplication.__init__(self)
        self.DTO_FIELD = []
        self.DTO_DEFAULT_VALUE = {}
        self.FIELD_TYPE = {}
        self.FIELD_NAME = {}

        self.deploymentID = ''
        self.token = ''
        self.server_uri = ''

    def parse_arg(self, arg):
        try:
            arg = json.loads(arg)
        except Exception:
            raise Exception(["Payload must be a json parseable string, JSON Object, or JSON List"])
        return arg

    def get_service(self, token, service=None):
        self.token = token
        self.server_uri = rest.makeSplunkdUri()
        if not service:
            service = Splunkd(token=self.token, server_uri=self.server_uri)
        return service

    def get_query(self, arg, key):
        for value in (arg['query'] or []):
            if key == value[0]:
                return value[1]

    def handle(self, arg):
        arg = self.parse_arg(arg)

        if self.get_query(arg, 'diag_mode') == 'test':
            return {'payload': json.dumps({'nodes': TEST_NODES, "errors": []}), 'status': 200}

        try:
            nodes_list = NodeList(self.get_service(arg['session']['authtoken'])).fetch_nodes()
        except Exception:
            raise Exception(['Failed to get the list of nodes in the deployment'])

        return {'payload': json.dumps(nodes_list), 'status': 200}
