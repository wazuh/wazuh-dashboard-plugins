/*
 * Wazuh app - Vis factory service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class VisFactoryService {
  /**
   * Class Constructor
   * @param {*} $rootScope
   * @param {*} appState
   * @param {*} genericReq
   * @param {*} discoverPendingUpdates
   * @param {*} rawVisualizations
   * @param {*} tabVisualizations
   * @param {*} loadedVisualizations
   * @param {*} commonData
   * @param {*} visHandlers
   */
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

  /**
   * Remove visualizations data
   * @param {Boolean} onlyAgent
   */
  clear(onlyAgent = false) {
    if (!onlyAgent) this.visHandlers.removeAll();
    this.discoverPendingUpdates.removeAll();
    this.rawVisualizations.removeAll();
    this.loadedVisualizations.removeAll();
  }

  /**
   * Remove all visualizations data
   * @param {Boolean} onlyAgent
   */
  clearAll() {
    this.clear();
    this.tabVisualizations.removeAll();
  }

  /**
   * Build the overview section visualizations
   * @param {*} filterHandler
   * @param {*} tab
   * @param {*} subtab
   * @param {*} localChange
   */
  async buildOverviewVisualizations(filterHandler, tab, subtab, localChange) {
    try {
      const data = await this.genericReq.request(
        'GET',
        `/elastic/visualizations/overview-${tab}/${this.appState.getCurrentPattern()}`
      );
      this.rawVisualizations.assignItems(data.data.raw);
      this.commonData.assignFilters(filterHandler, tab, localChange);
      this.$rootScope.$emit('changeTabView', { tabView: subtab, tab });
      this.$rootScope.$broadcast('updateVis');
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * BUild the agents section visualizations
   * @param {*} filterHandler
   * @param {*} tab
   * @param {*} subtab
   * @param {*} localChange
   * @param {*} id
   */
  async buildAgentsVisualizations(filterHandler, tab, subtab, localChange, id) {
    try {
      const data =
        tab !== 'sca'
          ? await this.genericReq.request(
              'GET',
              `/elastic/visualizations/agents-${tab}/${this.appState.getCurrentPattern()}`
            )
          : false;
      data && this.rawVisualizations.assignItems(data.data.raw);
      this.commonData.assignFilters(filterHandler, tab, localChange, id);
      this.$rootScope.$emit('changeTabView', { tabView: subtab, tab });
      this.$rootScope.$broadcast('updateVis');
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
