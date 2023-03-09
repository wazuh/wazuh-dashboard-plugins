"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for input token support
"""

import re
import json
from http import HTTPStatus
from spacebridgeapp.util.constants import MAX_TOKEN_CHARACTERS
from spacebridgeapp.data import form_input_data
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError

EARLIEST = 'earliest'
LATEST = 'latest'
DEFAULT_EARLIEST = '0'
DEFAULT_LATEST = ''
BLOCK_LIST = re.compile(r'[|]')


def inject_time_tokens(input_tokens, input_earliest, input_latest):
    """
    This handles special default code for time token with regards to earliest and latest values.

    Implicitly if a time input is defined without a token value it will default to represent the
    values $earliest$ and $latest$

    :param input_tokens:
    :param input_earliest:
    :param input_latest:
    :return:
    """
    global_earliest = input_tokens[EARLIEST] if input_tokens and EARLIEST in input_tokens else DEFAULT_EARLIEST
    global_latest = input_tokens[LATEST] if input_tokens and LATEST in input_tokens else DEFAULT_LATEST
    earliest = inject_tokens_into_string(input_tokens, input_earliest, global_earliest)
    latest = inject_tokens_into_string(input_tokens, input_latest, global_latest)
    return earliest, latest


_INPUT_TOKEN_PATTERN = re.compile(r'\$+(.*?)\$+')
_INPUT_TOKEN_REPLACE = re.compile(r'\$+.*?\$+')


def inject_tokens_into_string(input_tokens, query, default=None):
    """
    Takes a map of input tokens to values and a spl query string and replaces instances of substrings of the form
    $token_name$ with the corresponding token value.

    E.g.
    inject_tokens_into_search({'app':'spacebridge'}, 'app=$app$') -> 'app=spacebridge'

    :param input_tokens: Map[String, String] of token name and token value
    :param query: [String] SPL Query
    :param default: [String] Default value for missing input_tokens
    :return: [String] Transformed SPL query
    """
    if input_tokens is None:
        input_tokens = {}

    # Return the default value if query is not defined
    if not query and default is not None:
        return default

    # Parse for tokens in query update missing input_tokens with default_value if specified, otherwise return original

    transformed_query = ''
    remaining_query = query
    while len(remaining_query) > 0:
        result = _INPUT_TOKEN_PATTERN.search(remaining_query)
        if result:
            token = result.group(1)
            split_index = remaining_query.find(result.group(0)) + len(result.group(0))
            token_query = remaining_query[:split_index]
            remaining_query = remaining_query[split_index:]

            # Check if token ends with '|s' then we should wrap the value in quotation marks
            wrap_with_quotations = False
            if token.endswith('|s'):
                wrap_with_quotations = True
                token = token[:-2]  # slice off the '|s'

            # Check is token is even in input_token keys
            if token in input_tokens.keys() and is_valid_token(input_tokens[token]):
                if wrap_with_quotations:
                    input_token = '"{}"'.format(input_tokens[token])
                else:
                    input_token = input_tokens[token]
                token_query = _INPUT_TOKEN_REPLACE.sub(input_token, token_query)
            elif default is not None:
                token_query = _INPUT_TOKEN_REPLACE.sub(default, token_query)
            transformed_query += token_query
        else:
            transformed_query += remaining_query
            break

    return transformed_query


def get_tokens_for_search(string):
    """
    Takes a string and finds all input tokens within that string
    :param string: [String] String with input tokens
    :return:
    """
    if not string:
        return []

    # Parse for tokens in string
    remaining_string = string
    search_tokens = []
    while len(remaining_string) > 0:
        result = _INPUT_TOKEN_PATTERN.search(remaining_string)
        if result:
            token = result.group(1)
            search_tokens.append(token)
            split_index = remaining_string.find(result.group(0)) + len(result.group(0))
            remaining_string = remaining_string[split_index:]
        else:
            break

    return search_tokens


def is_valid_token(token):
    """
    Check if input token is valid. Ensure it doesn't contain characters in BLOCK_LIST
    """
    if len(token) >= MAX_TOKEN_CHARACTERS:
        raise SpacebridgeApiRequestError(
            message='Input token value="{}" exceeds character limit of {}.'.format(token, MAX_TOKEN_CHARACTERS),
            status_code=HTTPStatus.BAD_REQUEST)

    if BLOCK_LIST.search(token):
        raise SpacebridgeApiRequestError(
            message='Input token value="{}" contains invalid characters.'.format(token),
            status_code=HTTPStatus.BAD_REQUEST)

    return True


def set_default_token_values(input_tokens, input_tokens_meta):
    """
    Populate input tokens with default values if they are not already populated
    :param input_tokens: map of input tokens to values specified by user
    :param input_tokens_meta: list of input token objects which contain default value for each token
    :return: None. modifies the input_tokens object.
    """
    for input_token_schema in input_tokens_meta:

        token_name = input_token_schema.token_name
        if isinstance(input_token_schema.input_type, form_input_data.Timepicker):
            default_earliest = input_token_schema.input_type.default_earliest
            default_latest = input_token_schema.input_type.default_latest
            earliest_tokenname = token_name + ".earliest" if token_name else "earliest"
            latest_tokenname = token_name + ".latest" if token_name else "latest"

            if default_earliest and earliest_tokenname not in input_tokens.keys():
                input_tokens[earliest_tokenname] = default_earliest

            if default_latest and latest_tokenname not in input_tokens.keys():
                input_tokens[latest_tokenname] = default_latest

            continue

        # Default value for the input. If the user does not select or input a value, this value is used.
        # Overrides the initialValue.
        if isinstance(input_token_schema.input_type, form_input_data.FormListInput):
            if input_token_schema.input_type.default_value:
                default_value = input_token_schema.input_type.default_value
            else:
                default_value = input_token_schema.input_type.initial_value
        else:
            default_value = input_token_schema.default_value

        if default_value and token_name not in input_tokens.keys():
            input_tokens[token_name] = default_value


def map_default_token_values(input_tokens, default_input_tokens):
    """
    Helper method to take a default_input_token map and map it to an existing input_tokens map
    :param input_tokens: Existing inputs_tokens map to amend
    :param default_input_tokens: Default input_tokens map use to map onto existing input_tokens
    :return input_tokens dict
    """
    if input_tokens is None:
        input_tokens = {}

    if default_input_tokens:
        for token_name, default_value in default_input_tokens.items():
            if default_value and token_name not in input_tokens:
                input_tokens[token_name] = default_value
    return input_tokens


def load_input_tokens(search_input_tokens_str):
    """
    Helper method to parse search input_tokens json string
    :param search_input_tokens_str:
    :return:
    """
    if search_input_tokens_str is not None:
        input_tokens = json.loads(search_input_tokens_str)
    else:
        input_tokens = {}
    return input_tokens
