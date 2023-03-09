"""
(C) 2019 Splunk Inc. All rights reserved.
"""

import time
import datetime


def get_current_timestamp():
    """
    Helper method to get current timestamp as string
    :return:
    """
    return int(time.time())


def get_expiration_timestamp_str(initial_timestamp=None, ttl_seconds=600):
    """
    Helper method to return the current time plus a ttl_seconds
    :param initial_timestamp:
    :param ttl_seconds: default=600s or 10mins
    :return:
    """
    relative_timestamp = int(initial_timestamp) if initial_timestamp else get_current_timestamp()
    expiration_timestamp = relative_timestamp + int(ttl_seconds)
    return str(expiration_timestamp)


def get_current_timestamp_str():
    """
    Helper method to return the current time
    :return:
    """
    return str(get_current_timestamp())


def is_datetime_expired(datetime_str):
    """
    Helper method to return True if datetime is expired, False otherwise
    :param datetime_str:
    :return:
    """
    if datetime_str:
        datetime_obj = datetime.datetime.fromtimestamp(int(datetime_str))
        return datetime_obj < datetime.datetime.now()
    return False


