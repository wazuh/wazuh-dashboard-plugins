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
import { VisCard } from '../../../common/modules/panel';
import { EuiFlexItem, EuiPanel } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';

import { i18n } from '@kbn/i18n';

const label1 = i18n.translate('wazuh.components.overview.office.panel.label1', {
  defaultMessage: 'Description',
});
const label2 = i18n.translate('wazuh.components.overview.office.panel.label2', {
  defaultMessage: 'User ID',
});
const label3 = i18n.translate('wazuh.components.overview.office.panel.label3', {
  defaultMessage: 'Operation',
});
const label4 = i18n.translate('wazuh.components.overview.office.panel.label4', {
  defaultMessage: 'Level',
});
const label5 = i18n.translate('wazuh.components.overview.office.panel.label5', {
  defaultMessage: 'Rule ID',
});
export const drilldownIPConfig = {
  rows: [
    {
      height: 400,
      columns: [
        {
          width: 30,
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-Office-Metric-Stats'
              tab='office'
              {...props}
            />
          ),
        },
        {
          width: 30,
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-Office-Top-Events-Pie'
              tab='office'
              {...props}
            />
          ),
        },
        {
          width: 40,
          component: props => (
            <VisCard
              id={'Wazuh-App-Overview-Office-User-Operation-Level-Table'}
              tab='office'
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
          component: props => (
            <VisCard
              id='Wazuh-App-Overview-Office-Alerts-Evolution-By-User'
              tab='office'
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
                    { field: 'rule.description', label: label1 },
                    { field: 'data.office365.UserId', label: label2 },
                    { field: 'data.office365.Operation', label: label3 },
                    { field: 'rule.level', label: label4 },
                    { field: 'rule.id', label: label5 },
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
