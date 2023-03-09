"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Parse Helpers module
"""
from collections import OrderedDict


def to_str(string_or_none):
    """
    Helper to return empty string is string_or_none is None
    :param string_or_none:
    :return: string_or_none if not None, otherwise empty string
    """
    return string_or_none if string_or_none is not None else ''


def get_text(element):
    """
    Helper method to get text field from element as string if element and text are not None
    :param element:
    :return: element.text if not None, otherwise empty string
    """
    return element.text if(element is not None and element.text is not None) else ""


def get_float(element):
    """
    Helper method to get text field from element as float if element and text are not None
    :param element:
    :return: float(element.text) if not None, otherwise float(0)
    """
    return float(element.text) if (element is not None and element.text is not None) else float(0)


def get_int(element, default=0):
    """
    Helper method to get text field from element as int if element and text are not None
    :param element:
    :param default:
    :return: int(element.text) if not None, otherwise default
    """
    return int(element.text) if (element is not None and element.text is not None) else default


def to_token_list(token_list_string):
    """
    Given a depends common separated list return a list of the input token names without dollar signs.
    Validate that the input token is valid before adding to list
    :param token_list_string:
    :return:
    """
    return_list = []
    if token_list_string:
        # remove duplicates from list in order
        return_list = list(OrderedDict.fromkeys([split.strip().strip('$') for split in token_list_string.split(',')]))
    return return_list
