"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
Module which contains helper functions for UDF subscriptions
"""
from spacebridgeapp.udf.udf_data import UdfDataSource
from spacebridgeapp.data.dashboard_data import Search
from spacebridgeapp.dashboard.util import string_to_refresh_type

OPTIONS = 'options'
QUERY_PARAMETERS = 'queryParameters'
REF = 'ref'
APP = 'app'
EXTEND = 'extend'
QUERY = 'query'
REFRESH = 'refresh'
REFRESH_TYPE = 'refreshType'
EARLIEST = 'earliest'
LATEST = 'latest'
TYPE = 'type'
GLOBAL = 'global'
DATA_SOURCES = 'dataSources'
INPUTS = 'inputs'
TOKEN = 'token'
DEFAULT_VALUE = 'defaultValue'
DS_TEST = 'ds.test'
INPUT_TIME_RANGE = 'input.timerange'


def create_search_from_data_source(udf_data_source: UdfDataSource, defaults_json: dict) -> Search:
    """
    Take a data source object, extract out parameters such as search query, earliest, latest, etc. and creates
    a search object

    :param udf_data_source: The datasource object
    :param defaults_json: The default datasource values
    :return: Search object
    """
    # Short circuit here, don't create Search if udf_data_source is None
    if not udf_data_source:
        return None

    ds_jsn = udf_data_source.json
    datasource_type = ds_jsn.get(TYPE, "")

    if datasource_type != DS_TEST:
        defaults_map = defaults_map_for_data_source_type(defaults_json, datasource_type)
        options_map = _add_override_options(ds_jsn, defaults_map)

        return Search(
            id=udf_data_source.data_source_id,
            ref=options_map.get(REF, ""),
            app=options_map.get(APP, ""),
            base=options_map.get(EXTEND, ""),
            earliest=options_map.get(EARLIEST, ""),
            latest=options_map.get(LATEST, ""),
            refresh=options_map.get(REFRESH, ""),
            refresh_type=string_to_refresh_type(options_map.get(REFRESH_TYPE, "")),
            query=options_map.get(QUERY, "")
        )
    # We don't create a Search object for ds.test
    return None


def defaults_map_for_data_source_type(defaults_json, datasource_type):
    """
    This function will create a map of defaults given a defaultsJson and datasource_type
    :param defaults_json:
    :param datasource_type:
    :return:
    """
    defaults_map = {}
    if defaults_json and datasource_type:
        data_sources = defaults_json.get(DATA_SOURCES, {})

        for default_type in [GLOBAL, datasource_type]:
            params = data_sources.get(default_type, {})
            _add_override_options(params, defaults_map)
    return defaults_map


def _add_override_options(jsn, options_map):
    """
    Helper method to add/override params from existing options_map
    :param jsn:
    :param options_map:
    :return:
    """
    if jsn:
        options = jsn.get(OPTIONS, {})
        for key, value in options.items():
            if isinstance(value, dict):
                for k, v in value.items():
                    options_map[k] = v
            else:
                options_map[key] = value
    return options_map


def get_default_input_token_map(inputs_json):
    """
    Helper to get a map ot input_tokens to default values from a UDF inputs_json
    :param inputs_json: UDF inputs_json
    :return: map of input_token to default value
    """
    input_defaults_map = {}
    if inputs_json:
        for input_obj in inputs_json.values():
            options = input_obj.get(OPTIONS, {})
            token = options.get(TOKEN)
            default_value = str(options.get(DEFAULT_VALUE))
            if token is not None and default_value is not None:
                input_type = input_obj.get(TYPE)
                if input_type == INPUT_TIME_RANGE:
                    earliest, latest = map(str.strip, default_value.split(','))
                    input_defaults_map[f"{token}.{EARLIEST}"] = earliest
                    input_defaults_map[f"{token}.{LATEST}"] = latest
                else:
                    input_defaults_map[token] = default_value
    return input_defaults_map

