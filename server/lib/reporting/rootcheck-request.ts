/*
 * Wazuh app - Specific methods to fetch Wazuh rootcheck data from Elasticsearch
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { Base } from './base-query';
import { getSettingDefaultValue } from '../../../common/services/settings';

/**
 * Returns top 5 rootkits found along all agents
 * @param {*} context Endpoint context
 * @param {Number} gte Timestamp (ms) from
 * @param {Number} lte Timestamp (ms) to
 * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
 * @returns {Array<String>}
 */
export const top5RootkitsDetected = async (
  context,
  gte,
  lte,
  filters,
  allowedAgentsFilter,
  pattern = getSettingDefaultValue('pattern'),
  size = 5
) => {
  try {
    const base = {};

    Object.assign(base, Base(pattern, filters, gte, lte, allowedAgentsFilter));

    Object.assign(base.aggs, {
      '2': {
        terms: {
          field: 'data.title',
          size: size,
          order: {
            _count: 'desc'
          }
        }
      }
    });

    base.query?.bool?.must?.push({
      query_string: {
        query: '"rootkit" AND "detected"'
      }
    });

    const response = await context.core.elasticsearch.client.asCurrentUser.search({
      index: pattern,
      body: base
    });
    const { buckets } = response.body.aggregations['2'];
    const mapped = buckets.map(item => item.key);
    const result = [];

    for (const item of mapped) {
      result.push(item.split("'")[1].split("'")[0]);
    };

    return result.filter((item, pos) => result.indexOf(item) === pos);
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Returns the number of agents that have one or more hidden processes
 * @param {*} context Endpoint context
 * @param {Number} gte Timestamp (ms) from
 * @param {Number} lte Timestamp (ms) to
 * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
 * @returns {Array<String>}
 */
export const agentsWithHiddenPids = async (
  context,
  gte,
  lte,
  filters,
  allowedAgentsFilter,
  pattern = getSettingDefaultValue('pattern')
) => {
  try {
    const base = {};

    Object.assign(base, Base(pattern, filters, gte, lte, allowedAgentsFilter));

    Object.assign(base.aggs, {
      '1': {
        cardinality: {
          field: 'agent.id'
        }
      }
    });

    base.query?.bool?.must?.push({
      query_string: {
        query: '"process" AND "hidden"'
      }
    });

    // "aggregations": { "1": { "value": 1 } }
    const response = await context.core.elasticsearch.client.asCurrentUser.search({
      index: pattern,
      body: base
    });

    return response.body &&
      response.body.aggregations &&
      response.body.aggregations['1'] &&
      response.body.aggregations['1'].value
      ? response.body.aggregations['1'].value
      : 0;
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Returns the number of agents that have one or more hidden ports
 * @param {*} context Endpoint context
 * @param {Number} gte Timestamp (ms) from
 * @param {Number} lte Timestamp (ms) to
 * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
 * @returns {Array<String>}
 */
export const agentsWithHiddenPorts = async (
  context,
  gte,
  lte,
  filters,
  allowedAgentsFilter,
  pattern = getSettingDefaultValue('pattern')
) => {
  try {
    const base = {};

    Object.assign(base, Base(pattern, filters, gte, lte, allowedAgentsFilter));

    Object.assign(base.aggs, {
      '1': {
        cardinality: {
          field: 'agent.id'
        }
      }
    });

    base.query?.bool?.must?.push({
      query_string: {
        query: '"port" AND "hidden"'
      }
    });

    // "aggregations": { "1": { "value": 1 } }
    const response = await context.core.elasticsearch.client.asCurrentUser.search({
      index: pattern,
      body: base
    });

    return response.body &&
      response.body.aggregations &&
      response.body.aggregations['1'] &&
      response.body.aggregations['1'].value
      ? response.body.aggregations['1'].value
      : 0;
  } catch (error) {
    return Promise.reject(error);
  }
}
