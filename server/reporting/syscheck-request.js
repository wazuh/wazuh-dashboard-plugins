/*
 * Wazuh app - Specific methods to fetch Wazuh syscheck data from Elasticsearch
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ElasticWrapper } from '../lib/elastic-wrapper';
import Base from './base-query';

export class SyscheckRequest {
  /**
   * Constructor
   * @param {*} server Hapi.js server object provided by Kibana
   */
  constructor(server) {
    this.wzWrapper = new ElasticWrapper(server);
  }

  /**
   * Returns top 3 dangerous agents
   * @param {Number} gte Timestamp (ms) from
   * @param {Number} lte Timestamp (ms) to
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   * @returns {Array<String>}
   */
  async top3agents(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
    try {
      const base = {};

      Object.assign(base, Base(pattern, filters, gte, lte));

      Object.assign(base.aggs, {
        '2': {
          terms: {
            field: 'agent.id',
            size: 3,
            order: {
              _count: 'desc'
            }
          }
        }
      });

      base.query.bool.must.push({
        range: {
          'rule.level': {
            gte: 7,
            lt: 16
          }
        }
      });

      const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
      const { buckets } = response.aggregations['2'];

      return buckets.map(item => item.key);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Returns top 3 rules
   * @param {Number} gte Timestamp (ms) from
   * @param {Number} lte Timestamp (ms) to
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   * @returns {Array<String>}
   */
  async top3Rules(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
    try {
      const base = {};

      Object.assign(base, Base(pattern, filters, gte, lte));

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

      const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
      const { buckets } = response.aggregations['2'];

      const result = [];
      for (const bucket of buckets) {
        if (
          !bucket ||
          !bucket['3'] ||
          !bucket['3'].buckets ||
          !bucket['3'].buckets[0] ||
          !bucket['3'].buckets[0].key ||
          !bucket.key
        ) {
          continue;
        }
        const ruleId = bucket['3'].buckets[0].key;
        const ruleDescription = bucket.key;
        result.push({ ruleId, ruleDescription });
      }

      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async lastTenDeletedFiles(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
    try {
      const base = {};

      Object.assign(base, Base(pattern, filters, gte, lte));

      Object.assign(base.aggs, {
        '2': {
          terms: {
            field: 'syscheck.path',
            size: 10,
            order: {
              '1': 'desc'
            }
          },
          aggs: {
            '1': {
              max: {
                field: '@timestamp'
              }
            }
          }
        }
      });

      base.query.bool.must.push({
        match_phrase: {
          'syscheck.event': {
            query: 'deleted'
          }
        }
      });

      const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
      const { buckets } = response.aggregations['2'];

      return buckets
        .map(item => {
          return { date: item['1'].value_as_string, path: item.key };
        })
        .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async lastTenModifiedFiles(
    gte,
    lte,
    filters,
    pattern = 'wazuh-alerts-3.x-*'
  ) {
    try {
      const base = {};

      Object.assign(base, Base(pattern, filters, gte, lte));

      Object.assign(base.aggs, {
        '2': {
          terms: {
            field: 'syscheck.path',
            size: 10,
            order: {
              '1': 'desc'
            }
          },
          aggs: {
            '1': {
              max: {
                field: '@timestamp'
              }
            }
          }
        }
      });

      base.query.bool.must.push({
        match_phrase: {
          'syscheck.event': {
            query: 'modified'
          }
        }
      });

      const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
      const { buckets } = response.aggregations['2'];

      return buckets
        .map(item => {
          return { date: item['1'].value_as_string, path: item.key };
        })
        .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
