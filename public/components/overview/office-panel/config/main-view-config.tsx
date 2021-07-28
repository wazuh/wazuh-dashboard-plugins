import React from 'react';
import { VisCard, AggTable } from '../../../common/modules/panel/';

export const MainViewConfig = {
  rows: [
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => (
            <AggTable
              tableTitle={'Users'}
              aggTerm={'data.office365.UserId'}
              aggLabel={'User'}
              maxRows={'7'} 
              onRowClick={(field, value) => props.onRowClick(field, value)} />)
        },
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-User-By-Operation-Result' tab='office' title='' {...props} />
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-IPs-By-User-Table' tab='office' {...props} />
        },
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Rule-Level-Histogram' tab='office' {...props} />
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Alerts-summary' tab='office' {...props} />
        },
      ]
    },
  ]
};