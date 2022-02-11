/*
 * Wazuh app - Factory to store visualizations handlers
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
    if (!!VisHandlers.instance) {
      return VisHandlers.instance;
    }
    this.list = [];

    VisHandlers.instance = this;
    return this;
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
  async getAppliedFilters(syscollector) {
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
    let tables = this.list.filter(
      item => (((item || {}).vis || {}).type || {}).name === 'table'
    );
    for (let i = 0; i < tables.length; i++) {
      let tablesData = [];
      const columns = [];
      const title =
        tables[i].vis.title ||
        'Table';
      const item = await tables[i].handler.execution.getData();

      //Normalize visData tables structure for 7.12 retro-compatibility
      if(item.value.visData.tables?.length)
        tablesData = item.value.visData.tables;
      else if(item.value.visData.table)
        tablesData.push(item.value.visData.table);

      for (const table of tablesData) {
        columns.push(...table.columns.map(t => t.name));
      }


      tables[i] = !!(
        tablesData[0] || {}
      ).rows
        ? {
            rows: tablesData[0].rows.map(x => {
              return Object.values(x);
            }),
            title,
            columns
          }
        : false;
    }

    if (this.list && this.list.length) {
      const visualization = this.list[0];

      // Parse current time range
      const { from, to } = visualization.input.timeRange;
      const { query } = visualization.input.query;
      // Parse applied filters for the first visualization
      const filters = visualization.input.filters;

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
