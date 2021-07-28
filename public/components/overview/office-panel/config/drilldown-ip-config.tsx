/*
 * Wazuh app - Office 365 DrilldownIPConfig.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { VisCard } from '../../../common/modules/panel';
import { EuiFlexItem, EuiPanel } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';

export const DrilldownIPConfig = {
  rows: [
    {
      height: 230,
      columns: [
        {
          width: 30,
          component: (props) => (
            <VisCard id="Wazuh-App-Overview-Office-Metric-Stats" tab="office" {...props} />
          ),
        },
        {
          width: 30,
          component: (props) => (
            <VisCard id="Wazuh-App-Overview-Office-Top-Events-Pie" tab="office" {...props} />
          ),
        },
        {
          width: 40,
          component: (props) => (
            <VisCard id="Wazuh-App-Overview-Office-IPs-By-User-Table" tab="office" {...props} />
          ),
        },
      ],
    },
    {
      height: 300,
      columns: [
        {
          width: 100,
          component: (props) => (
            <VisCard
              id="Wazuh-App-Overview-Office-Alerts-Evolution-By-User"
              tab="office"
              {...props}
            />
          ),
        },
      ],
    },
    {
      height: 300,
      columns: [
        {
          width: 100,
          component: () => (
            <EuiFlexItem>
              <EuiPanel paddingSize={'s'}>
                <SecurityAlerts />
              </EuiPanel>
            </EuiFlexItem>
          ),
        },
      ],
    },
  ],
};
