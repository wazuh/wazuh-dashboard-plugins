"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
Data module for UDF objects
"""
import os
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import json
from splapp_protocol import common_pb2
from spacebridgeapp.data.base import SpacebridgeAppBase
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_udf_data.log", "udf_data")


class UdfDataSource(SpacebridgeAppBase):
    """
    Data object for a UDF Data source
    """

    def __init__(self, data_source_id=None, json=None):
        self.data_source_id = data_source_id
        self.name = data_source_id
        self.json = json

    def set_protobuf(self, proto):
        proto.dataSourceId = self.data_source_id
        proto.name = self.name
        proto.json = json.dumps(self.json)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardData
        """
        proto = common_pb2.UDFDataSource()
        self.set_protobuf(proto)
        return proto


class UdfDashboardDescription(SpacebridgeAppBase):
    """
    Dashboard Description object specific to UDF dashboards

    """

    def __init__(self,
                 title=None,
                 description=None,
                 udf_data_sources=None,
                 visualization_json=None,
                 layout_json=None,
                 inputs_json=None,
                 defaults_json=None,
                 dashboard_id=None):

        self.title = title
        self.description = description
        self.udf_data_sources = udf_data_sources
        self.visualization_json = visualization_json
        self.layout_json = layout_json
        self.inputs_json = inputs_json
        self.defaults_json = defaults_json
        self.dashboard_id = dashboard_id

    @staticmethod
    def from_json(jsn):
        udf_dashboard_desc = UdfDashboardDescription()

        if 'title' in jsn:
            udf_dashboard_desc.title = jsn['title']
        if 'description' in jsn:
            udf_dashboard_desc.description = jsn['description']

        if 'dataSources' in jsn:
            udf_dashboard_desc.udf_data_sources = [UdfDataSource(j, jsn['dataSources'][j]) for j in jsn['dataSources']]

        if 'visualizations' in jsn:
            udf_dashboard_desc.visualization_json = jsn['visualizations']

        if 'layout' in jsn:
            udf_dashboard_desc.layout_json = jsn['layout']

        if 'inputs' in jsn:
            udf_dashboard_desc.inputs_json = jsn['inputs']

        if 'defaults' in jsn:
            udf_dashboard_desc.defaults_json = jsn['defaults']

        return udf_dashboard_desc

    def set_protobuf(self, proto):
        """Takes a proto of type DashboardData and populates
         the fields with the corresponding class values

        Arguments:
        :type proto: common_pb2.UdfDashboardDescription
        """
        if self.title:
            proto.title = self.title

        if self.dashboard_id:
            proto.dashboardId = self.dashboard_id

        if self.description:
            proto.description = self.description

        if self.udf_data_sources:
            proto.udfDataSources.extend([udf_data_source.to_protobuf() for udf_data_source in self.udf_data_sources])

        if self.visualization_json:
            proto.visualizationsJson = json.dumps(self.visualization_json)

        if self.layout_json:
            proto.layoutJson = json.dumps(self.layout_json)

        if self.inputs_json:
            proto.inputsJson = json.dumps(self.inputs_json)

        if self.defaults_json:
            proto.defaultsJson = json.dumps(self.defaults_json)

    def to_protobuf(self):
        """returns protobuf representation of this object

        Returns:
            DashboardData
        """
        proto = common_pb2.UDFDashboardDescription()
        self.set_protobuf(proto)
        return proto

    def get_data_source_by_id(self, data_source_id):
        """
        Helper method to get the Search object by data_source_id
        :param data_source_id:
        :return:
        """
        for udf_data_source in self.udf_data_sources:
            if data_source_id == udf_data_source.data_source_id:
                return udf_data_source
        return None
