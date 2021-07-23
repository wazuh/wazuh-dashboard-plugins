import React from 'react';
import { VisCard } from '../components/vis-card';


export const DrilldownConfig = {
  rows: [
    {
      height: 230,
      columns: [
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Metric-alerts' tab='office' {...props} />
        },
        {
          width: 50,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Authentication-success' tab='office' {...props} />
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 70,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Agents-status' tab='office' {...props} />
        },
        {
          width: 30,
          component: (props) => <VisCard id='Wazuh-App-Overview-Office-Alert-level-evolution' tab='office' {...props} />
        },
      ]
    },
  ]
};
