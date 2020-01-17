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

import React, { Component } from "react";
import PropTypes from "prop-types";

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';

import helpLinks from './help-links';
import { renderValueNoThenEnabled } from '../utils/utils';

const mainSettings = [
  {field: 'disabled', label: 'OpenSCAP integration status', render: renderValueNoThenEnabled },
  {field: 'timeout', label: 'Timeout (in seconds) for scan executions' },
  {field: 'interval', label: 'Interval between scan executions' },
  {field: 'scan-on-start', label: 'Scan on start' }
];

class WzConfigurationOpenSCAPGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <WzConfigurationSettingsTabSelector
          title='Main settings'
          description='These settings apply to all OpenSCAP evaluations'
          currentConfig={currentConfig}
          helpLinks={helpLinks}>
          <WzConfigurationSettingsGroup
            config={currentConfig['open-scap']}
            items={mainSettings}
          />
        </WzConfigurationSettingsTabSelector>
    )
  }
}

WzConfigurationOpenSCAPGeneral.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationOpenSCAPGeneral;