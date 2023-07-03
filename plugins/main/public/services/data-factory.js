/*
 * Wazuh app - Wazuh data factory
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export class DataFactory {
  /**
   * Class constructor
   * @param {*} httpClient
   * @param {*} path
   * @param {*} implicitFilter
   */
  constructor(httpClient, path, implicitFilter, implicitSort) {
    this.implicitFilter = implicitFilter || false;
    this.httpClient = httpClient;
    this.items = [];
    this.path = path;
    this.filters = [];
    this.sortDir = false;
    this.busy = false;
    if (this.implicitFilter) this.filters.push(...this.implicitFilter);
    if (implicitSort) this.addSorting(implicitSort);
  }

  /**
   * Add sort value
   * @param {String} value
   */
  addSorting(value) {
    this.sortValue = value;
    this.sortDir = !this.sortDir;
  }

  /**
   * Remove all filters
   */
  removeFilters() {
    this.filters = [];
    if (this.implicitFilter) this.filters.push(...this.implicitFilter);
  }

  /**
   * Serialize filters
   * @param {Object} parameters
   */
  serializeFilters(parameters) {
    if (this.sortValue) {
      parameters.sort = this.sortDir ? '-' + this.sortValue : this.sortValue;
    }

    for (const filter of this.filters) {
      if (filter.value !== '') parameters[filter.name] = filter.value;
    }
  }

  /**
   * Add new filter with a given name and value
   * @param {String} filterName
   * @param {String} value
   */
  addFilter(filterName, value) {
    this.filters = this.filters.filter(filter => filter.name !== filterName);

    if (typeof value !== 'undefined') {
      this.filters.push({
        name: filterName,
        value: value
      });
    }
  }

  /**
   * Get data
   * @param {Object} options
   */
  async fetch(options = {}) {
    try {
      if (this.busy) return { items: this.items, time: 0 };
      this.busy = true;
      const start = new Date();

      let parameters= {};
      // If offset is not given, it means we need to start again
      if (!options.offset) this.items = [];
      if(this.path !== '/cluster/nodes') {
        const offset = options.offset || 0;
        const limit = options.limit || 500;
        const params = { limit, offset };
        this.serializeFilters(params);
        parameters = { params: params};
      }

      // Fetch next <limit> items
      const firstPage = await this.httpClient.request(
        'GET',
        this.path,
        parameters
      );
      this.items = this.items.filter(item => !!item);
      Array.isArray(firstPage.data.data)
        ? this.items.push(...firstPage.data.data)
        : this.items.push(...firstPage.data.data.affected_items);

      const totalItems = firstPage.data.data.total_affected_items;

      const remaining =
        this.items.length === totalItems ? 0 : totalItems - this.items.length;

      // Ignore manager as an agent, once the team solves this issue, review this line
      if (this.path === '/agents')
        this.items = this.items.filter(item => item.id !== '000');

      if ((!options || !options.nonull) && remaining > 0)
        this.items.push(...Array(remaining).fill(null));

      const end = new Date();
      const elapsed = (end - start) / 1000;
      this.busy = false;
      if (this.items.length > totalItems) this.items.length = totalItems;
      return { items: this.items, time: elapsed };
    } catch (error) {
      this.busy = false;
      return Promise.reject(error);
    }
  }

  /**
   * Reset filters
   */
  reset() {
    this.items = [];
    this.filters = [];
    if (this.implicitFilter) this.filters.push(...this.implicitFilter);
    this.sortValue = false;
    this.sortDir = false;
    this.sortValue = false;
  }
}
