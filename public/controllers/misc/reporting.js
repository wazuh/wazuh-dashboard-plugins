/*
 * Wazuh app - Reporting controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import chrome from 'ui/chrome';
export class ReportingController {
  constructor($scope, errorHandler, genericReq, $window, timeService) {
    // Services
    this.$scope = $scope;
    this.$window = $window;
    this.errorHandler = errorHandler;
    this.genericReq = genericReq;
    this.timeService = timeService;

    // Variables
    this.loading = true;
    this.items = [];
  }

  /**
   * On controller loads
   */
  $onInit() {
    this.load();
  }

  /**
   * Transform a give date applying the browser's offset
   * @param {*} time
   */
  offsetTimestamp(time) {
    try {
      return this.timeService.offset(time);
    } catch (error) {
      return time !== '-' ? `${time} (UTC)` : time;
    }
  }

  /**
   * Deletes a report
   * @param {*} name The name of the report
   */
  async deleteReport(name) {
    try {
      await this.genericReq.request('DELETE', '/reports/' + name, {});
      this.items = this.items.filter(item => item.name !== name);
      this.errorHandler.info('Success');
    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
    return this.items;
  }

  /**
   * Downloads the report
   * @param {*} name The name of the report
   */
  goReport(name) {
    this.$window.open(chrome.addBasePath(`/reports/${name}`), '_blank');
  }

  /**
   * On controller loads
   */
  async load() {
    try {
      this.loading = true;
      const data = await this.genericReq.request('GET', '/reports', {});
      this.items = ((data || {}).data || {}).list || [];
      this.reportingTableProps = {
        deleteReport: name => this.deleteReport(name),
        goReport: name => this.goReport(name),
        offsetTimestamp: time => this.offsetTimestamp(time),
        load: () => this.load(true),
        items: this.items
      };
    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
    this.loading = false;
    this.$scope.$applyAsync();
    return this.items;
  }
}
