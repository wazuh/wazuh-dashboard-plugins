import React, { Component, Fragment } from "react";

import {
  EuiBasicTable,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTextAlign,
  EuiTitle
} from "@elastic/eui";

import WzConfigurationSettingsHeader from "../util-components/configuration-settings-header";
import WzConfigurationSettingsTabSelector from "../util-components/configuration-settings-tab-selector";
import WzViewSelector from "../util-components/view-selector";
import WzCodeViewer from "../util-components/code-viewer";
import { getJSON, getXML } from "../utils/wz-fetch";

const renderAllowedDeniedIPs = (items, label) => {
  if(items){
    return (
      <ul>
        {items.map(item => <li key={`remote-${label}-${key}`}>{item}</li>)}
      </ul>
    )
  }else{
    return '-'
  }
}

const helpLinks = [
  { text: 'Remote daemon reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/daemons/ossec-remoted.html' },
  { text: 'Remote configuration reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/remote.html' }
];

class WzConfigurationGlobalConfigurationRemote extends Component{
  constructor(props){
    super(props);
    this.columns = [ 
      { field: 'connection', name: 'Connection', render: (item) => item || '-' },
      { field: 'port', name: 'Port', render: (item) => item || '-' },
      { field: 'protocol', name: 'Protocol', render: (item) => item || 'udp' },
      { field: 'ipv6', name: 'IPv6', render: (item) => item || '-' },
      { field: 'allowed-ips', name: 'Allowed IPs', render: (item) => renderAllowedDeniedIPs(item, 'allowed')},
      { field: 'denied-ips', name: 'Denied Ips', render: (item) => renderAllowedDeniedIPs(item, 'denied')},
      { field: 'local_ip', name: 'Local IP', render: (item) => item || 'All interfaces' },
      { field: 'queue_size', name: 'Queue size', render: (item) => item || '16384' }
    ];
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <WzConfigurationSettingsTabSelector 
        title='Remote settings'
        description='Configuration to listen for events from the agents or a syslog client'
        currentConfig={currentConfig} helpLinks={helpLinks}>
          <EuiSpacer size='s'/>
          <EuiBasicTable
            columns={this.columns}
            items={currentConfig['request-remote'].remote}
          />
      </WzConfigurationSettingsTabSelector>
    )
  }
}


export default WzConfigurationGlobalConfigurationRemote;