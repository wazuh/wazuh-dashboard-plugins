import React from 'react';
import { VisCard } from '../components/vis-card';


export const MainViewConfig = {
  rows: [
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => <div ><button onClick={() => props.onRowClick('drilldown')}>change view</button></div>
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