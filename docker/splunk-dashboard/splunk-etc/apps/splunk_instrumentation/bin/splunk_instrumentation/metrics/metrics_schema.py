from builtins import map
import json


class MetricsSchemaDataPoint(object):
    def __init__(self, dataPointSchema):
        self.dataPointSchema = dataPointSchema

    @property
    def type(self):
        return self.dataPointSchema['type']


class MetricsSchemaClass(object):

    def __init__(self, classSchema):
        self.classSchema = classSchema

    @property
    def component(self):
        return self.classSchema['component']

    @property
    def visibility(self):
        return self.classSchema.get('visibility')

    @property
    def fields(self):
        return self.classSchema.get('fields') or []

    @property
    def on_send(self):
        return self.classSchema.get('on_send') or False

    @property
    def index_fields(self):
        return self.classSchema.get('index_fields') or []

    def getDataPoints(self):
        dataPoints = []
        for dataPoint in self.classSchema['dataPoints']:
            dataPoints.append(MetricsSchemaDataPoint(dataPoint))
        return dataPoints

    def getHashKey(self):
        hash_key = self.classSchema.get('hash_key')
        if hash_key is None:
            hash_key = []
        elif not isinstance(hash_key, list):
            hash_key = [hash_key]
        return hash_key

    def getRoles(self):
        roles = self.classSchema.get('roles')
        # default is to run telemetry data collection on lead node only
        if roles is None:
            roles = ['lead_node']
        elif not isinstance(roles, list):
            roles = [roles]
        return roles


class MetricsDelivery(object):
    def __init__(self, delivery):
        self.delivery = delivery

    @property
    def url(self):
        return self.delivery.get('url')

    @url.setter
    def url(self, url):
        self.delivery['url'] = url

    @property
    def version(self):
        return self.delivery.get('version')


class MetricsSchema(object):

    def __init__(self, schema, visibility=None):
        self.schema = schema
        self.delivery = MetricsDelivery(schema['delivery'])
        self.visibility = visibility

    def getEventClasses(self):
        classes = self.schema['classes']
        return map(MetricsSchemaClass, classes)

    def getEventClassByfield(self, value, fieldname="component", default=None):
        classes = self.schema['classes']
        result = []
        for classDef in classes:
            if classDef.setdefault(fieldname, default) == value and \
               (self.visibility == '*' or
               set(self.visibility).intersection(classDef['visibility'].split(','))):
                result.append(MetricsSchemaClass(classDef))
        return result


def load_schema(schema_file, visibility=None):
    schema = None
    with open(schema_file or "schema.json") as json_file:
        schema = json.load(json_file)
    return MetricsSchema(schema, visibility)
