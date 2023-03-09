import json
import os
import sys
import splunk.rest as rest
from splunk.persistconn.application import PersistentServerConnectionApplication

path = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                     '..', '..', 'bin'))
sys.path.append(path)

try:
    from splunk_instrumentation.splunkd import Splunkd
except Exception:
    raise

class ListDiagsHandler(PersistentServerConnectionApplication):
    """
    Lists the status for all known diags on a single server or SHC
    """

    def __init__(self, command_line=None, command_arg=None):
        PersistentServerConnectionApplication.__init__(self)
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

    def handle(self, arg):
        try:
            arg = self.parse_arg(arg)
            splunkd = self.get_service(token=arg['session']['authtoken'])

            nodes = []
            try:
                # Use the system-authenticated splunkd service as some users
                # will not have the capability to list search head cluster members.
                # (We do not expose this list, it is only used internally).
                nodes = splunkd.get('/services/remote-proxy/nodes').get('body').read()
                
            except Exception:
                # The shcluster status endpoints may throw if clustering is disabled.
                # We'll still want to return the diags from this host though, so
                # continue.
                pass

            SearchHeads = [sh for sh in json.loads(nodes)['nodes'] if 'SHC Member' in sh['role']]
            body = splunkd.get_json('/services/diag/status')
            if SearchHeads:
                for SearchHead in SearchHeads:
                    try:
                        res = splunkd.get_json('/services/remote-proxy/diag/status',proxy_to=SearchHead['proxy_to'])
                        body['errors'].extend(list(res['errors']))
                        body['statuses'].extend(list(res['statuses']))
                    except Exception as e:
                        pass
            
            return {'payload': json.dumps(body),
                    'status': 200}
        except Exception:
            return {'payload': 'Internal server error', 'status': 500}
