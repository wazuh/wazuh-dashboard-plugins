"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import time
from datetime import datetime


def get_current_timestamp():
    """
    Helper method to get current timestamp as string
    :return:
    """
    return int(time.time())


def get_expiration_timestamp_str(initial_timestamp=None, ttl_seconds=600):
    """
    Helper method to return the current time plus a ttl_seconds
    :param initial_timestamp: A unix epoch, None defaults to the current time
    :param ttl_seconds: default=600s or 10mins
    :return:
    """
    if not ttl_seconds:
        ttl_seconds = 0

    ttl_seconds_parsed = int(float(ttl_seconds))

    relative_timestamp = int(initial_timestamp) if initial_timestamp else get_current_timestamp()
    expiration_timestamp = relative_timestamp + ttl_seconds_parsed
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
    :param datetime_str: timestamp in ms
    :return:
    """
    if datetime_str:
        # fromtimestamp accepts floats but need to be in seconds
        datetime_obj = datetime.fromtimestamp(int(datetime_str))
        return datetime_obj < datetime.now()
    return False


def day_to_seconds(days):
    """
    Helper method to convert days to seconds
    :param days:
    :return:
    """
    return 86400*days


def hour_to_seconds(hours):
    """
    Helper method to convert days to seconds
    :param hours:
    :return:
    """
    return 3600*hours


def get_current_date():
    return datetime.now().strftime('%Y-%m-%d %H:%M')
