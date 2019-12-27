import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';

const columnsPath = [
  { field: 'path', name: 'Path' }
];

class WzConfigurationIntegrityMonitoringNoDiff extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && !currentConfig['syscheck-syscheck'].syscheck.nodiff && (
          <WzNoConfig error='not-present' help={helpLinks} />
        )}
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.nodiff && (
          <WzConfigurationTabSelector
            title='No diff directories'
            description="This files won't have their diff calculated"
            currentConfig={currentConfig}
            helpLinks={helpLinks}
          >
            <EuiBasicTable
              items={currentConfig['syscheck-syscheck'].syscheck.nodiff.map(item => ({path: item}))}
              columns={columnsPath}
            />
          </WzConfigurationTabSelector>
          )}
      </Fragment>
    )
  }
}

export default WzConfigurationIntegrityMonitoringNoDiff;