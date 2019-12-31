import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

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

class WzConfigurationMonitoringIgnored extends Component{
  constructor(props){
    super(props);
  }
  render(){ //TODO: agent?
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.ignore && !currentConfig['syscheck-syscheck'].syscheck.ignore.length ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.ignore && currentConfig['syscheck-syscheck'].syscheck.ignore.length ? (
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
      </Fragment>
    )
  }
}

export default WzConfigurationMonitoringIgnored;