/*
 * Wazuh app - Vis factory handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { DiscoverPendingUpdates } from '../factories/discover-pending-updates';
import { VisHandlers } from '../factories/vis-handlers';
import { RawVisualizations } from '../factories/raw-visualizations';
import { LoadedVisualizations } from '../factories/loaded-visualizations';
import { TabVisualizations } from '../factories/tab-visualizations';
import { AppState } from './app-state';
import { GenericRequest } from './generic-request';
import store from '../redux/store';
import { updateVis } from '../redux/actions/visualizationsActions';
import { getAngularModule } from '../kibana-services';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';

export class VisFactoryHandler {
  /**
   * Remove visualizations data
   * @param {Boolean} onlyAgent
   */
  static clear(onlyAgent = false) {
    const discoverPendingUpdates = new DiscoverPendingUpdates();
    const visHandlers = new VisHandlers();
    const loadedVisualizations = new LoadedVisualizations();
    const rawVisualizations = new RawVisualizations();

    if (!onlyAgent) visHandlers.removeAll();
    discoverPendingUpdates.removeAll();
    rawVisualizations.removeAll();
    loadedVisualizations.removeAll();
  }

  /**
   * Remove all visualizations data
   * @param {Boolean} onlyAgent
   */
  static clearAll() {
    const tabVisualizations = new TabVisualizations();
    this.clear();
    tabVisualizations.removeAll();
  }

  /**
   * Build the overview section visualizations
   * @param {*} filterHandler
   * @param {*} tab
   * @param {*} subtab
   * @param {*} localChange
   */
  static async buildOverviewVisualizations(
    filterHandler,
    tab,
    subtab,
    fromDiscover = false,
  ) {
    const rawVisualizations = new RawVisualizations();
    rawVisualizations.setType('general');
    const $injector = getAngularModule().$injector;
    const commonData = $injector.get('commonData');

    try {
      const currentPattern = AppState.getCurrentPattern();
      // TODO change logic to read common/modules/module-defaults.js configuration
      const data = !['sca', 'vuls'].includes(tab)
        ? await GenericRequest.request(
            'GET',
            `/elastic/visualizations/overview-${tab}/${currentPattern}`,
          )
        : false;
      data && rawVisualizations.assignItems(data.data.raw);
      /* For the vuls component only, it is not necessary to call the assignFilters method since it is handled by the same module due to its particular characteristics. Only the condition for vuls is added so as not to alter the rest. This functionality should be applied in a higher hierarchy in the future. */
      if (tab !== 'vuls' && !fromDiscover) {
        commonData.assignFilters(filterHandler, tab);
      }
      store.dispatch(
        updateVis({ update: true, raw: rawVisualizations.getList() }),
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Build the agents section visualizations
   * @param {*} filterHandler
   * @param {*} tab
   * @param {*} subtab
   * @param {*} localChange
   * @param {*} id
   */
  static async buildAgentsVisualizations(
    filterHandler,
    tab,
    subtab,
    id,
    fromDiscover = false,
  ) {
    const rawVisualizations = new RawVisualizations();
    //  if (rawVisualizations.getType() !== 'agents') {
    rawVisualizations.setType('agents');
    const $injector = getAngularModule().$injector;
    const commonData = $injector.get('commonData');

    try {
      // TODO change logic to read common/modules/module-defaults.js configuration
      const data = !['sca', 'office', 'vuls'].includes(tab)
        ? await GenericRequest.request(
            'GET',
            `/elastic/visualizations/agents-${tab}/${AppState.getCurrentPattern()}`,
          )
        : false;
      data && rawVisualizations.assignItems(data.data.raw);
      /* For the vuls component only, it is not necessary to call the assignFilters method since it is handled by the same module due to its particular characteristics. Only the condition for vuls is added so as not to alter the rest. This functionality should be applied in a higher hierarchy in the future. */
      if (tab !== 'vuls' && !fromDiscover) {
        commonData.assignFilters(filterHandler, tab, id);
      }
      store.dispatch(updateVis({ update: true }));
    } catch (error) {
      throw error;
    }
  }
}
