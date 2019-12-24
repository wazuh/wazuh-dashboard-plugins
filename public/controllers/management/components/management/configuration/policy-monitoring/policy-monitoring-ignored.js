import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzViewSelector from '../util-components/view-selector';
import { WzJSONViewer, WzXMLViewer } from '../util-components/code-viewer';
import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import helpLinks from './help-links.js';

const columnsIgnore = [
  {field: 'path', name: 'Path'}
];

const columnsIgnoreSregex = [
  {field: 'path', name: 'Sregex'}
];

class WzConfigurationPolicyMonitoringSystemAudit extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const itemsIgnore = currentConfig['syscheck-rootcheck'].rootcheck.ignore;
    const itemsIgnoreSregex = currentConfig['syscheck-rootcheck'].rootcheck.ignore_sregex;
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
                    <EuiBasiTable 
                      items={itemsIgnore}
                      columns={columnsIgnore}
                    />
                  </Fragment>
                )}
                {(currentConfig['syscheck-rootcheck'].rootcheck.ignore_sregex || {}).length && (
                  <Fragment>
                    <EuiBasiTable 
                      items={itemsIgnoreSregex}
                      columns={columnsIgnoreSregex}/>
                  </Fragment>
                )}
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationPolicyMonitoringSystemAudit;