/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import helpLinks from './help-links.js';

const columnsIgnore = [
  { field: 'path', name: 'Path' }
];

const columnsIgnoreSregex = [
  { field: 'sreg', name: 'Sregex' }
];

class WzConfigurationPolicyMonitoringSystemAudit extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig && currentConfig['syscheck-rootcheck'] && currentConfig['syscheck-rootcheck'].rootcheck && (!currentConfig['syscheck-rootcheck'].rootcheck.ignore || ( currentConfig['syscheck-rootcheck'].rootcheck.ignore && !currentConfig['syscheck-rootcheck'].rootcheck.ignore.length)) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        ) || (
          <WzConfigurationSettingsTabSelector
            title='Ignored files and directories'
            description='These files and directories are ignored from the rootcheck scan'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
              {(currentConfig['syscheck-rootcheck'].rootcheck.ignore || {}).length && (
                <Fragment>
                  <EuiBasicTable 
                    items={currentConfig['syscheck-rootcheck'].rootcheck.ignore}
                    columns={columnsIgnore}
                  />
                </Fragment>
              )}
              {(currentConfig['syscheck-rootcheck'].rootcheck.ignore_sregex || {}).length && (
                <Fragment>
                  <EuiBasicTable 
                    items={currentConfig['syscheck-rootcheck'].rootcheck.ignore_sregex}
                    columns={columnsIgnoreSregex}/>
                </Fragment>
              )}
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

WzConfigurationPolicyMonitoringSystemAudit.propTypes = {
  currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationPolicyMonitoringSystemAudit;