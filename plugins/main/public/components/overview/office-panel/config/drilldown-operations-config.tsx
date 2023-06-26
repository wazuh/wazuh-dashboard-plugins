/*
 * Wazuh app - Office 365 Drilldown Operations field Config.
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
import { VisCard } from '../../../common/modules/panel';
import { EuiFlexItem, EuiPanel } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';

export const drilldownOperationsConfig = {
  rows: [
    {
      height: 400,
      columns: [
        {
          width: 40,
          component: (props) => (
            <VisCard id="Wazuh-App-Overview-Office-Top-Users" tab="office" {...props} />
          ),
        },
        {
          width: 60,
          component: (props) => (
            <VisCard id="Wazuh-App-Overview-Office-Country-Tag-Cloud" tab="office" {...props} />
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
              id="Wazuh-App-Overview-Office-Alerts-Evolution-By-UserID"
              tab="office"
              {...props}
            />
          ),
        },
      ],
    },
    {
      columns: [
        {
          width: 100,
          component: () => (
            <EuiFlexItem>
              <EuiPanel paddingSize={'s'}>
                <SecurityAlerts
                  initialColumns={[
                    { field: 'icon' },
                    { field: 'timestamp' },
                    { field: 'rule.description', label: 'Description' },
                    { field: 'data.office365.UserId', label: 'User ID' },
                    { field: 'data.office365.ClientIP', label: 'Client IP address' },
                    { field: 'rule.level', label: 'Level' },
                    { field: 'rule.id', label: 'Rule ID' },
                  ]}
                  useAgentColumns={false}
                />
              </EuiPanel>
            </EuiFlexItem>
          ),
        },
      ],
    },
  ],
};
