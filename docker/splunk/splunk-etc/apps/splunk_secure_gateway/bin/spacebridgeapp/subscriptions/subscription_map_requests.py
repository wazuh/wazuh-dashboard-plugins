"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for subscription_map_requests used by subscription_request_processor
"""


def validate_choropleth_map_params(choropleth_map):
    error_list = []
    if choropleth_map.minX > choropleth_map.maxX:
        error_list.append("minX={} is greater than maxX={}".format(choropleth_map.minX, choropleth_map.maxX))
    if choropleth_map.minY > choropleth_map.maxY:
        error_list.append("minY={} is greater than maxY={}".format(choropleth_map.minY, choropleth_map.maxY))
    return error_list


def construct_cluster_map_post_search(cluster_map):

    post_search = "|geofilter south={} west={} north={} east={} maxclusters={}"\
        .format(cluster_map.south, cluster_map.west, cluster_map.north, cluster_map.east, cluster_map.clusters)
    return post_search


def construct_choropleth_map_post_search(choropleth_map):

    post_search = "|geomfilter min_x={} min_y={} max_x={} max_y={}"\
        .format(choropleth_map.minX, choropleth_map.minY, choropleth_map.maxX, choropleth_map.maxY)

    if choropleth_map.gen != -1.0:
        post_search = "{} gen={}".format(post_search, choropleth_map.gen)

    return post_search


