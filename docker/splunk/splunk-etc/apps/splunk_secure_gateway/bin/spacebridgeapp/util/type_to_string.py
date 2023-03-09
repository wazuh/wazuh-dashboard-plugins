"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Helper function to convert different types to UTF-8 Strings
"""


def to_utf8_str(value):
    if isinstance(value, list):
        return list_to_str(value)
    elif value is None:
        return ''
    else:
        return str(value)


def list_to_str(list_of_values):
    return str([str(value) for value in list_of_values])
