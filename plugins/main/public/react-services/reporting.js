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

import { WazuhConfig } from '../react-services/wazuh-config';
import { getPlugins } from '../kibana-services';
import { NavigationURLSearchParams } from '../react-services/navigation-service';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';
import store from '../redux/store';
import { PatternDataSourceFilterManager } from '../components/common/data-source/pattern/pattern-data-source-filter-manager';

export class ReportingService {
  constructor() {
    this.wazuhConfig = new WazuhConfig();
  }

  async getDataSourceSearchContext() {
    return store.getState().reportingReducers?.dataSourceSearchContext;
  }

  /**
   * This methods get the current url from browser and get the query params and use to create a reporting url
   *
   * @param {*} context
   */
  generateReportURL(context) {
    // URL example: "/app/dashboards#/view/it-hygiene-overview-dashboard-tab?_a=(filters:!(),query:(language:kuery,query:''))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'2025-08-20T19:38:00.878Z',to:'2025-11-18T19:38:00.878Z'))"
    const urlParams = window.location.href.split('?')?.[1] ?? '';
    const queryParams = new NavigationURLSearchParams(urlParams);
    const filtersOnURLFormat =
      PatternDataSourceFilterManager.filtersToURLFormat(context.filters);
    queryParams.set('_a', filtersOnURLFormat);
    // only keep the _a and _g query params (the osd native query params)
    for (const key of Array.from(queryParams.keys())) {
      if (key !== '_a' && key !== '_g') {
        queryParams.delete(key);
      }
    }
    const baseURL = `${window.location.origin}/app/dashboards#/view/${
      context.dashboardSavedObjectId
    }${queryParams.toString()}`;
    return baseURL;
  }

  async generateInContextPDFReport() {
    const dataSourceContext = await this.getDataSourceSearchContext();
    if (!dataSourceContext) {
      return null;
    }
    try {
      const reportingPlugin = getPlugins().reportsDashboards;
      if (!reportingPlugin) {
        return null;
      }

      if (!dataSourceContext.dashboardSavedObjectId) {
        return null;
      }
      await reportingPlugin.generateInContextPDFReport(
        this.generateReportURL(dataSourceContext),
      );
    } catch (error) {
      const options = {
        context: `${ReportingService.name}.generateInContextPDFReport`,
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
}
