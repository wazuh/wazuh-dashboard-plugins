import logging
import traceback
import os
import sys
import json
import datetime
from zipfile import ZipFile, ZIP_DEFLATED
from string import Template
import base64
from splunk.persistconn.application import PersistentServerConnectionApplication
import splunk.rest
import splunk.auth
import splunk.entity as en

if sys.version_info >= (3, 0):
    from io import BytesIO as ZipIO
else:
    from cStringIO import StringIO as ZipIO

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s',
                    filename=os.path.join(os.environ.get('SPLUNK_HOME'), 'var', 'log', 'splunk',
                                          'splunk_instrumentation.log'),
                    filemode='a')

# logger = logging.getLogger(__name__)
# Unfortunately, __name__ is something like
# pschand__instrumentation_controller__in_C__Program_Files_Splunk_etc_apps_splunk_instrumentation_bin_splunk_instrumentation
# when this script is run by PersistentServerConnectionApplication, so it's hard-coded here.
logger = logging.getLogger('instrumentation_controller')

logger.setLevel(logging.INFO)

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)

path = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + '/../../bin')
sys.path.append(path)

try:
    import splunk_instrumentation.client_eligibility as client_eligibility
    from splunk_instrumentation.service_bundle import ServiceBundle
    from splunk_instrumentation.splunkd import Splunkd
    import splunk_instrumentation.metrics.instance_profile as si_instance_profile
    import splunk_instrumentation.packager as si_packager
except Exception:
    raise


