/*
 * Wazuh app - Specific methods to fetch Wazuh overview data from Elasticsearch
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
import { WAZUH_ALERTS_PATTERN } from '../../../common/constants';
import { raw } from 'joi';
import { getNonExistingReferenceAsKeys } from 'src/core/server/saved_objects/import/validate_references';

interface AlertsSummarySetup {
  title?: string;
  aggs: any
}

export default class alertsSummary {
  constructor(
    context,
    gte,
    lte,
    filters,
    AlertsSummarySetup: AlertsSummarySetup,
    pattern = WAZUH_ALERTS_PATTERN
  ) {

    this._context = context;
    this._pattern = pattern;
    this._base = { aggs: {} };
    Object.assign(this._base, Base(pattern, filters, gte, lte));

    // Object.assign(base.aggs, AlertsSummarySetup.aggs);

    Object.assign(this._base.aggs, {
      "2": {
        terms: {
          field: "rule.id",
          order: {
            _count: "desc"
          },
          size: 100
        },
        aggs: {
          "3": {
            terms: {
              field: "rule.description",
              order: {
                _count: "desc"
              },
              size: 20
            },
            aggs: {
              "4": {
                terms: {
                  field: "rule.level",
                  order: {
                    _count: "desc"
                  },
                  size: 12
                }
              }
            }
          }
        }
      }
    });

    // base.query.bool.must.push({
    //   match_phrase: {
    //     'rule.level': {
    //       query: 15
    //     }
    //   }
    // });

  }
  // {
  //   title: 'Alerts summary',
  //   columns: ['Rule ID','Description','Level', 'Count'],
  //   rows: [
  //     ['502', 'Ossec server started', 3, 22],
  //     ['502', 'Ossec server started', 3, 22],
  //   ]
  // }
  rows = [];

  _formatResponseToTable(rawResponse) {

    const firstKey = parseInt(Object.keys(rawResponse)[0]);
    const rows = rawResponse[firstKey].buckets.map(bucket => {
      const nextKey = firstKey + 1;
      const row = this._buildRow(bucket, nextKey);
      return row;
    })

    return {
      rows
    }
  }

  _buildRow(bucket: any, nextAggKey: number, row: any[] = []): any[] {
    // Push the column value to the row
    row.push(bucket.key);
    // If there is a next aggregation, repeat the process
    if (bucket[nextAggKey.toString()]?.buckets) {
      const newBucket = bucket[nextAggKey.toString()].buckets[0];
      row = this._buildRow(newBucket, (nextAggKey + 1), row);
    }
    // Add the Count as the last item in the row
    else if (bucket.doc_count) {
      row.push(bucket.doc_count);
    }
    return row;
  }

  async fetch() {
    try {
      const response = await this._context.core.elasticsearch.client.asCurrentUser.search({
        index: this._pattern,
        body: this._base
      });
      const alertsTable = this._formatResponseToTable(response.body.aggregations);
      return alertsTable;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
}