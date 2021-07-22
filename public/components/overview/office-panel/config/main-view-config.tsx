import React from 'react';
import KibanaVis from '../../../../kibana-integrations/kibana-vis';


export const MainViewConfig = {
  rows: [
    {
      height: 110,
      columns: [
        {
          width: 50,
          component: (props) => <div ><button onClick={() => props.onRowClick('drilldown')}>change view</button></div>
        },
        {
          width: 50,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Alerts-Top-Mitre' tab='office' {...props} />
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Alert-level-evolution' tab='office' {...props} />
        },
        {
          width: 50,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Top-5-agents-Evolution' tab='office' {...props} />
        },
      ]
    },
    {
      height: 300,
      columns: [
        {
          width: 50,
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Alerts-summary' tab='office' {...props} />
        },
      ]
    },
  ]
};