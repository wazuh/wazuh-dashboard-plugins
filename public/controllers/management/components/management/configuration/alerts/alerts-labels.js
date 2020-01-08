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
import Proptypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import { isString, hasSize } from '../utils/utils';

import { connect } from 'react-redux';

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
    const { currentConfig, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {currentConfig['analysis-labels'] && isString(currentConfig['analysis-labels']) && (
          <WzNoConfig error='not-present'/>
        )}
        {currentConfig['analysis-labels'] && !isString(currentConfig['analysis-labels']) && !hasSize(currentConfig['analysis-labels'].labels) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {wazuhNotReadyYet && (!currentConfig || !currentConfig['analysis-labels']) && (
          <WzNoConfig error='Wazuh not ready yet'/>
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

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.configurationReducers.wazuhNotReadyYet
});

export default connect(mapStateToProps)(WzConfigurationAlertsLabels);