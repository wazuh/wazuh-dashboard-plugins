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
import { VisCard } from '../../../common/modules/panel/';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';
import { i18n } from '@kbn/i18n';

const label1 = i18n.translate(
  'wazuh.components.overview.compliance.table.drilldown.label1',
  {
    defaultMessage: 'Organization',
  },
);
const label2 = i18n.translate(
  'wazuh.components.overview.compliance.table.drilldown.label2',
  {
    defaultMessage: 'Repository',
  },
);
const label3 = i18n.translate(
  'wazuh.components.overview.compliance.table.drilldown.label3',
  {
    defaultMessage: 'Actor',
  },
);
export const DrilldownConfigActor = {
  rows: [
    {
      height: 300,
      columns: [
        {
          width: 30,
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-GitHub-Top-Ten-Actions'
              tab='github'
              {...props}
            />
          ),
        },
        {
          width: 30,
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-GitHub-Top-Ten-Repositories'
              tab='github'
              {...props}
            />
          ),
        },
        {
          width: 30,
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-GitHub-Top-Ten-Organizations'
              tab='github'
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
          width: 50,
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-GitHub-Countries'
              tab='github'
              {...props}
            />
          ),
        },
        {
          width: 50,
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-GitHub-Alert-Level-Evolution'
              tab='github'
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
                    { field: 'rule.description' },
                    { field: 'data.github.org', label: label1 },
                    { field: 'data.github.repo', label: label2 },
                    { field: 'data.github.action', label: label3 },
                    { field: 'rule.level' },
                    { field: 'rule.id' },
                  ]}
                />
              </EuiPanel>
            </EuiFlexItem>
          ),
        },
      ],
    },
  ],
};
