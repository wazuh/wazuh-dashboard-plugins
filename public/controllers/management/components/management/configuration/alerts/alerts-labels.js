import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable,
  EuiSpacer
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import { isString, hasSize } from '../utils/utils';

const columns = [ 
  { field: 'label_key', name: 'Label key' },
  { field: 'label_value', name: 'Label value' },
  { field: 'label_hidden', name: 'Hidden' }
];

const helpLinks = [
  {text: 'Labels documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/labels.html'},
  {text: 'Labels reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/labels.html'}
];

class WzConfigurationAlertsLabels extends Component{
  constructor(props){
    super(props);
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
            <WzNoConfig error='not-present' help={helpLinks}/>
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
              columns={columns}
              items={currentConfig['analysis-labels'].labels}/>
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationAlertsLabels;