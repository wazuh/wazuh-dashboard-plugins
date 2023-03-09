#
# THIS FILE IS A COPY OF $SPLUNK_SOURCE/python-site/splunk/vix/splunkio.py
#
import functools
import sys
import csv
if sys.version_info >= (3, 0):
    from io import StringIO
else:
    from cStringIO import StringIO
from builtins import zip, map

# Unsure if this matters or not, but using 6.2.0 for now.
splunkVersion = '6.2.0'
headerLen = '0' # empty header

def _getTransportHeader(body):
    return 'splunk ' + splunkVersion + ',' + headerLen +  ',' + str(len(body)) + '\n'

def _getTransportString(sio):
    body = sio.getvalue()
    return _getTransportHeader(body) + body

def _makeWriterIO(header):
    sio = StringIO()
    writer = csv.DictWriter(sio, header, extrasaction='ignore')
    writer.writerow(dict(zip(header, header)))
    return writer, sio

# Generates splunk's internal format strings, which can be used with 
# commands.conf: generating = stream
def _yieldSplunkStrings(maps, buffersize):
    if len(maps) is 0:
        yield _getTransportHeader('')
    else:
        header = list(set(functools.reduce(lambda acc, x: acc + x, map(lambda m: list(m), maps), [])))
        writer, sio = _makeWriterIO(header)
        hasrows = False
        for m in maps:
            writer.writerow(m)
            hasrows = True
            # flush
            if buffersize < sio.tell():
                yield _getTransportString(sio)
                hasrows = False
                writer, sio = _makeWriterIO(header)
        if hasrows:
            yield _getTransportString(sio)

def write(maps, out=sys.stdout, buffersize=65536):
    """
    Given a list of dicts of key/value pairs, reports each dict as a properly formatted event.
    :param maps: A list of dicts. Each element will be an event.
    :param out: Stream to which the events will be written.
    param buffersize: How many bytes to hold in memory before flushing.
    """
    try:
        for s in _yieldSplunkStrings(maps, buffersize):
            out.write(s)
    finally:
        out.flush()

