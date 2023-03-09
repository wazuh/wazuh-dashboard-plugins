from __future__ import absolute_import
from splunk_instrumentation.dataPoints.data_point import DataPoint
from splunk_instrumentation.dataPoints.data_point import registerDataPoint
from splunk_instrumentation.datetime_util import localNow
from splunk_instrumentation.report import report


class ReportDataPoint(DataPoint):
    def __init__(self, dataPointSchema, options={}):
        super(ReportDataPoint, self).__init__(dataPointSchema, options)

    def collect(self, dateRange):
        '''
        :param dateRange:  dict("start" : date , "stop" : date)
        :return:
        '''

        def nested_set(dic, path, value):
            array_test = path.split("[")
            array_test = len(array_test) == 2
            keys = path.split(".")
            for key in keys[:-1]:
                dic = dic.setdefault(key, {})

            if array_test:
                dic.setdefault(keys[-1], [])
                dic[keys[-1]].append(value)
            else:
                dic[keys[-1]] = value

        mappings = self.dataPointSchema.dataPointSchema.get('mapping')
        results = {}

        for mapping in mappings:
            path = mapping.get('path')
            report_path = mapping.get('report_path')
            if report_path:
                data = report.get(report_path)
            date_value = mapping.get('date_value')
            if date_value:
                data = localNow().strftime(date_value)

            nested_set(results, path, data)

        eventList = [{"data": results}]

        return eventList


registerDataPoint(ReportDataPoint)
