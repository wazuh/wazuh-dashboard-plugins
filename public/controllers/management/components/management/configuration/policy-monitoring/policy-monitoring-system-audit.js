import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';

class WzPolicyMonitoringSystemAudit extends Component{
  constructor(props){
    super(props);
    this.columns = [
      {field: 'path', name: 'Path'}
    ];

  }
  render(){
    let { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig && currentConfig['syscheck-rootcheck'] && currentConfig['syscheck-rootcheck'].rootcheck && !currentConfig['syscheck-rootcheck'].rootcheck.system_audit && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {currentConfig && currentConfig['syscheck-rootcheck'] && currentConfig['syscheck-rootcheck'].rootcheck && currentConfig['syscheck-rootcheck'].rootcheck.system_audit && (
          <WzConfigurationSettingsTabSelector
            title='UNIX audit files'
            description='Specified paths to audit definition files for Unix-like systems'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
              <EuiBasicTable 
                items={currentConfig['syscheck-rootcheck'].rootcheck.system_audit}
                columns={this.columns}
              />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzPolicyMonitoringSystemAudit;