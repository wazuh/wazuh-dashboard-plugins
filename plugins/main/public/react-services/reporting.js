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
import { getCore, getHttp, getToasts, getUiSettings } from '../kibana-services';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';
import store from '../redux/store';
import domtoimage from '../utils/dom-to-image-more';
import dateMath from '@elastic/datemath';
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButton, EuiLink } from '@elastic/eui';
import { reporting } from '../utils/applications';
import { RedirectAppLinks } from '../../../../src/plugins/opensearch_dashboards_react/public';
import {
  buildOpenSearchQuery,
  buildRangeFilter,
  getOpenSearchQueryConfig,
} from '../../../../src/plugins/data/common';
import { getForceNow } from '../components/common/search-bar/search-bar-service';
import NavigationService from './navigation-service';

export class ReportingService {
  constructor() {
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

  renderSucessReportsToast({ filename }) {
    this.showToast(
      'success',
      'Report created',
      <>
        <EuiFlexGroup alignItems='center'>
          <EuiFlexItem>
            <EuiFlexGroup justifyContent='flexEnd' gutterSize='s'>
              <EuiFlexItem style={{ whiteSpace: 'nowrap' }} grow={false}>
                See the reports on
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <RedirectAppLinks application={getCore().application}>
                  <EuiLink
                    aria-label='go to Endpoint summary'
                    href={NavigationService.getInstance().getUrlForApp(
                      reporting.id,
                      {
                        path: '',
                      },
                    )}
                  >
                    {reporting.title}
                  </EuiLink>
                </RedirectAppLinks>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => {
                // Open the new tab immediately
                const windowReference = window.open('', '_blank');

                // Verify if the new tab was locked
                if (windowReference) {
                  // Get the URL (in this case, it is obtained directly, but it can be asynchronous)
                  const url = getHttp().basePath.prepend(
                    `/reports/${filename}`,
                  );

                  // Then assign the URL to the new tab
                  windowReference.location = url;
                } else {
                  // If the tab is locked, it displays an alert to the user.
                  alert('The tab was blocked. Please enable pop-up windows.');
                }
              }}
              size='s'
            >
              Open report
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>,
      10000,
    );
  }

  async getVisualizationsFromDOM() {
    const domVisualizations = document.querySelectorAll('.visualization');
    return await Promise.all(
      Array.from(domVisualizations).map(async node => {
        return {
          /* WORKAROUND: Defining the width and height resolves a bug
          related to cropped screenshot on Firefox.

          This solution is based on
          https://github.com/1904labs/dom-to-image-more/issues/160#issuecomment-1922491067

          See https://github.com/wazuh/wazuh-dashboard-plugins/issues/6900#issuecomment-2275495245
          */
          element: await domtoimage.toPng(node, {
            width: node.clientWidth,
            height: node.clientHeight,
          }),
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
      const dataSourceContext =
        searchContext || (await this.getDataSourceSearchContext());
      const visualizations = await this.getVisualizationsFromDOM();

      const timeFilter =
        dataSourceContext.time && dataSourceContext.indexPattern.timeFieldName
          ? buildRangeFilter(
              {
                name: dataSourceContext.indexPattern.timeFieldName,
                type: 'date',
              },
              dataSourceContext.time,
              dataSourceContext.indexPattern,
            )
          : null;
      // Build the filters to use in the server side
      // Based on https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.13.0/src/plugins/data/public/query/query_service.ts#L103-L113
      const serverSideQuery = buildOpenSearchQuery(
        dataSourceContext.indexPattern,
        dataSourceContext.query,
        [...dataSourceContext.filters, ...(timeFilter ? [timeFilter] : [])],
        getOpenSearchQueryConfig(getUiSettings()),
      );
      const browserTimezone = moment.tz.guess(true);

      /* The report for syscollector uses the keywords for from and to properties.
      They are used with the format epoch_millis on the server side to get alerts data from
      vulnerable packages. If these values are parsed, will cause an error due to unexpected format.
      */
      const time =
        tab === 'syscollector'
          ? { to: dataSourceContext.time.to, from: dataSourceContext.time.from }
          : {
              to: dateMath.parse(dataSourceContext.time.to, {
                roundUp: true,
                forceNow: getForceNow(),
              }),
              from: dateMath.parse(dataSourceContext.time.from),
            };

      const data = {
        array: visualizations,
        serverSideQuery, // Used for applying the same filters on the server side requests
        filters: dataSourceContext.filters,
        time,
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
      const response = await WzRequest.genericReq('POST', apiEndpoint, data);

      this.renderSucessReportsToast({ filename: response.data.filename });
    } catch (error) {
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
      const response = await WzRequest.genericReq('POST', apiEndpoint, data);
      this.renderSucessReportsToast({ filename: response.data.filename });
    } catch (error) {
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
      getErrorOrchestrator().handleError(options);
    }
  }
}
