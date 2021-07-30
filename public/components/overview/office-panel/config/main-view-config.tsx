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
import { EuiFlexItem } from '@elastic/eui';

export const MainViewConfig = {
  rows: [
    {
      columns: [
        {
          width: 50,
          component: (props) => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={'Users'}
                aggTerm={'data.office365.UserId'}
                aggLabel={'User'}
                maxRows={'5'}
                onRowClick={(field, value) => props.onRowClick(field, value)}
              />
            </EuiFlexItem>
          ),
        },
        {
          width: 50,
          component: (props) => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={'Rules'}
                aggTerm={'rule.description'}
                aggLabel={'Rule'}
                maxRows={'5'}
                onRowClick={(field, value) => props.onRowClick(field, value)}
              />
            </EuiFlexItem>
          ),
        },
      ],
    },
    {
      columns: [
        {
          width: 50,
          component: (props) => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={'Client IP'}
                aggTerm={'data.office365.ClientIP'}
                aggLabel={'Client IP'}
                maxRows={'5'}
                onRowClick={(field, value) => props.onRowClick(field, value)}
              />
            </EuiFlexItem>
          ),
        },
        {
          width: 50,
          component: (props) => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={'Subscriptions'}
                aggTerm={'data.office365.Subscription'}
                aggLabel={'Subscriptions'}
                maxRows={'5'}
                onRowClick={(field, value) => props.onRowClick(field, value)}
              />
            </EuiFlexItem>
          ),
        },
      ],
    },
  ],
};
