from splunk_instrumentation.indexing.instrumentation_index import InstrumentationIndex
from splunk_instrumentation.packager.send_log import SendLog
from splunk_instrumentation.packager.send_data import SendData
import random
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timedelta, time
from splunk_instrumentation.datetime_util import local, utc, utcNow, json_serial
from splunk_instrumentation.metrics.instance_profile import get_instance_profile
import splunk_instrumentation.metrics.metrics_schema as metrics_schema
from splunk_instrumentation.constants import INST_SCHEMA_FILE, INST_EXECUTION_START_TIME
from splunk_instrumentation.packager.quick_draw import get_quick_draw
from splunk_instrumentation.report import report
from splunk_instrumentation.metrics.metrics_transforms import transform_object
from splunk_instrumentation.dataPoints.data_point import dataPointFactory
from splunk_instrumentation.dataPoints.spl_data_point import SPLDataPoint  # noqa
from splunk_instrumentation.dataPoints.report_data_point import ReportDataPoint  # noqa
from splunk_instrumentation.splunklib import binding
from splunk_instrumentation.constants import INTROSPECTION_INDEX_NAME
import os
import json

logger = logging.getLogger(__name__)

dataLogger = logging.getLogger('TelemetryCloudData')
dataLogger.setLevel(logging.INFO)
handler = RotatingFileHandler(os.path.join(os.environ.get('SPLUNK_HOME'), 'var',
                              'log', 'splunk', 'splunk_instrumentation_cloud.log'),
                              mode='a', maxBytes=5000000, backupCount=5)
formatter = logging.Formatter('{"datetime": "%(asctime)s", "log_level": "%(levelname)s", '
                              '"component": "%(name)s", "data": %(message)s}')
handler.setFormatter(formatter)
dataLogger.addHandler(handler)


