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

import moment from 'moment';
import { WazuhConfig } from '../react-services/wazuh-config';
import { AppState } from './app-state';
import { WzRequest } from './wz-request';
import { getCore, getHttp, getToasts, getUiSettings, getPlugins } from '../kibana-services';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';
import store from '../redux/store';
import domtoimage from '../utils/dom-to-image-more';
import dateMath from '@elastic/datemath';
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import { reporting } from '../utils/applications';
import { RedirectAppLinks } from '../../../../src/plugins/opensearch_dashboards_react/public';
import {
  buildOpenSearchQuery,
  buildRangeFilter,
  getOpenSearchQueryConfig,
} from '../../../../src/plugins/data/common';
import { getForceNow } from '../components/common/search-bar/search-bar-service';
import NavigationService from './navigation-service';
import { Agent } from '../components/endpoints-summary/types';

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
  generateReportURL(context){
    // URL example: "/app/dashboards#/view/it-hygiene-overview-dashboard-tab?_a=(filters:!(),query:(language:kuery,query:''))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'2025-08-20T19:38:00.878Z',to:'2025-11-18T19:38:00.878Z'))"
    const currentURL = window.location.href;
    // get the query params from the current browser url
    const queryParams = currentURL.split('?')?.[1]??'';
    const baseURL = `/app/dashboards#/view/${context.dashboardSavedObjectId}?${queryParams}`;
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
      
      if(!dataSourceContext.dashboardSavedObjectId) {
        return null;
      }
      reportingPlugin.generateInContextPDFReport(this.generateReportURL(dataSourceContext));
    }catch(error){
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
