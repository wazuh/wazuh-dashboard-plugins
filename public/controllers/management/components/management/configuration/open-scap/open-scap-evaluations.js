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

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';

import helpLinks from './help-links';

const renderProfile = (item) => (
  <Fragment>
      {item && item.length ? (
        <ul>
          {item.map((profile,key) => <li key={`profile-${key}`}>{profile}</li>)}
        </ul>
      ) : '-'}
  </Fragment>
);

const columns = [
  { field: 'path', name: 'Path' },
  { field: 'profile', name: 'Profile', render: renderProfile },
  { field: 'type', name: 'Type' },
  { field: 'timeout', name: 'Timeout' },
];

class WzConfigurationOpenScapEvaluations extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const openSCAPConfig = {'open-scap' : currentConfig['open-scap']}
    return (
      <Fragment>
        <WzConfigurationSettingsTabSelector
          title='Evaluations'
          description='Scans executed according to specific security policies and their profiles'
          currentConfig={openSCAPConfig}
          helpLinks={helpLinks}>
          <EuiBasicTable
            columns={columns}
            items={currentConfig['open-scap'].content}/>
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    )
  }
}

WzConfigurationOpenScapEvaluations.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationOpenScapEvaluations;