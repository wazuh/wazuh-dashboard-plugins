/*
 * Wazuh app - Office 365 MainViewConfig.
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
import { AggTable } from '../../../common/modules/panel/';
import { EuiFlexItem } from '@elastic/eui';
import { SecurityAlerts } from '../../../visualize/components';
import { i18n } from '@kbn/i18n';

const Title1 = i18n.translate(
  'wazuh.components.overview.officePanel.config.topUser',
  {
    defaultMessage: 'Top users',
  },
);
const Title2 = i18n.translate(
  'wazuh.components.overview.officePanel.config.title2',
  {
    defaultMessage: 'Top client IP',
  },
);
const Title3 = i18n.translate(
  'wazuh.components.overview.officePanel.config.title3',
  {
    defaultMessage: 'Top rules',
  },
);
const Title4 = i18n.translate(
  'wazuh.components.overview.officePanel.config.title4',
  {
    defaultMessage: 'Top operations',
  },
);

export const MainViewConfig = {
  rows: [
    {
      columns: [
        {
          width: 50,
          component: props => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={Title1}
                aggTerm='data.office365.UserId'
                aggLabel={i18n.translate(
                  'wazuh.public.components.overview.officePanel.config.User',
                  {
                    defaultMessage: 'User',
                  },
                )}
                maxRows={5}
                onRowClick={(field, value) => props.onRowClick(field, value)}
              />
            </EuiFlexItem>
          ),
        },
        {
          width: 50,
          component: props => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={Title2}
                aggTerm='data.office365.ClientIP'
                aggLabel={i18n.translate(
                  'wazuh.public.components.overview.officePanel.config.ClientIP',
                  {
                    defaultMessage: 'Client IP',
                  },
                )}
                maxRows={5}
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
          component: props => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={Title3}
                aggTerm='rule.description'
                aggLabel={i18n.translate(
                  'wazuh.public.components.overview.officePanel.config.Rule',
                  {
                    defaultMessage: 'Rule',
                  },
                )}
                maxRows={5}
                onRowClick={(field, value) => props.onRowClick(field, value)}
              />
            </EuiFlexItem>
          ),
        },
        {
          width: 50,
          component: props => (
            <EuiFlexItem grow={props.grow}>
              <AggTable
                tableTitle={Title4}
                aggTerm='data.office365.Operation'
                aggLabel={i18n.translate(
                  'wazuh.public.components.overview.officePanel.config.Operation',
                  {
                    defaultMessage: 'Operation',
                  },
                )}
                maxRows={5}
                onRowClick={(field, value) => props.onRowClick(field, value)}
              />
            </EuiFlexItem>
          ),
        },
      ],
    },
  ],
};
