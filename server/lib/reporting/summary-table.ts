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
import { getSettingDefaultValue } from '../../../common/services/settings';

interface SummarySetup {
  title: string;
  aggs: any
}

export default class SummaryTable {
  constructor(
    context,
    gte,
    lte,
    filters,
    allowedAgentsFilter,
    summarySetup: SummarySetup,
    pattern = getSettingDefaultValue('pattern')
  ) {

    this._context = context;
    this._pattern = pattern;
    this._summarySetup = summarySetup;
    this._base = { aggs: {} };
    this._columns = [];
    this._rows = [];
    this._title = summarySetup.title;

    Object.assign(this._base, Base(pattern, filters, gte, lte, allowedAgentsFilter));

    this._parseSummarySetup(summarySetup);

  }

  /**
   * Parse the summary table setup to build the query
   * @param summarySetup
   */
  _parseSummarySetup(summarySetup: SummarySetup) {
    let baseAggRef = this._base.aggs;
    summarySetup.aggs.forEach((agg, key) => {
      this._columns.push(agg.customLabel);
      this._parseAggregation(baseAggRef, agg, key);

      if (summarySetup.aggs.length > key + 1) {
        baseAggRef[`${key + 2}`].aggs = {};
        baseAggRef = baseAggRef[`${key + 2}`].aggs;
      } else {
        this._columns.push('Count');
      }
    }, this);
  }

  /**
   * Parse each aggregation to build the query
   * @param baseAggRef
   * @param agg
   * @param key
   */
  _parseAggregation(baseAggRef: any, agg: any, key: string) {
    const { field, size, order, missing } = agg;

    baseAggRef[`${key + 2}`] = {
      terms: {
        field,
        order: {
          _count: order
        },
        size,
      }
    };
    if (missing) {
      baseAggRef[`${key + 2}`].terms.missing = missing;
    }
  }

  /**
   * Returns the response formatted to a table
   * @description The response is an object with the following structure:{
   *  title: 'Alerts summary',
   *  columns: ['Rule ID','Description','Level', 'Count'],
   *  rows: [
   *    ['502', 'Ossec server started', 3, 22],
   *    ['502', 'Ossec server started', 3, 22],
   *  ]
   * }
   * @param rawResponse
   */
  _formatResponseToTable(rawResponse) {
    const firstKey = parseInt(Object.keys(rawResponse)[0]);

    this._rows = rawResponse[firstKey].buckets.reduce((totalRows, bucket) => {
      const nextKey = firstKey + 1;
      this._buildRow(bucket, nextKey, totalRows);
      return totalRows;
    }, []);

    return {
      rows: this._rows,
      columns: this._columns,
      title: this._title,
    }
  }

  /**
   * Makes a row from the response
   * @param bucket
   * @param nextAggKey
   * @param row
   */
  _buildRow(bucket: any, nextAggKey: number, totalRows: any[], row: any[] = []): any[] {
    const newRow = [...row, bucket.key];
    // If there is a next aggregation, repeat the process
    if (bucket[nextAggKey.toString()]?.buckets?.length) {
      bucket[nextAggKey.toString()].buckets.forEach(newBucket => {
        this._buildRow(newBucket, (nextAggKey + 1), totalRows, newRow);
      });
    }
    // Add the Count as the last item in the row
    else if (bucket.doc_count) {
      newRow.push(bucket.doc_count);
      totalRows.push(newRow);
    }
  }

  /**
   * Executes the query and returns the response
   */
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
