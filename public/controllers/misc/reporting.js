/*
 * Wazuh app - Cluster monitoring controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

class ReportingController {
  constructor($scope, errorHandler, genericReq) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.genericReq = genericReq;
    this.$scope.loading = true;
    this.$scope.itemsPerPage = 15;
    this.$scope.pagedItems = [];
    this.$scope.currentPage = 0;
    this.items = [];
    this.$scope.gap = 0;
  }

  $onInit() {
    this.load();
    this.$scope.refresh = () => this.load();
    this.$scope.deleteReport = async name => this.deleteReport(name);
    this.$scope.search = () => this.search();
    this.$scope.groupToPages = () => this.groupToPages();
    this.$scope.range = (size, start, end) => this.range(size, start, end);
    this.$scope.prevPage = () => this.prevPage();
    this.$scope.nextPage = () => this.nextPage();
    this.$scope.setPage = () => this.setPage();
  }

  search() {
    this.$scope.filteredItems = this.items;
    this.$scope.currentPage = 0;
    this.$scope.groupToPages();
  }

  async deleteReport(name) {
    try {
      this.$scope.loading = true;
      await this.genericReq.request(
        'DELETE',
        '/reports/' + name,
        {}
      );
      await this.load();
      this.errorHandler.info('Success', 'Reporting');
    } catch (error) {
      this.errorHandler.handle(error, 'Reporting');
    }
  }

  // calculate page in place
  groupToPages() {
    this.$scope.pagedItems = [];

    for (let i = 0; i < this.$scope.filteredItems.length; i++) {
      if (i % this.$scope.itemsPerPage === 0) {
        this.$scope.pagedItems[Math.floor(i / this.$scope.itemsPerPage)] = [
          this.$scope.filteredItems[i]
        ];
      } else {
        this.$scope.pagedItems[Math.floor(i / this.$scope.itemsPerPage)].push(
          this.$scope.filteredItems[i]
        );
      }
    }
  }

  range(size, start, end) {
    const ret = [];

    if (size < end) {
      end = size;
      start = size - this.$scope.gap;
    }
    for (let i = start; i < end; i++) {
      ret.push(i);
    }
    return ret;
  }

  prevPage() {
    if (this.$scope.currentPage > 0) {
      this.$scope.currentPage--;
    }
  }

  nextPage() {
    if (this.$scope.currentPage < this.$scope.pagedItems.length - 1) {
      this.$scope.currentPage++;
    }
  }

  setPage() {
    this.$scope.currentPage = this.n;
  }

  async load() {
    try {
      this.$scope.loading = true;
      const data = await this.genericReq.request(
        'GET',
        '/reports',
        {}
      );
      this.items = data.data.list;
      const gap = this.items.length / 15;
      const gapInteger = parseInt(this.items.length / 15);
      this.$scope.gap =
        gap - parseInt(this.items.length / 15) > 0
          ? gapInteger + 1
          : gapInteger;
      if (this.$scope.gap > 5) this.$scope.gap = 5;
      this.$scope.search();
      this.$scope.loading = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
    } catch (error) {
      this.errorHandler.handle(error, 'Reporting');
    }
  }
}

// Logs controller
app.controller('reportingController', ReportingController);
