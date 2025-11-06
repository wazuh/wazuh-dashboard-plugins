'use strict';
/*
 * Wazuh app - Office 365 Drilldown UserId field Config.
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
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { OfficeDrilldownUserConfigDashboardConfig } from '../../../../../../common/dashboards/dashboard-definitions/overview/office/panel/config/drilldown-user-config/dashboard';
import { getPlugins } from '../../../../../kibana-services';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new OfficeDrilldownUserConfigDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};

export const drilldownUserConfig = props => {
  const { fetchFilters, searchBarProps, indexPattern } = props;

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
                      id: 'office-drilldown-ip-config-panel-tab',
                      timeRange: {
                        from: searchBarProps.dateRangeFrom,
                        to: searchBarProps.dateRangeTo,
                      },
                      title: 'Office drilldown ip config dashboard',
                      description:
                        'Dashboard of the Office drilldown ip config',
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
