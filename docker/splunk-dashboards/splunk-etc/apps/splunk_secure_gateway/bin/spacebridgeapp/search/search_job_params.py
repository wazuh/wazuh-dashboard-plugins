"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module use to setup params to pass to search jobs
"""
from spacebridgeapp.util.constants import SAVED_SEARCH_ARGS_PREFIX


def create_search_query(query):
    """
    Helper method to create search_query
    :param query:
    :return:
    """
    # remove leading and trailing whitespace from search
    search_query = query.strip()

    # short-circuit if query is empty
    if not search_query:
        return None

    # If the query doesn't already start with the 'search' operator or another
    # generating command (e.g. "| inputcsv"), then prepend "search " to it.
    if not (search_query.startswith('search') or search_query.startswith("|")):
        search_query = 'search ' + search_query

    return search_query


def create_post_search_query(query):
    """
    Helper method to create post search query
    :param query:
    :return:
    """
    # remove leading and trailing whitespace from search
    post_search_query = query.strip()

    # short-circuit if query is empty
    if not post_search_query:
        return ''

    if not post_search_query.startswith('|'):
        post_search_query = '| %s' % post_search_query

    return post_search_query


def get_search_job_request_params(query,
                                  earliest_time,
                                  latest_time,
                                  exec_mode,
                                  sample_ratio=1,
                                  max_time='60',
                                  status_buckets='0',
                                  sid=None):
    """
    Helper method to return request params for search job
    :param query:
    :param earliest_time:
    :param latest_time:
    :param sample_ratio:
    :param exec_mode:
    :param max_time:
    :param status_buckets:
    :param sid: Optional override for search job sid
    :return:
    """
    params = {}
    if query is not None:

        search_query = create_search_query(query)
        if not search_query:
            return None

        params = {'output_mode': 'json_cols',
                  'auto_cancel': '90',  # job cancels after this many seconds or inactivity
                  'max_time': max_time,  # number of seconds to run search before auto finalizing
                  'status_buckets': status_buckets,  # number of status buckets to generate
                  'time_format': '%FT%T.%Q%:z',  # IOS-8601 format
                  'exec_mode': exec_mode,  # normal runs search asynchronously
                  'count': '10000',  # max number of entries to return
                  'show_metadata': 'true',  # return fields as a list of jsons
                  'preview': 'true',
                  'sample_ratio': str(int(sample_ratio)) if sample_ratio and int(sample_ratio) > 0 else '1',
                  'search': search_query}

        if sid is not None:
            params['id'] = sid

        if earliest_time is not None:
            params['earliest_time'] = earliest_time

        if latest_time is not None:
            params['latest_time'] = latest_time

    return params


def get_dispatch_job_request_params(earliest_time, latest_time, input_tokens=None):
    """
    Helper method to return request params for dispatch

    :param earliest_time:
    :param latest_time:
    :param input_tokens:
    :return:
    """
    params = {'output_mode': 'json',
              'dispatch.auto_cancel': '90',  # job cancels after this many seconds or inactivity
              'dispatch.buckets': '0',  # number of dispatch buckets to generate
              'dispatch.time_format': '%FT%T.%Q%:z',  # IOS-8601 format
              'dispatch.enablePreview': 'true'}

    # expecting args should be args.argname
    # https://docs.splunk.com/Documentation/Splunk/7.2.6/RESTREF/RESTsearch#saved.2Fsearches.2F.7Bname.7D.2Fdispatch
    if isinstance(input_tokens, dict):
        for token_name, value in input_tokens.items():
            if not token_name.startswith(SAVED_SEARCH_ARGS_PREFIX):
                token_name = SAVED_SEARCH_ARGS_PREFIX+token_name
            params[token_name] = value

    # earliest_time and latest_time works in a pair so if one is specified we need to take the other value
    if earliest_time or latest_time:
        params['dispatch.earliest_time'] = earliest_time
        params['dispatch.latest_time'] = latest_time

    return params