class InstrumentationRestHandler(PersistentServerConnectionApplication):

    def __init__(self,
                 command_line=None,
                 command_arg=None,
                 entity=None,
                 services=None,
                 system_services=None,
                 packager=None,
                 instance_profile=None):
        PersistentServerConnectionApplication.__init__(self)
        self.deploymentID = ''
        self.session = None
        self.server_uri = ''

        self.command_line = command_line
        self.command_arg = command_arg
        self.en = entity or en
        self.services = services
        self.system_services = system_services
        self.packager = packager or si_packager
        self.instance_profile = instance_profile or si_instance_profile

    def splunkrc(self):
        return {
            'token': self.session['authtoken'],
            'server_uri': splunk.rest.makeSplunkdUri()
        }

    def system_splunkrc(self):
        return {
            'token': self.system_authtoken,
            'server_uri': splunk.rest.makeSplunkdUri()
        }

    def parse_arg(self, arg):
        try:
            arg = json.loads(arg)
        except Exception:
            raise Exception(["Payload must be a json parsable string"])
        return arg

    def get_query(self, arg, key):
        for value in (arg['query'] or []):
            if key == value[0]:
                return value[1]

    def get_earliest_and_latest(self, **kwargs):
        self.assert_earliest_and_latest_provided(**kwargs)
        return self.timestamp_to_internal_repr(kwargs.get('earliest'), kwargs.get('latest'))

    def assert_earliest_and_latest_provided(self, **kwargs):
        if not kwargs.get('earliest') or not kwargs.get('latest'):
            raise Exception("earliest and latest query params are required")

    def timestamp_to_internal_repr(self, *args):
        result = []
        for arg in args:
            # the arguments passed in are sting with format of <year>-<month>-<day> ex 2016-3-4
            # the conversion is done by hand instead of strptime because of the lack of padding
            # on date and month
            date_array = arg.split("-")
            result.append(datetime.date(year=int(date_array[0]), month=int(date_array[1]), day=int(date_array[2])))

        if len(result) == 1:
            return result[0]
        else:
            return result

    def check_telemetry_authorization(self, path):
        # For a free license (where there are no users), there's nothing to check.
        if self.services.server_info_service.content.get('isFree', '0') == '1':
            return

        if self.session is None:
            raise splunk.RESTException(500, "No session found.")
        logger.debug('username = %s' % self.session['user'])
        userentity = self.en.getEntity('authentication/users', self.session['user'],
                                       sessionKey=self.session['authtoken'])
        logger.debug('userentity.properties["capabilities"] = %s' % userentity.properties['capabilities'])

        if 'edit_telemetry_settings' not in userentity.properties['capabilities']:
            logger.error('Access denied for path "%s". Returning 404. Insufficient user permissions' % path)
            raise splunk.RESTException(404)

    def get_instrumentation_eligibility(self, optInVersion=None, **kwargs):
        '''
        Determines whether the UI for the instrumentation app should be visible,
        including the initial opt-in modal and all settings/logs pages.
        This is determined by user capabilities, license type, and server roles.
        '''

        if self.session is None:
            raise splunk.RESTException(500, "No session found.")

        result = client_eligibility.get_eligibility(
            self.system_services,
            username=self.session['user'],
            opt_in_version=optInVersion
        )

        return json.dumps(result)

    def response_to_eligibility_request(self, arg):
        return {
            'payload': self.get_instrumentation_eligibility(**dict(arg['query'])),
            'headers': {
                'Content-Type': 'application/json'
            },
            'status': 200
        }

    def response_to_export_request(self, path, visibility, arg):
        self.check_telemetry_authorization(path)
        if arg['method'] != 'GET':
            return {'payload': 'Only GET is allowed for /%s.' % path, 'status': 405}
        usage_data = UsageData(True, visibility, self.splunkrc(), self.packager,
                               self.instance_profile, **dict(arg['query']))

        # Need to do base64 encoding, since zip files are a binary format.
        base64_payload = base64.b64encode(usage_data.payload())
        if sys.version_info > (3, 0):
            base64_payload = base64_payload.decode()
            
        return {
            'payload_base64': base64_payload,
            'headers': {
                'Content-Type': usage_data.content_type(),
                'Content-Disposition': 'attachment; filename="%s"' % usage_data.filename()
            },
            'status': 200
        }

    def response_to_send_request(self, path, visibility, arg):
        self.check_telemetry_authorization(path)
        if arg['method'] != 'POST':
            return {'payload': 'Only POST is allowed for /%s.' % path, 'status': 405}
        usage_data = UsageData(False, visibility, self.splunkrc(), self.packager,
                               self.instance_profile, **dict(arg['query']))
        usage_data.send()
        return {
            'payload': usage_data.payload(),
            'status': 200
        }

    def handle(self, arg):
        '''
        Takes the parsed request data passed by splunkd to
        PersistentServerConnectionApplication.handle and returns a response.
        :param arg: JSON object
        :return: JSON object
        '''

        arg = self.parse_arg(arg)
        logger.debug('arg = %s' % json.dumps(arg))
        if 'query' not in arg:
            arg['query'] = []

        try:
            if 'session' not in arg:
                raise splunk.RESTException(500, "No session found.")
            self.session = arg['session']

            if 'system_authtoken' not in arg:
                raise splunk.RESTException(500, "No system auth token found.")
            self.system_authtoken = arg['system_authtoken']

            if self.services:
                self.splunkd = self.services.splunkd
            else:
                self.splunkd = Splunkd(**self.splunkrc())
                self.services = ServiceBundle(self.splunkd)

            if not self.system_services:
                splunkd = Splunkd(**self.system_splunkrc())
                self.system_services = ServiceBundle(splunkd)

            usage_data_endpoint_table = {
                'anonymous_usage_data': {'visibility': 'anonymous', 'action': 'export'},
                'license_usage_data': {'visibility': 'license', 'action': 'export'},
                'support_usage_data': {'visibility': 'support', 'action': 'export'},
                'send_anonymous_usage_data': {'visibility': 'anonymous', 'action': 'send'},
                'send_license_usage_data': {'visibility': 'license', 'action': 'send'},
                'send_support_usage_data': {'visibility': 'support', 'action': 'send'}
            }

            path = arg['path_info']
            if path == 'instrumentation_eligibility':
                return self.response_to_eligibility_request(arg)
            elif path in usage_data_endpoint_table:
                visibility = usage_data_endpoint_table[path]['visibility']
                if (usage_data_endpoint_table[path]['action'] == 'export'):
                    return self.response_to_export_request(path, visibility, arg)
                else:
                    return self.response_to_send_request(path, visibility, arg)
            else:
                return {
                    'payload': '"%s" not found' % path,
                    'status': 404,
                    'headers': {
                        'Content-Type': 'text/plain'
                    }
                }

        except splunk.RESTException as e:
            logger.error(e)
            return {'payload': 'Exception caught: %s' % e.msg, 'status': e.statusCode}
        except Exception as e:
            logger.error('ERROR: ' + traceback.format_exc())
            return {'payload': traceback.format_exception_only(type(e), e)[-1], 'status': 500}


