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
export class ReportingController {
  /**
   * Class controller
   * @param {*} $scope
   * @param {*} errorHandler
   * @param {*} genericReq
   */
  constructor($scope, errorHandler, genericReq) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.genericReq = genericReq;
    this.loading = true;
    this.itemsPerPage = 15;
    this.pagedItems = [];
    this.currentPage = 0;
    this.items = [];
    this.gap = 0;
  }

  /**
   * On controller loads
   */
  $onInit() {
    this.load();
  }

  /**
   * This performs a search
   */
  search() {
    this.filteredItems = this.items;
    this.currentPage = 0;
    this.groupToPages();
  }

  /**
   * This delete a report with a given name
   */
  async deleteReport(name) {
    try {
      this.loading = true;
      await this.genericReq.request('DELETE', '/reports/' + name, {});
      await this.load();
      this.errorHandler.info('Success', 'Reporting');
    } catch (error) {
      this.errorHandler.handle(error, 'Reporting');
    }
  }

  // calculate page in place
  groupToPages() {
    this.pagedItems = [];

    for (let i = 0; i < this.filteredItems.length; i++) {
      if (i % this.itemsPerPage === 0) {
        this.pagedItems[Math.floor(i / this.itemsPerPage)] = [
          this.filteredItems[i]
        ];
      } else {
        this.pagedItems[Math.floor(i / this.itemsPerPage)].push(
          this.filteredItems[i]
        );
      }
    }
  }

  /**
   * This organize in pages of given size the items
   * @param {*} size
   * @param {*} start
   * @param {*} end
   */
  range(size, start, end) {
    const ret = [];

    if (size < end) {
      end = size;
      start = size - this.gap;
    }
    for (let i = start; i < end; i++) {
      ret.push(i);
    }

    return ret;
  }

  /**
   * This navigates to the prevoous page
   */
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  /**
   * This navigates to the next page
   */
  nextPage(n) {
    if (!n && n !== 0 && this.currentPage < this.pagedItems.length - 1) {
      this.currentPage++;
    }
  }

  /**
   * This navigates to a given page
   */
  setPage(n) {
    this.currentPage = n;
    this.nextPage(n);
  }

  /**
   * On controller loads
   */
  async load() {
    try {
      this.loading = true;
      const data = await this.genericReq.request('GET', '/reports', {});
      this.items = data.data.list;
      const gap = this.items.length / 15;
      const gapInteger = parseInt(this.items.length / 15);
      this.gap =
        gap - parseInt(this.items.length / 15) > 0
          ? gapInteger + 1
          : gapInteger;
      if (this.gap > 5) this.gap = 5;
      this.search();
      this.loading = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
    } catch (error) {
      this.errorHandler.handle(error, 'Reporting');
    }
  }
}
