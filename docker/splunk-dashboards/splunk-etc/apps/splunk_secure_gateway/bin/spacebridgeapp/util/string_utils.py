import urllib.parse as urllib
"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""


def encode_whitespace(uri):
    """
    Encode spaces in a URI string with percent encoding
    """
    return uri.replace(" ", "%20")


def append_path_to_uri(base_uri, path, encoded=True):
    """
    Appends a path to a given base_uri
    """
    if encoded:
        path = urllib.quote(path)

    return f'{base_uri}/{path}'


def is_not_blank(string):
    """
    Return True if String is not blank or None
    :param string:
    :return:
    """
    return bool(string and string.strip())
