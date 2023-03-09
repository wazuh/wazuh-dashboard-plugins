"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module to process Trellis VisualizationData Transforms
"""
from spacebridgeapp.data.dashboard_data import VisualizationData, TrellisVisualizationData, TrellisCells, Column
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
import re

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_process_trellis.log", "process_trellis")

SPLITBY_FIELD = "splitby_field"
SPLITBY_VALUE = "splitby_value"
DATA_SOURCE = "data_source"
GROUPBY_RANK = "groupby_rank"
NAME = "name"


def process_trellis_format(search, visualization_data):
    """
    Formats Trellis visualization type
    :param search: Search object
    :param visualization_data: data set returned from Splunk
    :return: List of VisualizationData
    """
    trellis_split_by = search.trellis_split_by

    if not visualization_data.field_names or not trellis_split_by:
        return TrellisVisualizationData()

    if trellis_split_by == "_aggregation":
        return process_aggregation_group_by(visualization_data)

    return process_group_by(visualization_data, trellis_split_by)


def _get_split_by_fields_and_values(fields_meta_list):
    """
    Private method that will parse a fields_meta_list into maps of split_by_field to index of values as well as map of
    split_by_value to value.  For example given the following:

    "fields_meta_list": [
        {
          "name": "response_code",
          "groupby_rank": "0"
        },
        {
          "name": "avg(amount): AMEX",
          "data_source": "avg(amount)",
          "splitby_field": "card_provider",
          "splitby_value": "AMEX"
        },
        {
          "name": "avg(amount): DISCOVER",
          "data_source": "avg(amount)",
          "splitby_field": "card_provider",
          "splitby_value": "DISCOVER"
        },
        {
          "name": "count: AMEX",
          "data_source": "count",
          "splitby_field": "card_provider",
          "splitby_value": "AMEX"
        },
        {
          "name": "count: DISCOVER",
          "data_source": "count",
          "splitby_field": "card_provider",
          "splitby_value": "DISCOVER"
        }
    ]

    Result:
    split_by_fields => {
        "response_code" : 0,
        "avg(amount)" : {
            "card_provider" : {
                "AMEX" : 1,
                "DISCOVER": 2
            }
        },
        "count" : {
            "card_provider" : {
                "AMEX" : 3,
                "DISCOVER": 4
            }
        },
    }
    split_by_values => {
        "card_provider": [
            "AMEX", "DISCOVER"
        ]
    }

    :param fields_meta_list:
    :return:
    """
    split_by_fields = {}
    split_by_values = {}
    for index, fields_meta in enumerate(fields_meta_list):
        splitby_field = fields_meta.get(SPLITBY_FIELD)
        splitby_value = fields_meta.get(SPLITBY_VALUE)
        data_source = fields_meta.get(DATA_SOURCE)
        name = fields_meta.get(NAME)
        if splitby_field and splitby_value and data_source:
            # Populate indexes by datasource.splitby_field.splitby_value
            if data_source not in split_by_fields:
                split_by_fields[data_source] = {}
            if splitby_field not in split_by_fields[data_source]:
                split_by_fields[data_source][splitby_field] = {}
            if splitby_value not in split_by_fields[data_source][splitby_field]:
                split_by_fields[data_source][splitby_field][splitby_value] = index
            # Populate splitby_values set by splitby_field
            if splitby_field not in split_by_values:
                split_by_values[splitby_field] = {}
            split_by_values[splitby_field][splitby_value] = 0  # We need an ordered set so use a dict with a 0 value
        else:
            split_by_fields[name] = index
    return split_by_fields, split_by_values


def _get_trellis_cell_values(orig_columns, orig_field_names, split_by_values, trellis_splitby_field):
    """
    Private method that the values used for the trellis cell values
    :param orig_columns:
    :param orig_field_names:
    :param split_by_values:
    :param trellis_splitby_field:
    :return:
    """
    split_by_index = 0
    if trellis_splitby_field:
        if trellis_splitby_field in orig_field_names:
            split_by_index = orig_field_names.index(trellis_splitby_field)
        if trellis_splitby_field in split_by_values:
            return split_by_values[trellis_splitby_field]
    return orig_columns[split_by_index].values


def _get_trellis_fields_data(split_by_fields, split_by_values, orig_fields_meta_list,
                             trellis_splitby_field, splitby_value):
    """
    This private method will calculate the "fields_meta_list" and the "field_names" fields used in the
    VisualizationData object for the TrellisVisualizationData object
    :param split_by_fields:
    :param split_by_values:
    :param orig_fields_meta_list:
    :param trellis_splitby_field:
    :param splitby_value:
    :return:
    """
    # Get Base field names
    base_field_names = list(split_by_values.keys()) + list(split_by_fields.keys())
    if trellis_splitby_field in base_field_names:
        base_field_names.remove(trellis_splitby_field)

    # build fields_meta_list map
    orig_fields_meta_map = {meta[NAME]: meta for meta in orig_fields_meta_list}

    trellis_cell_fields_meta_list = []
    if trellis_splitby_field in split_by_values:
        for index, field_name in enumerate(base_field_names):
            if field_name in orig_fields_meta_map:
                meta_field_name = field_name
            elif splitby_value in orig_fields_meta_map:
                meta_field_name = splitby_value
            else:
                meta_field_name = field_name + ": " + splitby_value
            trellis_cell_fields_meta_list.append(orig_fields_meta_map[meta_field_name])

    else:
        groupby_rank = 0
        for index, field_name in enumerate(base_field_names):
            if field_name in orig_fields_meta_map:
                trellis_cell_fields_meta_list.append(orig_fields_meta_map[field_name])
            elif field_name in split_by_values:
                trellis_cell_fields_meta_list.append({NAME: field_name, GROUPBY_RANK: str(groupby_rank)})
                groupby_rank = groupby_rank + 1
            else:
                trellis_cell_fields_meta_list.append({NAME: field_name, DATA_SOURCE: field_name})

    trellis_cell_field_names = [meta[NAME] for meta in trellis_cell_fields_meta_list]
    return trellis_cell_field_names, trellis_cell_fields_meta_list


def process_group_by(visualization_data, trellis_splitby_field):
    """
    Given VisualizationData and a trellis_splitby_field value, return a TrellisVisualizationData object which is
    comprised of a split of the original VisualizationData split by input trellis_splitby_field.

    This method supports
    1) Default splitby field (No split by value specified)
    2) If a splitby field contains identical field values to group by

    :param visualization_data:
    :param trellis_splitby_field:
    :return:
    """
    orig_field_names = visualization_data.field_names
    orig_columns = visualization_data.columns
    orig_fields_meta_list = visualization_data.fields_meta_list

    # Parse the orig_fields_meta_list to get dicts of indexes and splitby fields values
    split_by_fields, split_by_values = _get_split_by_fields_and_values(orig_fields_meta_list)

    # Gather cells
    trellis_cell_all_values = _get_trellis_cell_values(orig_columns=orig_columns,
                                                       orig_field_names=orig_field_names,
                                                       split_by_values=split_by_values,
                                                       trellis_splitby_field=trellis_splitby_field)
    # list(dict.fromkeys(...)) will return an ordered set as a list, no duplicate values in the trellis cells allowed
    trellis_cells_names = TrellisCells(cells=list(dict.fromkeys(trellis_cell_all_values)))

    # Add Column Values
    trellis_cells = {}
    for trellis_index, trellis_cell_name in enumerate(trellis_cells_names.cells):

        # Gather all fields names and meta for trellis cells
        trellis_cell_field_names, trellis_cell_fields_meta_list = _get_trellis_fields_data(
            split_by_fields=split_by_fields, split_by_values=split_by_values,
            orig_fields_meta_list=orig_fields_meta_list, trellis_splitby_field=trellis_splitby_field,
            splitby_value=trellis_cell_name)

        # initialize columns
        trellis_columns = [Column() for i in range(len(trellis_cell_field_names))]
        trellis_visualization_data = VisualizationData(field_names=trellis_cell_field_names,
                                                       columns=trellis_columns,
                                                       fields_meta_list=trellis_cell_fields_meta_list)
        trellis_cells[trellis_cell_name] = trellis_visualization_data

    # Populate the column values, since we have to consider duplicate values we have to iterate each trellis cell value
    # to determine which visualization_data column list to append the value to
    for cell_index, cell_value in enumerate(trellis_cell_all_values):
        trellis_visualization_data = trellis_cells[cell_value]
        trellis_cell_field_names = trellis_visualization_data.field_names
        # If split_by_values is not empty then VisualizationData has defined a splityby_field, splitby_value field
        if split_by_values:
            # If we are here we are splitting by a splitby_field as defined in a fields_meta object
            # {
            #   "name": "avg(amount): AMEX",
            #   "data_source": "avg(amount)",
            #   "splitby_field": "card_provider",
            #   "splitby_value": "AMEX"
            # }
            if trellis_splitby_field in split_by_values:
                # Iterate the trellis_cell_field_names and determine where we should be looking for column index
                for field_index, field_name in enumerate(trellis_cell_field_names):
                    index = orig_field_names.index(field_name)
                    trellis_visualization_data.columns[field_index].values.extend(orig_columns[index].values)
            else:
                # if trellis_splitby_field is not a splitby_field.  For example the fields_meta object
                # {
                #   "name": "response_code",
                #   "groupby_rank": "0"
                # }
                # Iterate over all fields with a splitby_field value
                for key, list_of_values in split_by_values.items():
                    if key in trellis_cell_field_names:
                        for value in list_of_values:
                            for field_index, field_name in enumerate(trellis_cell_field_names):
                                if key == field_name:
                                    column_value = value
                                else:
                                    index = split_by_fields[field_name][key][value]
                                    column_value = orig_columns[index].values[cell_index]
                                trellis_visualization_data.columns[field_index].values.append(
                                    column_value if column_value else "None")
        else:
            for field_index, field_name in enumerate(trellis_cell_field_names):
                all_field_index = orig_field_names.index(field_name)
                column_value = orig_columns[all_field_index].values[cell_index]
                trellis_visualization_data.columns[field_index].values.append(column_value if column_value else "None")

    trellis_visualization_data = TrellisVisualizationData(trellis_cells=trellis_cells_names,
                                                          visualization_data=list(trellis_cells.values()))
    return trellis_visualization_data


def _get_aggregation_data_sources(fields_meta_list):
    """
    Used for calculating the data_sources used for _aggregration trellis_splitby_field
    :param fields_meta_list:
    :return:
    """
    data_sources = []
    for index, fields_meta in enumerate(fields_meta_list):
        name = fields_meta.get(NAME)
        data_source = fields_meta.get(DATA_SOURCE)
        groupby_rank = fields_meta.get(GROUPBY_RANK)
        # Aggregration data sources are specified as splitby datasource OR groupby_rank not specified
        if data_source:
            data_sources.append(data_source)
        # Fields that start with underscore aren't considered fields we would splitby
        elif not groupby_rank and not name.startswith('_'):
            data_sources.append(name)
    # Return a ordered set as a list this is how it will appear in trellis_cells
    return list(dict.fromkeys(data_sources))


def process_aggregation_group_by(visualization_data):
    """
    Given VisualizationData process trellis splitby _aggregration type.  This function will handle cases where data is:

    1) data_source defined in fields_meta_list
    2) No data_source defined in fields_meta_list

    :param visualization_data:
    :return:
    """
    orig_field_names = visualization_data.field_names
    orig_columns = visualization_data.columns
    orig_fields_meta_list = visualization_data.fields_meta_list

    # Parse the orig_fields_meta_list to get dicts of indexes and splitby fields values
    split_by_fields, split_by_values = _get_split_by_fields_and_values(orig_fields_meta_list)

    # Get Data Sources for aggregation
    aggregation_data_sources = _get_aggregation_data_sources(orig_fields_meta_list)

    trellis_cells = []
    for data_source in aggregation_data_sources:
        trellis_cell_columns = []
        trellis_cell_field_names = []
        trellis_cell_fields_meta_list = []
        for field, value in split_by_fields.items():
            # We only care about the current aggregation data_source and others not in aggregation_data_sources
            if field == data_source or field not in aggregation_data_sources:
                split_by_fields_value = split_by_fields[field]
                # We know from split_by_fields map if value obj is an index there is no splitby_field, splitby_values
                if isinstance(split_by_fields_value, int):
                    column_index = split_by_fields[field]
                    trellis_cell_columns.append(orig_columns[column_index])
                    trellis_cell_field_names.append(orig_field_names[column_index])
                    trellis_cell_fields_meta_list.append(orig_fields_meta_list[column_index])
                # We know from the split_by_fields map that the object format is of the following.
                # "avg(amount)" : {
                #     "card_provider" : {
                #         "AMEX" : 1,
                #         "DISCOVER": 2
                #     }
                # }
                elif isinstance(split_by_fields_value, dict):
                    for splitby_field, splitby_value_map in split_by_fields_value.items():
                        for splitby_value, column_index in splitby_value_map.items():
                            trellis_cell_columns.append(orig_columns[column_index])
                            trellis_cell_field_names.append(orig_field_names[column_index])
                            trellis_cell_fields_meta_list.append(orig_fields_meta_list[column_index])

        trellis_visualization_data = VisualizationData(field_names=trellis_cell_field_names,
                                                       columns=trellis_cell_columns,
                                                       fields_meta_list=trellis_cell_fields_meta_list)
        trellis_cells.append(trellis_visualization_data)

    trellis_cells_names = TrellisCells(cells=aggregation_data_sources)
    trellis_visualization_data = TrellisVisualizationData(trellis_cells=trellis_cells_names,
                                                          visualization_data=trellis_cells)
    return trellis_visualization_data


def get_default_split_by(ast):
    """
    Gets default split by field given a search AST
    :param ast:
    :return: string
    """
    command = ast
    while command is not None:
        if constants.BY_CLAUSE in command:
            by_fields = [field for field in map(parse_by_clause, command.get(constants.BY_CLAUSE))
                         if field is not None and field != constants.TIME_FIELD]
            if len(by_fields) > 0:
                return by_fields[0]

        if command.get(constants.SOURCES) and len(command[constants.SOURCES]) > 0:
            command = command[constants.SOURCES][0]
        else:
            command = None

    return constants.AGGREGATION


def parse_by_clause(by_clause):
    if "args" in by_clause and "field" in by_clause.get("args"):
        return by_clause.get("args").get("field")

    if "name" in by_clause and "function" not in by_clause:
        return by_clause.get("name")

    return None
