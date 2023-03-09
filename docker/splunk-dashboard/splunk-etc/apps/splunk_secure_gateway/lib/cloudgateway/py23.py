import os
import sys
import base64

def add_python_version_specific_paths():
    sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib'))

    if sys.version_info < (3, 0):
        sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib/py2'))
    else:
        sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'lib/py3'))


add_python_version_specific_paths()

def b64encode_to_str(string):
    """
    Creates a base 64 encoding. If using python 3, encodes the bytes object as a string


    :param string in python 2, byte string in python 3:
    :return: string
    """
    if sys.version_info < (3, 0):
        return base64.b64encode(string)

    return base64.b64encode(string).decode('ascii')

