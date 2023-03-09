import json
import logging
import sys

from splunk_instrumentation.splunkd import Splunkd
from splunk_instrumentation.constants import SPLUNKRC
from splunk_instrumentation.datetime_util import json_serial
from splunk_instrumentation.constants import INSTRUMENTATION_SOURCETYPE


class EventWriter(object):
    """ Event Writer class
    This class handles writing to the index.
    It grabs a splunkd object according to the splunkrc params provided:
        - If splunkrc is a dictionary, it will create a new splunkd object.
        - If given other object type, it will do do Dependency Injection on _splunkd

    """
    def __init__(self, splunkrc=None, index_name=None):
        self.splunkrc = splunkrc or SPLUNKRC
        self.socket = None
        self._index = None

        if type(self.splunkrc) is dict:
            self._splunkd = Splunkd(**self.splunkrc)
        else:
            self._splunkd = splunkrc

        if index_name:
            if self._splunkd.has_index(index_name):
                self._index = self._splunkd.get_index(index_name)
            else:
                logging.error('ERROR: INDEX IS NOT AVAILABLE')
                raise Exception("ERROR INDEX UNAVAILABLE")

    def submit(self, event, host=None, source=None, sourcetype=INSTRUMENTATION_SOURCETYPE):
        # Note: We used to use the ordinary index.submit method from splunklib,
        #       instead of using a socket. However, that method uses receivers/simple,
        #       an endpoint that bypasses index time field extraction (which we rely on).
        temp_socket = self._index.attach(host=host, source=source, sourcetype=sourcetype)
        temp_socket.send(self.marshal_event(event))
        temp_socket.close()

    def open_socket(self, host=None, source=None, sourcetype=INSTRUMENTATION_SOURCETYPE):
        '''
        Opens a socket to stream events to be indexed, saving it as
        an instance variable for later use when submit_via_socket is called.
        :param host:
        :param source:
        :param sourcetype:
        :return:
        '''
        self.socket = self._index.attach(host=host, source=source, sourcetype=sourcetype)
        return self.socket

    def close_socket(self):
        '''
        Closes socket and set it to none
        '''
        if self.socket:
            self.socket.close()
        self.socket = None

    def submit_via_socket(self, event):
        """
        Submit the event provided using socket connection.
        """
        event = self.marshal_event(event)
        if not self.socket:
            self.open_socket()
        self.socket.send(event)

    @staticmethod
    def marshal_event(event):
        '''
        Marshals the given event into a json string, suitable for passing
        to an open receivers/stream socket.
        '''
        if not isinstance(event, (str, bytes)):
            event = json.dumps(event, default=json_serial)
        if isinstance(event, str) and sys.version_info >= (3, 0):
            event = event.encode()
        return event
