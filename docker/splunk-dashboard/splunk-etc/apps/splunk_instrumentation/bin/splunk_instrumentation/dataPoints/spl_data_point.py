from __future__ import absolute_import
from splunk_instrumentation.dataPoints.data_point import DataPoint
from splunk_instrumentation.dataPoints.data_point import registerDataPoint
from datetime import datetime, date, time
from splunk_instrumentation.indexing.instrumentation_index import InstrumentationIndex
from splunk_instrumentation.datetime_util import date_to_timestamp_str, local


class SPLDataPoint(DataPoint):
    def __init__(self, dataPointSchema, options={}):
        super(SPLDataPoint, self).__init__(dataPointSchema, options)

    def collect(self, dateRange):
        '''
        :param dateRange:  dict("start" : date , "stop" : date)
        :return:
        '''

        saved_search = self.dataPointSchema.dataPointSchema.get('saved_search')
        spl = self.dataPointSchema.dataPointSchema.get('spl')
        if saved_search:
            spl = ' '.join(['|', 'savedsearch', saved_search])

        splunkrc = self.options.get('splunkrc')
        instrumentationIndex = InstrumentationIndex(splunkrc=splunkrc)

        kwargs = {
            "earliest_time": dateRange['start'],
            "latest_time": dateRange['stop']
        }

        if isinstance(kwargs['earliest_time'], date):
            kwargs['earliest_time'] = date_to_timestamp_str(
                datetime.combine(kwargs['earliest_time'], time.min).replace(tzinfo=local))
        if isinstance(kwargs['latest_time'], date):
            kwargs['latest_time'] = date_to_timestamp_str(
                datetime.combine(kwargs['latest_time'], time.max).replace(tzinfo=local))

        events = instrumentationIndex.query_runner.search(spl, **kwargs)

        return events


registerDataPoint(SPLDataPoint)
