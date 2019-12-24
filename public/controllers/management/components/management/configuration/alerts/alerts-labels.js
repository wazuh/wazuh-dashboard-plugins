import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable,
  EuiSpacer
} from "@elastic/eui";

import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import { WzSettingsViewer } from '../util-components/code-viewer';
import { isString, hasSize, getJSON, getXML } from '../utils/wz-fetch';

class WzConfigurationAlertsLabels extends Component{
  constructor(props){
    super(props);
    this.columns = [ 
      { field: 'label_key', name: 'Label key' },
      { field: 'label_value', name: 'Label value' },
      { field: 'label_hidden', name: 'Hidden' }
    ];
    this.helpLinks = [
      {text: 'Labels documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/labels.html'},
      {text: 'Labels reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/labels.html'}
    ];
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['analysis-labels'] && isString(currentConfig['analysis-labels']) && (
          <WzNoConfig error='not-present'/>
        )}
        {currentConfig['analysis-labels'] && !isString(currentConfig['analysis-labels']) && !hasSize(currentConfig['analysis-labels'].labels) && (
          <Fragment>
            <EuiSpacer size='s'/>
            <WzNoConfig error='not-present' help={this.helpLinks}/>
          </Fragment>
        )}
        {/*wazuhNotReadyYet && */ (!currentConfig || !currentConfig['analysis-labels']) && ( /* TODO: wazuhNotReady */
          <Fragment>
            <EuiSpacer size='s'/>
            <WzNoConfig error='Wazuh not ready yet'/>
          </Fragment>
        )}
        {currentConfig['analysis-labels'] && isString(currentConfig['analysis-labels']) && !hasSize(currentConfig['analysis-labels'].labels) && (
          <WzConfigurationSettingsTabSelector title='Defined labels'currentConfig={currentConfig} helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup
              config={mainSettingsConfig}
              items={mainSettings}
            />
            <EuiBasicTable
              columns={this.columns}
              items={currentConfig['analysis-labels'].labels}/>
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationAlertsLabels;