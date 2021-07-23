import React from 'react';
import { VisCard } from '../components/vis-card';


export const MainViewConfig = {
  rows: [
    {
      height: 200,
      columns: [
        {
          width: 50,
          component: (props) => <div ><button onClick={() => props.onRowClick('drilldown')}>change view</button></div>
        },
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Alerts-Top-Mitre' tab='office' title='' {...props} />
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Alert-level-evolution' tab='office' {...props} />
        },
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Top-5-agents-Evolution' tab='office' {...props} />
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