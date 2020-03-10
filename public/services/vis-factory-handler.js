/*
 * Wazuh app - Vis factory service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from "../react-services/app-state";
import { GenericRequest } from "../react-services/generic-request";

export class VisFactoryService {
  /**
   * Class Constructor
   * @param {*} $rootScope
   * @param {*} appState
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
    discoverPendingUpdates,
    rawVisualizations,
    tabVisualizations,
    loadedVisualizations,
    commonData,
    visHandlers
  ) {
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.genericReq = GenericRequest;
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
   */
  async buildOverviewVisualizations(filterHandler, tab, subtab, fromDiscover = false) {
    try {
      const currentPattern = AppState.getCurrentPattern();
      const data = await this.genericReq.request(
        'GET',
        `/elastic/visualizations/overview-${tab}/${currentPattern}`
      );
      this.rawVisualizations.assignItems(data.data.raw);
      if (!fromDiscover)
        this.commonData.assignFilters(filterHandler, tab);
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
  async buildAgentsVisualizations(filterHandler, tab, subtab, id, fromDiscover = false) {
    try {
      const data =
        tab !== 'sca'
          ? await this.genericReq.request(
            'GET',
            `/elastic/visualizations/agents-${tab}/${AppState.getCurrentPattern()}`
          )
          : false;
      data && this.rawVisualizations.assignItems(data.data.raw);
      if (!fromDiscover)
        this.commonData.assignFilters(filterHandler, tab, id);
      this.$rootScope.$emit('changeTabView', { tabView: subtab, tab });
      this.$rootScope.$broadcast('updateVis');
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
