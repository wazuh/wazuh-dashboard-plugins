/*
 * Wazuh app - Reporting service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import $ from 'jquery';

export class ReportingService {
  constructor(
    $rootScope,
    vis2png,
    rawVisualizations,
    visHandlers,
    genericReq,
    errorHandler
  ) {
    this.$rootScope = $rootScope;
    this.vis2png = vis2png;
    this.rawVisualizations = rawVisualizations;
    this.visHandlers = visHandlers;
    this.genericReq = genericReq;
    this.errorHandler = errorHandler;
  }

  async startVis2Png(tab, isAgents = false, syscollectorFilters = null) {
    try {
      if (this.vis2png.isWorking()) {
        this.errorHandler.handle('Report in progress', 'Reporting', true);
        return;
      }
      this.$rootScope.reportBusy = true;
      this.$rootScope.reportStatus = 'Generating report...0%';
      if (!this.$rootScope.$$phase) this.$rootScope.$digest();

      this.vis2png.clear();

      const idArray = this.rawVisualizations.getList().map(item => item.id);

      for (const item of idArray) {
        const tmpHTMLElement = $(`#${item}`);
        this.vis2png.assignHTMLItem(item, tmpHTMLElement);
      }

      const appliedFilters = this.visHandlers.getAppliedFilters(
        syscollectorFilters
      );

      const array = await this.vis2png.checkArray(idArray);
      const name = `wazuh-${
        isAgents ? 'agents' : 'overview'
      }-${tab}-${(Date.now() / 1000) | 0}.pdf`;

      const data = {
        array,
        name,
        title: isAgents ? `Agents ${tab}` : `Overview ${tab}`,
        filters: appliedFilters.filters,
        time: appliedFilters.time,
        searchBar: appliedFilters.searchBar,
        tables: appliedFilters.tables,
        tab,
        section: isAgents ? 'agents' : 'overview',
        isAgents
      };

      await this.genericReq.request(
        'POST',
        '/api/wazuh-reporting/report',
        data
      );

      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      if (!this.$rootScope.$$phase) this.$rootScope.$digest();
      this.errorHandler.info(
        'Success. Go to Management -> Reporting',
        'Reporting'
      );

      return;
    } catch (error) {
      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.errorHandler.handle(error, 'Reporting');
    }
  }
}
