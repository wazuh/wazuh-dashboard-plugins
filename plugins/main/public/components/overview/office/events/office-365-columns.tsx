import React from 'react';
import { tDataGridColumn } from '../../../common/data-grid';
import { EuiLink } from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../kibana-services';
import { rules } from '../../../../utils/applications';

export const office365Columns: tDataGridColumn[] = [
  {
    id: 'data.office365.Subscription',
  },
  {
    id: 'data.office365.Operation',
  },
  {
    id: 'data.office365.UserId',
  },
  {
    id: 'data.office365.ClientIP',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
    render: value => (
      <RedirectAppLinks application={getCore().application}>
        <EuiLink
          href={`${rules.id}#/manager/?tab=rules&redirectRule=${value}`}
        >
          {value}
        </EuiLink >
      </RedirectAppLinks>
    ),
  },
];