class UsageData(object):

    _data_types_by_visibility = {
        'anonymous': 'Diagnostic',
        'license': 'License Usage',
        'support': 'Support Usage'
    }

    def __init__(self, forExport, visibility, splunkrc, packager, instance_profile, **kwargs):
        self.visibility = visibility
        self.splunkrc = splunkrc
        self.packager = packager
        self.instance_profile = instance_profile

        try:
            self.earliest, self.latest = self.get_earliest_and_latest(**kwargs)
            if self.isMoreThanOneYear():
                logger.error("Date range must be less than 1 year.")
                raise splunk.RESTException(403, "Date range must be less than 1 year.")

            self.events = self.get_events_package(forExport)
            if forExport:
                data_type = UsageData._data_types_by_visibility[self.visibility]
                self.zip_file_name, json_file_name = self.get_file_names(data_type)
                value = self.get_file_content()
                zipped_payload = self.zip_compress(json_file_name, value)
                self._payload = zipped_payload
            else:
                self._payload = '{"sent_count": %d}' % len(self.events)
        except Exception as e:
            logger.exception(e)
            raise

    def send(self):
        if self.events:
            self.send_events_package()

    def get_events_package(self, forExport=False):
        _packager = self.packager.Packager(splunkrc=self.splunkrc)
        return _packager.build_package(self.earliest, self.latest, [self.visibility], forExport)

    def send_events_package(self):
        _packager = self.packager.Packager(splunkrc=self.splunkrc)
        _packager.manual_send_package(self.events, self.earliest, self.latest, [self.visibility])

    def get_earliest_and_latest(self, **kwargs):
        self.assert_earliest_and_latest_provided(**kwargs)
        return self.timestamp_to_internal_repr(kwargs.get('earliest'), kwargs.get('latest'))

    def assert_earliest_and_latest_provided(self, **kwargs):
        if not kwargs.get('earliest') or not kwargs.get('latest'):
            raise Exception("earliest and latest query params are required")

    def timestamp_to_internal_repr(self, *args):
        result = []
        for arg in args:
            # the arguments passed in are sting with format of <year>-<month>-<day> ex 2016-3-4
            # the conversion is done by hand instead of strptime because of the lack of padding
            # on date and month
            date_array = arg.split("-")
            result.append(datetime.date(year=int(date_array[0]), month=int(date_array[1]), day=int(date_array[2])))

        if len(result) == 1:
            return result[0]
        else:
            return result

    def get_file_names(self, data_type, file_type=['zip', 'json']):
        filename = Template('%s Data - %s to %s.$filename' % (
            data_type,
            ('%d.%02d.%02d' % (self.earliest.year, self.earliest.month, self.earliest.day)),
            ('%d.%02d.%02d' % (self.latest.year, self.latest.month, self.latest.day))
        ))
        return [filename.substitute(filename=ft) for ft in file_type]

    def zip_compress(self, json_file_name, value):
        temp = ZipIO()
        with ZipFile(temp, 'w', ZIP_DEFLATED) as myzip:
            myzip.writestr(json_file_name, value)
        return temp.getvalue()

    def get_file_content(self):
        _packager = self.packager.Packager(splunkrc=self.splunkrc)
        _instance_profile = self.instance_profile.get_instance_profile(splunkrc=self.splunkrc)
        deployment_id = _instance_profile.get_deployment_id()
        transaction_id = _packager.get_transactionID()
        value = self.get_events_package(forExport=True)

        ret_value = {
            "deploymentID": deployment_id,
            "transactionID": transaction_id,
            "data": value}
        return json.dumps(ret_value)

    def isMoreThanOneYear(self):
        copyEarliest = self.earliest.replace(year=self.earliest.year + 1)
        if self.latest > copyEarliest:
            return True
        return False

    def payload(self):
        return self._payload

    def content_type(self):
        return 'application/zip'

    def filename(self):
        return self.zip_file_name
