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

import WzNoConfig from "../util-components/no-config";

import helpLinks from './help-links';

const columns = [
  { field: 'path', name: 'Path' },
  { field: 'profile', name: 'Profile' },
  { field: 'timeout', name: 'Timeout' },
  { field: 'type', name: 'Type' }
]
class WzConfigurationCisCatBenchmarks extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { config } = this.props;
    return (
      <Fragment>
        {(!config['cis-cat'].content && (
          <WzNoConfig error='not-present' help={helpLinks}></WzNoConfig>
        )) || (
          <Fragment>
            <WzConfigurationSettingsTabSelector
              title='Benchmarks'
              description='List of CIS-CAT benchmark templates to perform scans'
              currentConfig={config}
              helpLinks={helpLinks}
            >
            <EuiBasicTable
              items={config['cis-cat']}
              columns={columns}/>
            </WzConfigurationSettingsTabSelector>

          </Fragment>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationCisCatBenchmarks;