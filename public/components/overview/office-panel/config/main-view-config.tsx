import React from 'react';
import { VisCard, AggTable } from '../../../common/modules/panel/';
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
              onRowClick={(field, value) => props.onRowClick(field, value)} />)
        },
        {
          width: 50,
          component: (props) => (
            <AggTable
              tableTitle={''}
              aggTerm={'data.office365.ClientIP'}
              aggLabel={'Client IP'}
              maxRows={'7'} 
              onRowClick={(field, value) => props.onRowClick(field, value)} />)
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 100,
          component: () => <EuiFlexItem><EuiPanel paddingSize={'s'} ><SecurityAlerts /></EuiPanel></EuiFlexItem>
        },
      ]
    },
  ]
};