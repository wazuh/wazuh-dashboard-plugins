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
import DashboardRenderer from '../../../../common/dashboards/dashboard-renderer/dashboard-renderer';
import { ModuleConfigProps } from './module-config';

export const DrilldownConfigAction = (drilldownProps: ModuleConfigProps) => {
  const { fetchFilters, searchBarProps } = drilldownProps;
  return {
    rows: [
      {
        columns: [
          {
            width: 100,
            component: () => (
              <div style={{ width: '100%' }}>
                <DashboardRenderer
                  dashboardId='github-drilldown-action-dashboard-tab'
                  hasPinnedAgent={false}
                  config={{ dataSource: { fetchFilters, searchBarProps } }}
                />
              </div>
            ),
          },
        ],
      },
    ],
  };
};
