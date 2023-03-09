from __future__ import absolute_import
from splunk_instrumentation.dataPoints.data_point import DataPoint
from splunk_instrumentation.dataPoints.data_point import registerDataPoint


class MockDataPoint(DataPoint):
    def __init__(self, dataPointSchema, options={}):
        super(MockDataPoint, self).__init__(dataPointSchema, options)

    def collect(self):
        return self.dataPointSchema.dataPointSchema['results']


registerDataPoint(MockDataPoint)
