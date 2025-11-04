/*
 * Wazuh app - GitHub Panel tab - Drilldown layout configuration
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
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getPlugins } from '../../../../../kibana-services';
import { ModuleConfigProps } from './module-config';
import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { GithubDrilldownRepositoryDashboardByRendererConfig } from '../../../../../../common/dashboards/vis-definitions/overview/github/panel/config/github-drilldown-repository/dashboard';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const getDashboardPanels = (indexPatternId: string): DashboardByRendererPanels => {
  const githubDrilldownRepositoryDashboardByRendererConfig =
    new GithubDrilldownRepositoryDashboardByRendererConfig(indexPatternId);

  return githubDrilldownRepositoryDashboardByRendererConfig.getDashboardPanels();
};

export const DrilldownConfigRepository = (
  drilldownProps: ModuleConfigProps,
) => {
  const { fetchData, fetchFilters, searchBarProps, indexPattern } =
    drilldownProps;

  return {
    rows: [
      {
        columns: [
          {
            width: 100,
            component: props => {
              return (
                <div style={{ width: '100%' }}>
                  <DashboardByRenderer
                    input={{
                      viewMode: ViewMode.VIEW,
                      panels: getDashboardPanels(indexPattern.id),
                      isFullScreenMode: false,
                      filters: fetchFilters ?? [],
                      useMargins: true,
                      id: 'github-drilldown-action-dashboard-tab',
                      timeRange: {
                        from: searchBarProps.dateRangeFrom,
                        to: searchBarProps.dateRangeTo,
                      },
                      title: 'GitHub drilldown action dashboard',
                      description: 'Dashboard of the GitHub drilldown action',
                      query: searchBarProps.query,
                      refreshConfig: {
                        pause: false,
                        value: 15,
                      },
                      hidePanelTitles: false,
                    }}
                    onInputUpdated={() => {}}
                  />
                </div>
              );
            },
          },
        ],
      },
    ],
  };
};
