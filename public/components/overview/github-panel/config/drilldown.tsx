/*
 * Wazuh app - GitHub Panel tab - Drilldown layout configuration
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
import { VisCard } from '../../../common/modules/panel/';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';

export const DrilldownConfig = {
  rows: [
    {
      height: 230,
      columns: [
        {
          width: 30,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Metric-Stats' tab='office' {...props} />
        },
        {
          width: 30,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Top-Events-Pie' tab='office' {...props} />
        },
        {
          width: 40,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-IPs-By-User-Table' tab='office' {...props} />
        },
      ]
    },
    {
      columns: [
        {
          width: 100,
          component: (props) => (
            <EuiFlexGroup className={'wz-margin-0'}>
              <EuiFlexItem>
                <EuiPanel paddingSize={'s'} ><SecurityAlerts /></EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          )
        },
      ]
    },
  ]
};
