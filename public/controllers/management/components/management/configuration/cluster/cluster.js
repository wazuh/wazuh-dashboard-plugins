import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";
import WzNoConfig from '../util-components/no-config';

import {
  EuiSpacer  
} from "@elastic/eui";

import WzConfigurationPath from '../util-components/configuration-path';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';

import withWzConfig from '../util-hocs/wz-config';
import { isString } from "../utils/utils";

const mainSettings = [
  { key: 'disabled', text: 'Cluster status'},
  { key: 'jsonout_output', text: 'Cluster name' },
  { key: 'name', text: 'Node name' },
  { key: 'node_type', text: 'Node type' },
  { key: 'nodes', text: 'Master node IP address' },
  { key: 'port', text: 'Port to listen to cluster communications' },
  { key: 'bind_addr', text: 'IP address to listen to cluster communications' },
  { key: 'hidden', text: 'Hide cluster information in alerts' }
];

const helpLinks = [
  { text: 'How to configure the Wazuh cluster', href: 'https://documentation.wazuh.com/current/user-manual/configuring-cluster/index.html' },
  { text: 'Wazuh cluster reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/cluster.html' }
];

class WzCluster extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    let mainSettingsConfig = {
      ...currentConfig['com-cluster'],
      disabled: currentConfig['com-cluster'].disabled === 'yes'? 'disabled' : 'enabled'
    };
    return (
      <Fragment>
        <WzConfigurationPath title='Cluster' description='Master node configuration' path='Cluster' updateConfigurationSection={this.props.updateConfigurationSection}/>
        {currentConfig['com-cluster'] && isString(currentConfig['com-cluster']) && (
          <WzNoConfig error={currentConfig['com-cluster']} help={helpLinks}/>
        )}
        {/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['com-cluster']) && (
          <WzNoConfig error='Wazuh not ready yet' help={helpLinks}/>
        )}
        <WzConfigurationSettingsTabSelector title='Main settings' currentConfig={currentConfig} helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup
              config={mainSettingsConfig}
              items={mainSettings}
            />
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    )
  }
}

const sections = [{component:'com',configuration:'cluster'}];

export default withWzConfig('000', sections)(WzCluster);