import React from 'react';
import KibanaVis from '../../../kibana-integrations/kibana-vis';


const rows = [
    {
        height: 300,
        columns: [
            {
                width: 3,
                component: <KibanaVis visID={'Wazuh-App-Overview-OFFICE'} tab={'office'} />
            },
            {
                width: 3,
                component: <KibanaVis visID={'Wazuh-App-Overview-OFFICE-Alerts-Evolution'} tab={'office'} />
            },
        ]
    },
    {
        height: 300,
        columns: [
            {
                width: 3,
                component: <KibanaVis visID={'Wazuh-App-Overview-OFFICE-Attacks-By-Agent'} tab={'office'} />
            },
            {
                width: 3,
                component: <KibanaVis visID={'Wazuh-App-Overview-OFFICE-Attacks-By-Technique'} tab={'office'} />
            },
        ]
    },
]
export default rows;