class Packager(object):
    """ Packager Class.

    This class acts as the gateaway for the data.
    """
    def __init__(
            self, splunkrc=None, deploymentID=None, schema=None, factory=None,
            send_data=None, send_log=None, instance_profile=None,
            quick_draw=None):
        self._splunkrc = splunkrc
        self.deploymentID = deploymentID
        self.transaction_id = None
        if not instance_profile:
            self.instance_profile = get_instance_profile(self._splunkrc)
        else:
            self.instance_profile = instance_profile
        if not schema:
            schema = metrics_schema.load_schema(INST_SCHEMA_FILE, visibility=self.instance_profile.visibility)
        self.schema = schema
        if not factory:
            factory = dataPointFactory
        self.factory = factory
        self.deliverySchema = self.schema.delivery
        if not quick_draw:
            qd = get_quick_draw()
        else:
            qd = quick_draw
        if qd:
            self.deliverySchema.url = qd.get('url')

        self.transaction_id = self.get_transactionID()

        if not send_data:
            self.sd = SendData(
                deploymentID=self.instance_profile.get_deployment_id(),
                deliverySchema=self.deliverySchema,
                transaction_id=self.get_transactionID())
        else:
            self.sd = send_data

        if not send_log:
            self.sl = SendLog(splunkrc=self._splunkrc)
        else:
            self.sl = send_log

        self.result = None
        self.is_cloud = self.instance_profile.server_is_cloud

    def package_send(self, dateRange, index_name=INTROSPECTION_INDEX_NAME):
        """Auto send and log data.

        First we look at our index and check the start, stop, and visibility
        Next we query based on that, and send it.
        """
        visibility = self.instance_profile.visibility
        if visibility is False:
            return False

        time_range = {"start": INST_EXECUTION_START_TIME, "stop": utcNow()}

        events = self._query_events(
            dateRange['start'], dateRange['stop'], visibility, False, time_range=time_range, index_name=index_name)

        if len(events) == 0:
            report.report('send-canceled', True)
            return False
        return self._send_package(events, dateRange['start'], dateRange['stop'], time_range=time_range)

    def manual_send_package(self, events, start, stop, visibility):
        """Handling manually sending package from the UI.

        This is just a wrapper for _send_package
        events = events from index
        start = from datetime picker
        stop = from datetime picker
        visibility = [anonymous, license]
        """

        time_range = {
                "start": datetime.combine(start, time.min).replace(tzinfo=local).astimezone(utc),
                "stop": datetime.combine(stop + timedelta(days=1), time.max).replace(tzinfo=local).astimezone(utc)
            }
        return self._send_package(
            events, start, stop, method='manual', visibility=visibility, time_range=time_range)

    def build_package(self, start, stop, visiblity, forExport=False):
        return self._query_events(
            start, stop, visiblity, forExport)

    def get_transactionID(self):
        if self.transaction_id:
            return self.transaction_id
        allowedCharacters = '0123456789ABCDEF'
        transaction_id = ''.join(random.choice(allowedCharacters) for i in range(8)) + '-' + ''.join(
            random.choice(allowedCharacters) for i in range(4)) + \
            '-' + ''.join(random.choice(allowedCharacters) for i in range(4)) + \
            '-' + ''.join(random.choice(allowedCharacters) for i in range(4)) + \
            '-' + ''.join(random.choice(allowedCharacters) for i in range(12))
        self.transaction_id = transaction_id
        return self.transaction_id

    def _get_visibility(self, events):
        result = {}
        i = get_instance_profile(self._splunkrc)
        visibility = i.visibility

        for event in events:
            vis = event.get('visibility') or []
            for key in vis.split(','):
                if key in visibility:
                    result[key] = True
        return sorted(result.keys())

    def _query_events(
            self, start, stop,
            visibility=[], forExport=False, time_range=None, index_name=INTROSPECTION_INDEX_NAME):
        '''

        :param start:   datetime.date
        :param stop:  datetime.date   can be the same as start
        :param visibility:
        :param forExport: true if this is for export and forces visibility values to visibility field on events
        :param time_range: {start,stop}  the timecode range to limit event _time
        :param index_name: specifies which index to query for telemetry events (default: _introspection)
        :return:
        '''

        if isinstance(start, datetime) or isinstance(stop, datetime):
            raise ("Requires_date_not_datetime")

        i = InstrumentationIndex(splunkrc=self._splunkrc, index_name=index_name)
        result = []

        def process_events(events):
            for data in events:
                self._transform_data(data)
                result.append(data)

        profile = report.start_profiling()

        i.process_new_events(
            start, stop, process_events, visibility=visibility, time_range=time_range)
        report.report("query_telemetry", {"count": len(result)}, profile)
        if forExport:
            result = self._mark_visibility(result, visibility, 'manual')

        return result

    def _transform_data(self, data):
        classDef = self.schema.getEventClassByfield(data['component'])
        if (len(classDef)):
            data['data'] = transform_object(data['data'], classDef[0].fields)

        return data

    def _send_package(
            self, events, start, stop, method='auto', visibility=None, time_range=None):
        """Sending package and log it.

        If offline (or quickdraw not available), log failed to the index.
        If on cloud, log events to splunk_instrumentation_cloud.log, instead of sending to quickdraw
        events = events from index
        start = from datetime picker
        stop = from datetime picker
        method = ['auto', 'manual']
        visibility = [anonymous, license]
        """

        visibility = visibility or self._get_visibility(events)
        count = len(events)
        self.sl.send_attempted(start, stop, visibility=visibility, time_range=time_range, method=method, count=count)
        try:
            events = self._mark_visibility(events, visibility, method)
            if self.is_cloud:
                self.sd.bundle_DTOs(events)
                for event in events:
                    dataLogger.info(json.dumps(event, default=json_serial))
            else:
                if self.deliverySchema.url:
                    self.sd.send_data(events)
                else:
                    raise Exception('Quickdraw is not available')
            self.sl.send_completed(start, stop, visibility=visibility, time_range=time_range, method=method,
                                   count=count)
        except binding.HTTPError as e:
            logger.error(e)
            self.sl.send_failed(start, stop, visibility=visibility, time_range=time_range, method=method, count=None)
            report.report("send_failed", True)
            raise
        except Exception as e:
            logger.error(e)
            self.sl.send_failed(start, stop, visibility=visibility, time_range=time_range, method=method, count=None)
            report.report("send_failed", True)
            raise
        except Exception:
            logger.error("Unknown Error")
            self.sl.send_failed(start, stop, visibility=visibility, time_range=time_range, method=method, count=None)
            report.report("send_failed", True)
            raise

    def _mark_visibility(self, events, visibility, method='auto'):
        """Marking visibility.

        It alters the visibility field according to their choice from the UI
        events = events from index
        visibility = [anonymous, license] from UI
        """
        if method == 'manual':
            for event in events:
                event['visibility'] = ','.join(visibility)
        elif method == 'auto':
            for event in events:
                temp = []
                for vis in event['visibility'].split(','):
                    if vis in visibility:
                        temp.append(vis)
                event['visibility'] = ','.join(temp)
        else:
            raise Exception("Should never reach this.")
        return events
