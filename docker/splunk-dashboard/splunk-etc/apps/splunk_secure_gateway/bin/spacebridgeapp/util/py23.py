"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
import base64
import sys
from splunk.clilib.bundle_paths import make_splunkhome_path


def add_python_version_specific_paths():
    sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

    if sys.version_info < (3, 0):
        sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib', 'py2']))
    else:
        sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib', 'py3']))


add_python_version_specific_paths()


def suppress_insecure_https_warnings():
    try:
        import requests
        from requests.packages.urllib3.exceptions import InsecureRequestWarning as RequestsInsecureRequestWarning

        requests.packages.urllib3.disable_warnings(RequestsInsecureRequestWarning)
    except ImportError:
        # it's fine
        pass

    try:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    except ImportError:
        # it's fine
        pass


def b64encode_to_str(string):
    """
    Creates a base 64 encoding. If using python 3, encodes the bytes object as a string


    :param string in python 2, byte string in python 3:
    :return: string
    """
    if sys.version_info < (3, 0):
        return base64.b64encode(string)

    return base64.b64encode(string).decode('ascii')


def urlsafe_b64encode_to_str(string):
    """
    Creates a url safe base 64 encoding. If using python 3, encodes the bytes object as a string
    :param string or bytes object:
    :return: string
    """
    if sys.version_info < (3, 0):
        return base64.urlsafe_b64encode(string)

    return base64.urlsafe_b64encode(string).decode('ascii')

def encode_hex_str(byte_string):
    """
    Encode a string or byte string to hex
    :param byte_string:
    :return: string
    """
    if sys.version_info < (3, 0):
        return byte_string.encode("hex")

    return byte_string.hex()


def encode_unicode_str(string):
    """ If string is python 2 unicode, return utf-8 encoded string, else just return string."""
    if sys.version_info < (3, 0) and isinstance(string, unicode):
        return string.encode('utf-8')

    if isinstance(string, str):
        return string

    raise TypeError("passed in value: {} is not a unicode or string value, it's a {}".format(string, type(string)))


def py2_check_unicode(string):
    """
    Check if string is unicode. In python 3 all strings are unicode.
    :param str:
    :return: boolean
    """

    if sys.version_info >= (3, 0) and isinstance(string, str):
        return True

    if sys.version_info < (3, 0) and isinstance(string, unicode):
        return True

    return False

def running_as_py3():
    return sys.version_info >= (3, 0)

def b64_to_urlsafe_b64(b64encoded_str):
    """Converts a b64 encoded str to its urlsafe counterpart"""

    raw_id = base64.b64decode(str(b64encoded_str))
    return urlsafe_b64encode_to_str(raw_id)

def urlsafe_b64_to_b64(urlsafe_b64encoded_str):
    """Converts an urlsafe b64 encoded str to its b64 encoded counterpart"""
    raw_id = base64.urlsafe_b64decode(str(urlsafe_b64encoded_str))
    return b64encode_to_str(raw_id)
