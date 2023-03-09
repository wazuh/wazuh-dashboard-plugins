import json
import splunk_instrumentation.splunklib.client as splunklib
from future.moves.urllib import parse as urllib_parse


class Splunkd(object):
    '''
    A decorator for a splunkd service object, providing
    convenience methods implemented specifically for this
    application.
    '''

    @classmethod
    def decorate(klass, service):
        if service.__class__ == klass:
            # The service param is already wrapped
            return service
        else:
            # Call the constructor with the pre-existing
            # service handle (invoking wrapper semantics).
            return klass(service=service)

    def __init__(self, **kwargs):
        if kwargs.get('service'):
            # Wrapper semantics
            self.service = kwargs['service']
        elif kwargs.get('token'):
            # Connection by token
            if kwargs.get('server_uri'):
                splunkd = urllib_parse.urlsplit(kwargs.get('server_uri'), allow_fragments=False)
                kwargs['scheme'] = splunkd.scheme
                kwargs['host'] = splunkd.hostname
                kwargs['port'] = splunkd.port
            self.service = splunklib.connect(**kwargs)
        elif kwargs.get('service'):
            self.service = kwargs['service']
        else:
            # Connection by standard auth
            self.service = splunklib.connect(**kwargs)

    def has_index(self, name):
        return self.get_index(name) is not None

    # The normal splunkd.indexes[NAME] method of retrieving
    # an index raises an exception when it does not exist.
    # While a normal dictionary has a `.get` method that simply
    # returns None for DNE, in splunklib this method is used to perform
    # a GET request.
    def get_index(self, name):
        for index in self.service.indexes:
            if index.name == name:
                return index
        return None

    def get_data(self, path_segment, **kwargs):
        return splunklib.data.load(
            self.get(path_segment, **kwargs)
                .get('body')
                .read())

    def get_json(self, *args, **kwargs):
        '''
        Performs a get request for a json response and returns the parsed body
        '''
        return json.loads(
            self.get(*args, output_mode='json', **kwargs).get('body').read())

    def get_json_content(self, *args, **kwargs):
        '''
        Performs a get request for a json response and returns the parsed content
        from the first entry. Useful for endpoints that only ever return one entry.
        '''
        return self.get_json(*args, **kwargs)['entry'][0]['content']

    def __getattr__(self, name):
        return getattr(self.service, name)
