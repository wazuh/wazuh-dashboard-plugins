import React from 'react';
import KibanaVis from '../../../../kibana-integrations/kibana-vis';


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
          component: (props) => <KibanaVis visID='Wazuh-App-Overview-Office-Metric-alerts' tab='office' {...props} />
        },
      ]
    }
  ]
};