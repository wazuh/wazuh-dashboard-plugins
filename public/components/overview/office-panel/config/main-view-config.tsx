/*
 * Wazuh app - Office 365 MainViewConfig.
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
import { AggTable } from '../../../common/modules/panel/';
import { EuiFlexItem, EuiPanel } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';

export const MainViewConfig = {
  rows: [
    {
      // height: 300,
      columns: [
        {
          width: 50,
          component: (props) => (
            <AggTable
              tableTitle={''}
              aggTerm={'data.office365.UserId'}
              aggLabel={'User'}
              maxRows={'7'}
              onRowClick={(field, value) => props.onRowClick(field, value)}
            />
          ),
        },
        {
          width: 50,
          component: (props) => (
            <AggTable
              tableTitle={''}
              aggTerm={'data.office365.ClientIP'}
              aggLabel={'Client IP'}
              maxRows={'7'}
              onRowClick={(field, value) => props.onRowClick(field, value)}
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
