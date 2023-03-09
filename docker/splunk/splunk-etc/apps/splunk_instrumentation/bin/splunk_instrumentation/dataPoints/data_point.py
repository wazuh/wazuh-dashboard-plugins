
dataPointClasses = []


def dataPointFactory(dataPointSchema, options={}):
    for dataPointClass in dataPointClasses:
        if dataPointClass.__name__ == dataPointSchema.type:
            return dataPointClass(dataPointSchema, options)
    return False


def registerDataPoint(dataPointClass):
    for dataPointClassOther in dataPointClasses:
        if dataPointClass.__name__ == dataPointClassOther.__name__:
            return
    dataPointClasses.append(dataPointClass)


class DataPoint(object):

    def __init__(self, dataPointSchema, options={}):
        self.dataPointSchema = dataPointSchema
        self.options = options or {}
        super(DataPoint, self).__init__()
