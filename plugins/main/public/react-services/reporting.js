/*
 * Wazuh app - Reporting service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import $ from 'jquery';
import moment from 'moment';
import { WazuhConfig } from '../react-services/wazuh-config';
import { AppState } from './app-state';
import { WzRequest } from './wz-request';
import { Vis2PNG } from '../factories/vis2png';
import { RawVisualizations } from '../factories/raw-visualizations';
import { VisHandlers } from '../factories/vis-handlers';
import { getAngularModule, getDataPlugin, getToasts } from '../kibana-services';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';
import store from '../redux/store';
import domtoimage from '../utils/dom-to-image';
import dateMath from '@elastic/datemath';

const app = getAngularModule();

export class ReportingService {
  constructor() {
    this.$rootScope = app.$injector.get('$rootScope');
    this.vis2png = new Vis2PNG();
    this.rawVisualizations = new RawVisualizations();
    this.visHandlers = new VisHandlers();
    this.wazuhConfig = new WazuhConfig();
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  removeTableVis(visList) {
    const attributes = JSON.parse(visList.attributes.visState);
    return attributes.type !== 'table';
  }

  removeAgentStatusVis(idArray) {
    const monitoringEnabled =
      this.wazuhConfig.getConfig()['wazuh.monitoring.enabled'];
    if (!monitoringEnabled) {
      const visArray = idArray.filter(vis => {
        return vis !== 'Wazuh-App-Overview-General-Agents-status';
      });
      return visArray;
    }
    return idArray;
  }

  async getVisualizationsFromDOM() {
    const domVisualizations = document.querySelectorAll('.visualization');
    return await Promise.all(
      Array.from(domVisualizations).map(async node => {
        return {
          element: await domtoimage.toPng(node),
          width: node.clientWidth,
          height: node.clientHeight,
          title: node?.parentNode?.parentNode?.parentNode?.querySelector(
            'figcaption > h2 > .embPanel__titleInner',
          )?.textContent,
        };
      }),
    );
  }

  async getDataSourceSearchContext() {
    return store.getState().reportingReducers?.dataSourceSearchContext;
  }

  async startVis2Png(tab, agents = false, searchContext = null) {
    try {
      this.$rootScope.reportBusy = true;
      this.$rootScope.reportStatus = 'Generating report...0%';
      this.$rootScope.$applyAsync();

      const dataSourceContext =
        searchContext || (await this.getDataSourceSearchContext());
      const visualizations = await this.getVisualizationsFromDOM();
      const dataplugin = await getDataPlugin();
      const serverSideQuery = dataplugin.query.getOpenSearchQuery();
      const browserTimezone = moment.tz.guess(true);

      const data = {
        array: visualizations,
        serverSideQuery, // Used for applying the same filters on the server side requests
        filters: dataSourceContext.filters,
        time: {
          to: dateMath.parse(dataSourceContext.time.to),
          from: dateMath.parse(dataSourceContext.time.to),
        },
        searchBar: dataSourceContext?.query?.query || '',
        tables: [], // TODO: check is this is used
        tab,
        section: agents ? 'agents' : 'overview',
        agents,
        browserTimezone,
        indexPatternTitle: dataSourceContext.indexPattern.title,
        apiId: JSON.parse(AppState.getCurrentAPI()).id,
      };

      const apiEndpoint =
        tab === 'syscollector'
          ? `/reports/agents/${agents}/inventory`
          : `/reports/modules/${tab}`;
      await WzRequest.genericReq('POST', apiEndpoint, data);

      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      this.showToast(
        'success',
        'Created report',
        'Success. Go to Dashboard management > Reporting',
        4000,
      );
      return;
    } catch (error) {
      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      const options = {
        context: `${ReportingService.name}.startVis2Png`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error creating the report`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async startConfigReport(obj, type, components) {
    try {
      this.$rootScope.reportBusy = true;
      this.$rootScope.reportStatus = 'Generating PDF document...';
      this.$rootScope.$applyAsync();

      const browserTimezone = moment.tz.guess(true);

      const data = {
        filters: [
          type === 'agentConfig' ? { agent: obj.id } : { group: obj.name },
        ],
        browserTimezone,
        components,
        apiId: JSON.parse(AppState.getCurrentAPI()).id,
      };
      const apiEndpoint =
        type === 'agentConfig'
          ? `/reports/agents/${obj.id}`
          : `/reports/groups/${obj.name}`;
      await WzRequest.genericReq('POST', apiEndpoint, data);

      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      this.showToast(
        'success',
        'Created report',
        'Success. Go to Dashboard management > Reporting',
        4000,
      );
      return;
    } catch (error) {
      this.$rootScope.reportBusy = false;
      this.$rootScope.reportStatus = false;
      this.$rootScope.$applyAsync();
      const options = {
        context: `${ReportingService.name}.startConfigReport`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error configuring report`,
        },
      };
      this.$rootScope.$applyAsync();
      getErrorOrchestrator().handleError(options);
    }
  }
}
