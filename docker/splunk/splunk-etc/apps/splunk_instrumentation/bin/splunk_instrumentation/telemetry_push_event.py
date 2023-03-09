import os
import sys
import json
import hashlib
import uuid
import time
from datetime import datetime

from splunk.persistconn.application import PersistentServerConnectionApplication
import splunk.rest as rest
import splunk.auth

if sys.version_info >= (3, 0):
    string_type = (str, bytes)
    unicode = str
else:
    import __builtin__
    string_type = __builtin__.basestring
    unicode = unicode



if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)


path = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) +
                        '/../../bin')
sys.path.append(path)

try:
    from splunk_instrumentation.packager.send_data import SendData
    from splunk_instrumentation.packager.quick_draw import get_quick_draw
    from splunk_instrumentation.constants import INST_SCHEMA_FILE
    import splunk_instrumentation.metrics.metrics_schema as metrics_schema
    from splunk_instrumentation.splunkd import Splunkd
    from splunk_instrumentation.deployment_id_manager import DeploymentIdManager
    from splunk_instrumentation.telemetry_conf_service import TelemetryConfService
except Exception:
    raise

ANONYMOUS = 'anonymous'


class EventHandler(PersistentServerConnectionApplication):
    """
    Sending event into CDS, utilizing SendData Module
    Event coming in via POST to services/telemetry/event
    Proposed payload:
        {
           deploymentID : guid  // optional.  can generate on server

           eventID      : guid   // optional  can generate on server

           experienceID :  guid session ID // optional cant generate on server

           timestamp    :  integer in seconds // optional if missing will use current time

           component    : the event name example "page_view"

           userID       : guid optional

           visibility   : always "anonymous"

           data         : an event specific object (valuable information to be stored)
        }
    """

    def __init__(self, command_line=None, command_arg=None):
        PersistentServerConnectionApplication.__init__(self)
        self.DTO_FIELD = [
            'timestamp',
            'deploymentID',
            'eventID',
            'experienceID',
            'component',
            'userID',
            'visibility',
            'data'
        ]

        self.DTO_DEFAULT_VALUE = {
            "timestamp": lambda event: int(time.time()),
            "deploymentID": self.getDeploymentID,
            "userID": self.getUserID,
            "visibility": lambda event: ANONYMOUS,
            "eventID": lambda event: str(uuid.uuid4())
        }
        self.FIELD_TYPE = {
            "userID": [str, unicode],
            "eventID": [str, unicode],
            "experienceID": [str, unicode],
            "timestamp": [int],
            "data": [dict],
            "component": [str, unicode]
        }

        self.FIELD_NAME = {
            str: 'string',
            unicode: 'string',
            int: 'integer',
            dict: 'JSON Object'
        }

        self.schema = metrics_schema.load_schema(INST_SCHEMA_FILE)
        self.qd = get_quick_draw()
        self.deliverySchema = self.schema.delivery
        self.deliverySchema.url = self.qd.get('url')
        self.deploymentID = ''
        self.token = ''
        self.server_uri = ''
        self.userID = ''

    def getToken(self, cookie):
        for key, value in cookie:
            if 'splunkd' in key:
                self.token = value

    def checkFieldType(self, event):
        violation = []
        for key, values in list(self.FIELD_TYPE.items()):
            if key in event:
                if type(event[key]) not in values:
                    violation.append("{key} field must be a {name}".format(key=key, name=self.FIELD_NAME[values[0]]))
        if violation:
            raise Exception(violation)

    def getDeploymentID(self, cookie):
        if not self.deploymentID:
            self.getToken(cookie)
            self.server_uri = rest.makeSplunkdUri()
            splunkd = Splunkd(token=self.token, server_uri=self.server_uri)

            telemetry_conf_service = TelemetryConfService(splunkd, is_read_only=True)
            telemetry_conf_service.fetch()

            deployment_id_manager = DeploymentIdManager(
                splunkd,
                telemetry_conf_service=telemetry_conf_service)

            self.deploymentID = deployment_id_manager.get_deployment_id()
        return self.deploymentID

    def getUserID(self, event):
        if not self.userID:
            hash_key = self.deploymentID + splunk.auth.getCurrentUser()['name']
            if sys.version_info >= (3, 0):
                hash_key = hash_key.encode()
            self.userID = hashlib.sha1(hash_key).hexdigest()
        return self.userID

    def normalizePayload(self, arg):
        """ Payload can come as a JSON Object or JSON Array,
        This convert it to JSON Array.
        """
        if arg:
            payload = json.loads(arg)
            if type(payload) is not dict and type(payload) is not list:
                raise Exception("Payload must be a JSON Array or a JSON Object")
            if type(payload) is dict:
                payload = [payload]
            return payload
        raise Exception("Each request needs to have a payload")

    def missingParams(self, events):
        neededParams = ['component', 'data']
        result = set()
        for event in events:
            for field in neededParams:
                if field not in event:
                    result.add("Each event needs to have {field} field".format(field=field))
        return list(result)

    def isValidTimestamp(self, event):
        if event.get('timestamp'):
            try:
                datetime.fromtimestamp(event.get('timestamp'))
            except Exception:
                return False
            return True

    def bundleDto(self, events):
        dto = []
        for event in events:
            self.checkFieldType(event)
            if not self.isValidTimestamp(event):
                event['timestamp'] = ''
            # override visibility to always be ANONYMOUS
            event['visibility'] = None
            for eventsKey in self.DTO_FIELD:
                value = event.get(eventsKey)
                if not value and self.DTO_DEFAULT_VALUE.get(eventsKey):
                    value = self.DTO_DEFAULT_VALUE.get(eventsKey)(event)
                event[eventsKey] = value
            # do a pluck on the 'approved' field only,
            dto.append({key: event[key] for key in self.DTO_FIELD})
        return dto

    def errorResult(self, message):
        result = {'error': message}
        return result

    def parseArg(self, arg):
        try:
            arg = json.loads(arg)
        except Exception:
            raise Exception(["Payload must be a json parseable string, JSON Object, or JSON List"])
        return arg

    def isPost(self, arg):
        if arg.get('method') == 'POST':
            return True

    def handle(self, arg):
        try:
            arg = self.parseArg(arg)
            if not self.isPost(arg):
                raise Exception(["Request has to be a POST"])

            self.getDeploymentID(arg['cookies'])
            if not self.deploymentID:
                raise Exception(["You are not opted in"])

            events = self.normalizePayload(arg.get('payload'))
            field = self.missingParams(events)
            if field:
                raise Exception(field)

            events = self.bundleDto(events)

            if events:
                sd = SendData(deploymentID=self.deploymentID, deliverySchema=self.deliverySchema)
                try:
                    sd.send_data(events, sleep=0)
                    return {'payload': json.dumps(events),
                            'status': 200}
                except Exception:
                    raise Exception(['Could not communicate with the CDS'])
            else:
                raise Exception("Must not send and empty event")
        except Exception as e:
            return {'payload': json.dumps(self.errorResult(e.args[0])),
                    'status': 400}
