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
  EuiBasicTable,
  EuiSpacer
} from "@elastic/eui";

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';

const columnsPath = [
  { field: 'path', name: 'Path' }
];

const columnsSregex = [
  { field: 'sregex', name: 'Sregex' }
];

const columnsAgentWin = [
  { field: 'entry', name: 'Entry' },
  { field: 'arch', name: 'Arch' }
];

class WzConfigurationMonitoringIgnored extends Component{
  constructor(props){
    super(props);
  }
  render(){ 
    const { currentConfig, agent } = this.props;
    return (
      <Fragment>
        {((agent || {}).os || {}).platform !== 'windows' && currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.ignore && !currentConfig['syscheck-syscheck'].syscheck.ignore.length ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {((agent || {}).os || {}).platform !== 'windows' && currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.ignore && currentConfig['syscheck-syscheck'].syscheck.ignore.length ? (
          <Fragment>
            <WzConfigurationSettingsTabSelector
              title='Ignored files and directories'
              description='These files and directories are ignored from the integrity scan'
              currentConfig={currentConfig}
              helpLinks={helpLinks}
            >
              <EuiBasicTable
                items={currentConfig['syscheck-syscheck'].syscheck.ignore.map(item => ({path: item}))}
                columns={columnsPath}
              />
              <EuiSpacer size='s'/>
              <EuiBasicTable
                items={currentConfig['syscheck-syscheck'].syscheck.ignore_sregex.map(item => ({sregex: item}))}
                columns={columnsSregex}
              />
            </WzConfigurationSettingsTabSelector>
          </Fragment>
        ) : null}
        {((agent || {}).os || {}).platform === 'windows' && currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && !currentConfig['syscheck-syscheck'].syscheck.registry && !currentConfig['syscheck-syscheck'].syscheck.registry_ignore && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {((agent || {}).os || {}).platform === 'windows' && currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && (currentConfig['syscheck-syscheck'].syscheck.registry || currentConfig['syscheck-syscheck'].syscheck.registry_ignore) && (
          <WzConfigurationSettingsTabSelector 
            title='Ignored'
            description='A list of registry entries that will be ignored'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
            {currentConfig['syscheck-syscheck'].syscheck.registry_ignore && (
              <EuiBasicTable
                items={currentConfig['syscheck-syscheck'].syscheck.registry_ignore}
                columns={columnsAgentWin}
              />
            )}
            {currentConfig['syscheck-syscheck'].syscheck.registry_ignore_sregex && (
              <EuiBasicTable
                items={currentConfig['syscheck-syscheck'].syscheck.ignore_sregex}
                columns={columnsAgentWin}
              />
            )}
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

WzConfigurationMonitoringIgnored.proptTypes = {
  // currentConfig: PropTypes.object.isRequired,
  agent: PropTypes.object
};

export default WzConfigurationMonitoringIgnored;