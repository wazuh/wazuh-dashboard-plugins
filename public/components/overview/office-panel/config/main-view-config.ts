import KibanaVis from '../../../../kibana-integrations/kibana-vis';


export const MainViewConfig = {
    rows: [
        {
            height: 300,
            columns: [
                {
                    width: 50,
                    component: KibanaVis,
                    props: { visID: 'Wazuh-App-Overview-OFFICE', tab: 'office' }
                },
                {
                    width: 50,
                    component: KibanaVis,
                    props: { visID: 'Wazuh-App-Overview-OFFICE-Alerts-Evolution', tab: 'office' }
                },
            ]
        },
        {
            height: 300,
            columns: [
                {
                    width: 70,
                    component: KibanaVis,
                    props: { visID: 'Wazuh-App-Overview-OFFICE-Attacks-By-Agent', tab: 'office' }
                },
                {
                    width: 30,
                    component: KibanaVis,
                    props: { visID: 'Wazuh-App-Overview-OFFICE-Attacks-By-Technique', tab: 'office' }
                },
            ]
        },
    ]
};
