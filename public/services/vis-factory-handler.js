/*
 * Wazuh app - Vis factory service
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

class VisFactoryService {
  constructor(
    $rootScope,
    appState,
    genericReq,
    discoverPendingUpdates,
    rawVisualizations,
    tabVisualizations,
    loadedVisualizations,
    commonData,
    visHandlers
  ) {
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.genericReq = genericReq;
    this.discoverPendingUpdates = discoverPendingUpdates;
    this.rawVisualizations = rawVisualizations;
    this.tabVisualizations = tabVisualizations;
    this.loadedVisualizations = loadedVisualizations;
    this.commonData = commonData;
    this.visHandlers = visHandlers;
  }

  clear(onlyAgent = false) {
    if (!onlyAgent) this.visHandlers.removeAll();
    this.discoverPendingUpdates.removeAll();
    this.rawVisualizations.removeAll();
    this.loadedVisualizations.removeAll();
  }

  clearAll() {
    this.clear();
    this.tabVisualizations.removeAll();
  }

  async buildOverviewVisualizations(filterHandler, tab, subtab, localChange) {
    try {
      const data = await this.genericReq.request(
        'GET',
        `/api/wazuh-elastic/create-vis/overview-${tab}/${this.appState.getCurrentPattern()}`
      );
      this.rawVisualizations.assignItems(data.data.raw);
      this.commonData.assignFilters(filterHandler, tab, localChange);
      this.$rootScope.$emit('changeTabView', { tabView: subtab });
      this.$rootScope.$broadcast('updateVis');
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async buildAgentsVisualizations(filterHandler, tab, subtab, localChange, id) {
    try {
      const data = await this.genericReq.request(
        'GET',
        `/api/wazuh-elastic/create-vis/agents-${tab}/${this.appState.getCurrentPattern()}`
      );
      this.rawVisualizations.assignItems(data.data.raw);
      this.commonData.assignFilters(filterHandler, tab, localChange, id);
      this.$rootScope.$emit('changeTabView', { tabView: subtab });
      this.$rootScope.$broadcast('updateVis');
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

app.service('visFactoryService', VisFactoryService);
