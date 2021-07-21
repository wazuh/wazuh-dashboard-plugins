import React from 'react';
import KibanaVis from '../../../../kibana-integrations/kibana-vis';


export const DrilldownConfig = {
  rows: [
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Metric-alerts' tab='office' {...props} />
        },
        {
          width: 50,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Alerts-Evolution' tab='office' {...props} />
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 70,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Attacks-By-Agent' tab='office' {...props} />
        },
        {
          width: 30,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Attacks-By-Technique' tab='office' {...props} />
        },
      ]
    },
  ]
};
