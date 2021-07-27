import React from 'react';
import { VisCard } from '../components/vis-card';
import { AggTable } from '../../../common/modules/panel';

// AggTable = ({
//   onRowClick = (field, value) => {},
//   aggTerm,
//   aggLabel,
//   maxRows,
//   tableTitle,
//   panelProps,
//   titleProps
// }
// {
//   +      flexProps: { style: { minWidth: 500 }, grow:6 },
//   +      tableProps: {
//   +        aggTerm: 'agent.name',
//   +        aggLabel: 'Agent Name',
//   +        maxRows: '10',
//   +        tableTitle: 'Agents by name',
//   +      },
//   +    },
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
              onRowClick={(field, value) => props.onRowClick('drilldown')} />)
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