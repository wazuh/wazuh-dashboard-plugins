/*
 * Wazuh app - Factory to store visualizations handlers
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import dateMath from '@elastic/datemath';

export class VisHandlers {
  /**
   * Class constructor
   */
  constructor() {
    this.list = [];
  }

  /**
   * Add given item
   * @param {Object} item
   */
  addItem(item) {
    this.list.push(item);
  }

  /**
   * Get all items
   */
  getList() {
    return this.list;
  }

  /**
   * Get all applied filters
   * @param {*} syscollector
   */
  getAppliedFilters(syscollector) {
    const appliedFilters = {};

    if (syscollector) {
      Object.assign(appliedFilters, {
        filters: syscollector,
        time: {
          from: 'now-1d/d',
          to: 'now'
        },
        searchBar: false,
        tables: []
      });
      return appliedFilters;
    }

    // Check raw response from all rendered tables
    const tables = this.list
      .filter(item => (((item || {}).vis || {}).type || {}).type === 'table')
      .map(item => {
        const columns = [];
         for (const agg of item.vis._state.aggs.filter(x => x.params.customLabel)) {
          columns.push(agg.params.customLabel);
        } 
        const count = item.vis._state.aggs.find(x => !x.params.customLabel);
        columns.push(count.type)

        return !!(((item || {}).vis || {}).searchSource || {}).rawResponse
          ? {
            rawResponse: item.vis.searchSource.rawResponse,
            title:
              item.vis._state.title ||
              item.dataLoader.previousVisState.title ||
              'Table',
            columns
          }
          : false;
      });

    if (this.list && this.list.length) {
      const visualization = this.list[0].vis;

      // Parse current time range
      const { from, to } = visualization.filters.timeRange;
      const { query } = visualization.searchSource._fields.query;
      // Parse applied filters for the first visualization
      const filters = visualization.searchSource._fields.filter;

      Object.assign(appliedFilters, {
        filters,
        time: {
          from: dateMath.parse(from),
          to: dateMath.parse(to)
        },
        searchBar: query,
        tables
      });
    }

    return appliedFilters;
  }

  /**
   * Check if has data
   */
  hasData() {
    for (const item of this.list) {
      if (
        item &&
        item.vis &&
        item.vis.title !== 'Agents status' &&
        ((item.dataLoader || {}).previousVisState || {}).title !==
        'Agents status' &&
        item.vis.searchSource &&
        item.vis.searchSource.rawResponse &&
        item.vis.searchSource.rawResponse.hits &&
        item.vis.searchSource.rawResponse.hits.total
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Remove all visualizations
   */
  removeAll() {
    this.list = [];
  }
}
