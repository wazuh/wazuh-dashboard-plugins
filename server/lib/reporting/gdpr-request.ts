/*
 * Wazuh app - Specific methods to fetch Wazuh GDPR data from Elasticsearch
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
 * Returns top 5 GDPR requirements
 * @param {*} context Endpoint context
 * @param {Number} gte Timestamp (ms) from
 * @param {Number} lte Timestamp (ms) to
 * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
 * @returns {Array<String>}
 */
export const topGDPRRequirements = async (
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
      '2': {
        terms: {
          field: 'rule.gdpr',
          size: 5,
          order: {
            _count: 'desc'
          }
        }
      }
    });

    const response = await context.core.elasticsearch.client.asCurrentUser.search({
      index: pattern,
      body: base
    });
    const { buckets } = response.body.aggregations['2'];

    return buckets.map(item => item.key);
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Returns top 3 rules for specific GDPR requirement
 * @param {*} context Endpoint context
 * @param {Number} gte Timestamp (ms) from
 * @param {Number} lte Timestamp (ms) to
 * @param {String} requirement GDPR requirement. E.g: 'II_5.1.F'
 * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
 * @returns {Array<String>}
 */
export const getRulesByRequirement = async (
  context,
  gte,
  lte,
  filters,
  allowedAgentsFilter,
  requirement,
  pattern = getSettingDefaultValue('pattern')
) => {

  try {
    const base = {};

    Object.assign(base, Base(pattern, filters, gte, lte, allowedAgentsFilter));

    Object.assign(base.aggs, {
      '2': {
        terms: {
          field: 'rule.description',
          size: 3,
          order: {
            _count: 'desc'
          }
        },
        aggs: {
          '3': {
            terms: {
              field: 'rule.id',
              size: 1,
              order: {
                _count: 'desc'
              }
            }
          }
        }
      }
    });

    base.query.bool.filter.push({
      match_phrase: {
        'rule.gdpr': {
          query: requirement
        }
      }
    });

    const response = await context.core.elasticsearch.client.asCurrentUser.search({
      index: pattern,
      body: base
    });
    const { buckets } = response.body.aggregations['2'];
    return buckets.reduce((accum, bucket) => {
      if (
        !bucket ||
        !bucket['3'] ||
        !bucket['3'].buckets ||
        !bucket['3'].buckets[0] ||
        !bucket['3'].buckets[0].key ||
        !bucket.key
      ) {
        return accum;
      };
      accum.push({ ruleID: bucket['3'].buckets[0].key, ruleDescription: bucket.key });
      return accum;
    }, []);
  } catch (error) {
    return Promise.reject(error);
  }
}
