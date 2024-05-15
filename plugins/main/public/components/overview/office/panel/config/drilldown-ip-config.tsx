'use strict';
/*
 * Wazuh app - Office 365 Drilldown IP field Config.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { EuiFlexItem, EuiPanel, EuiLink } from '@elastic/eui';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getPlugins, getCore } from '../../../../../kibana-services';
import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import {
  getVisStateOfficeMetricStats,
  getVisStateOfficeTopsEventsPie,
  getVisStateOfficeUserOperationLevel,
  getVisStateOfficeAlertsEvolutionByUser,
} from './visualizations';
import { AppNavigate } from '../../../../../react-services';
import DrillDownDataGrid from '../../../github/panel/config/drilldown-data-grid';
import { rules } from '../../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    d0: {
      gridData: {
        w: 15,
        h: 14,
        x: 0,
        y: 0,
        i: 'd0',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd0',
        savedVis: getVisStateOfficeMetricStats(indexPatternId),
      },
    },
    d1: {
      gridData: {
        w: 15,
        h: 14,
        x: 15,
        y: 0,
        i: 'd1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd1',
        savedVis: getVisStateOfficeTopsEventsPie(indexPatternId),
      },
    },
    d2: {
      gridData: {
        w: 18,
        h: 14,
        x: 30,
        y: 0,
        i: 'd2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd2',
        savedVis: getVisStateOfficeUserOperationLevel(indexPatternId),
      },
    },
    d3: {
      gridData: {
        w: 48,
        h: 11,
        x: 0,
        y: 14,
        i: 'd3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd3',
        savedVis: getVisStateOfficeAlertsEvolutionByUser(indexPatternId),
      },
    },
  };
};

export const drilldownIPConfig = (props) => {

  const {
    fetchData,
    fetchFilters,
    searchBarProps,
    indexPattern
  } = props;

  return {

    rows: [
      {
        columns: [
          {
            width: 100,
            component: props => {

              const defaultTableColumns = [
                { id: 'timestamp' },
                { id: 'rule.description', displayAsText: 'Description' },
                { id: 'data.office365.UserId', displayAsText: 'User ID' },
                {
                  id: 'data.office365.Operation',
                  displayAsText: 'Operation',
                },
                { id: 'rule.level', displayAsText: 'Level' },
                {
                  id: 'rule.id', render: value => (
                    <RedirectAppLinks application={getCore().application}>
                      <EuiLink
                        href={`${rules.id}#/manager/?tab=rules&redirectRule=${value}`}
                      >
                        {value}
                      </EuiLink >
                    </RedirectAppLinks>
                  ),
                },
              ]


              return (
                <div style={{ width: '100%' }}>
                  <DashboardByRenderer
                    input={{
                      viewMode: ViewMode.VIEW,
                      panels: getDashboardPanels(indexPattern.id),
                      isFullScreenMode: false,
                      filters: fetchFilters ?? [],
                      useMargins: true,
                      id: 'office-drilldown-ip-config-panel-tab',
                      timeRange: {
                        from: searchBarProps.dateRangeFrom,
                        to: searchBarProps.dateRangeTo,
                      },
                      title: 'Office drilldown ip config dashboard',
                      description: 'Dashboard of the Office drilldown ip config',
                      query: searchBarProps.query,
                      refreshConfig: {
                        pause: false,
                        value: 15,
                      },
                      hidePanelTitles: false,
                    }}
                    onInputUpdated={() => { }}
                  />
                  <EuiFlexItem>
                    <DrillDownDataGrid
                      defaultTableColumns={defaultTableColumns}
                      fetchData={fetchData}
                      fetchFilters={fetchFilters}
                      searchBarProps={searchBarProps}
                      indexPattern={indexPattern}
                    />
                  </EuiFlexItem>
                </div>
              );
            },
          },
        ],
      },
    ],
  };

};
