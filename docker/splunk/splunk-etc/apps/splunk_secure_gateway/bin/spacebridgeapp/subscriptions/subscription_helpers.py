"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Helper methods used by subscriptions
"""

import hashlib
import re
import math
import time

from spacebridgeapp.logging import setup_logging

from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_subscription_helpers.log",
                       "subscription_helpers")

NUMBER_INDEX = 1
MULTIPLIER_INDEX = 2

REFRESH_MULTIPLIER = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
    'sec': 1
}

# 10 min in seconds, if search is in processing state for over 10 min we remove the search
SEARCH_UPDATE_THRESHOLD = 600


def _time_segment_seconds():
    """
    Generates unix-ish timestamp that represents the current 15-second block since the epoch
    :return:
    """
    unix_time = int(time.time())
    return int(unix_time / 15) * 15


def generate_search_hash(dashboard_id,
                         search_id,
                         input_tokens,
                         user,
                         refresh_interval,
                         ):
    """
    Creates a unique identifier for a "search".  The input parameters are what defines a unique, non-reusable, search.

    :param dashboard_id: The "namespace" of the search within the namespace, most commonly the dashboard id in the case
                         of a visualization subscribe.
    :param search_id: A unique identifier for the search.  In most cases this will be the visualization id, but it can
                      be any unique identifier within a "dashboard"
    :param input_tokens: Input token names and values that will be supplied to the search.
    :param refresh_interval: If Falsy (meaning search will not refresh), the generated identifier is guaranteed to be
                             unique.  Otherwise the value is used as-is
    :param user:  The name of the user creating the search.  Used to allow reuse of searches for the same user but
                  prevent search reuse across different users.
    :return: A string representing the identifier for this search
    """
    shard_id = None # see if omitting the shard id allows reuse across SHC members
    input_token_string = ''

    uniqueness_key = None

    if not refresh_interval:
        # if there is no refresh interval we want a new search job per subscription
        uniqueness_key = _time_segment_seconds()

    if input_tokens is not None:
        for key in sorted(input_tokens.keys()):
            input_token_string = "{}/{}/{}".format(input_token_string, key, input_tokens[key])

    search_pairs = ['dashboard_id', dashboard_id, 'search_id', search_id,
                    'input_token_string', input_token_string, 'user', user,
                    'shard_id', shard_id, 'refresh_interval', refresh_interval,
                    'uniqueness_key', uniqueness_key]

    search_str = [str(v) for v in search_pairs]

    search_string = ",".join(search_str)
    return hashlib.sha256(search_string.encode('utf-8')).hexdigest()


def refresh_to_seconds(refresh: str) -> str:
    """
    Convert a dashboard refresh string to seconds

    1s = 1 seconds
    1m = 60 seconds
    1h = 3600 seconds
    1d = 86400 seconds

    :param refresh:
    :return:
    """
    number_regex = '(\d+\.?\d*)'
    number_match_regex = '(^\d+\.?\d*([dhsm]|sec)?$)'

    if not re.match(number_match_regex, refresh.strip()):
        return ''

    try:
        refresh_split = re.split(number_regex, refresh.strip())

        # Set Multiplier
        multiplier_key = refresh_split[MULTIPLIER_INDEX]
        if multiplier_key in REFRESH_MULTIPLIER:
            multiplier = REFRESH_MULTIPLIER[multiplier_key]
        else:
            # If Multiplier not found set to seconds
            multiplier = REFRESH_MULTIPLIER['s']

        # Calculate the number of seconds
        refresh_float = float(refresh_split[NUMBER_INDEX]) * multiplier

        # Round to a single decimal place
        refresh_round = round(refresh_float, 1)
        refresh_decimal, refresh_int = math.modf(refresh_float)

        result = str(int(refresh_int))

        if refresh_decimal > 0:
            result = str(refresh_round)

        if float(result) == 0:
            result = ''

        return result
    except (IndexError, ValueError, AttributeError, TypeError):
        # if anything goes wrong processing the refresh, we ignore the refresh, like web does
        LOGGER.exception(f'An error occurred processing refresh_value={refresh}. This value was ignored.')
        return ''
