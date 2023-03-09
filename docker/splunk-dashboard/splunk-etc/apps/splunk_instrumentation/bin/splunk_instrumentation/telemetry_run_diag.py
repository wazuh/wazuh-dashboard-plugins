import json
import os
import subprocess
import sys

import splunk.rest as rest
from splunk.persistconn.application import PersistentServerConnectionApplication

if sys.version_info >= (3, 0):
    string_type = (str, bytes)
    unicode = str
else:
    import __builtin__
    string_type = __builtin__.basestring
    unicode = unicode

path = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                     '..', '..', 'bin'))
sys.path.append(path)
from splunk_instrumentation.diag.diag_service import DiagService  # noqa
from splunk_instrumentation.splunkd import Splunkd  # noqa


diag_worker_argv = ['python',
                    os.path.join(os.path.realpath(os.path.dirname(os.path.realpath(__file__))), 'diag', 'diag_main.py')]

diag_worker_kwargs = {}


def spawn(configuration):
    worker_proc = subprocess.Popen(diag_worker_argv,
                                   stdout=subprocess.PIPE,
                                   stdin=subprocess.PIPE,
                                   stderr=subprocess.PIPE,
                                   universal_newlines=True,
                                   bufsize=10,
                                   **diag_worker_kwargs
                                   )
    worker_proc.stdin.write(configuration)
    worker_proc.stdin.close()
    result = worker_proc.stdout.readline()
    read = ''
    if not result:
        read = worker_proc.stderr.readline()
        while read:
            result = result + read
            read = worker_proc.stderr.readline()
    result = result + read
    worker_proc.stdout.close()
    return result


class DiagRunner(PersistentServerConnectionApplication):

    def handleStream(self, handle, in_string):
        pass

    def __init__(self, command_line=None, command_arg=None):
        PersistentServerConnectionApplication.__init__(self)
        self.token = ''
        self.server_uri = ''
        self.DTO_FIELD = [
            'nodes',
            'configuration'
        ]

        self.DTO_DEFAULT_VALUE = {
            "nodes": [],
            "configuration": {}
        }
        self.FIELD_TYPE = {
            "nodes": [list],
            "configuration": [dict],
        }

        self.FIELD_NAME = {
            str: 'string',
            unicode: 'string',
            int: 'integer',
            list: 'list',
            dict: 'JSON Object'
        }

    def get_query(self, arg, key):
        for value in (arg['query'] or []):
            if key == value[0]:
                return value[1]
        return None

    def get_service(self, token, service=None):
        self.token = token
        self.server_uri = self.make_splunkd_uri()
        if not service:
            service = Splunkd(token=self.token, server_uri=self.server_uri)
        return service

    def make_splunkd_uri(self):
        return rest.makeSplunkdUri()

    def parse_arg(self, arg):
        try:
            arg = json.loads(arg)
        except Exception:
            raise Exception(["Payload must be a json parseable string, JSON Object, or JSON List"])
        return arg

    def is_post(self, arg):
        return arg.get('method') == 'POST'

    def is_delete(self, arg):
        return arg.get('method') == 'DELETE'

    def handle(self, arg):
        msg = ""
        status = 500
        arg = self.parse_arg(arg)

        payload = json.loads(arg.get('payload') or '{}')

        spawn_payload = {
            'token': arg['system_authtoken'],
            'server_uri': self.make_splunkd_uri(),
            'payload': payload,
        }

        if self.is_post(arg):
            try:
                msg = spawn(json.dumps(spawn_payload))
                status = 200
            except Exception as ex:
                msg = str(ex)
                status = 500

        return {'payload': msg, 'status': status}
