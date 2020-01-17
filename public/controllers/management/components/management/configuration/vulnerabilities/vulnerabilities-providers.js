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
  EuiFlexGroup,
  EuiFlexItem
} from "@elastic/eui";

import WzNoConfig from "../util-components/no-config";
import WzConfigurationSettingsTabSelector from "../util-components/configuration-settings-tab-selector";
import { renderValueOrNoValue } from '../utils/utils';
import helpLinks from './help-links';

const renderTableField = (item) => item || '-';

const renderUrlAttr = (item) => {
  if(item){
    return (
      <Fragment>
        {item.start && (
          <div><b>Start: </b>{item.start}</div>
        )}
        {item.end && (
          <div><b>End: </b>{item.end}</div>
        )}
        {item.port && (
            <div><b>Port: </b>{item.port}</div>
        )}
      </Fragment>
      
      )
  }
  return '-'
}

const columnsAllowAttr = [
  { field: 'replaced_os' , name: 'Replaced OS', render: renderTableField },
  { field: 'src' , name: 'Source', render: (item) => renderTableField(item.toString()) },
];

const renderAllowAttr = (item) => {
  if(item){
    return (
      <EuiBasicTable 
        items={item}
        columns={columnsAllowAttr}
      />
    )
  }
  return '-'
}

const columns = [
  { field: 'name', name: 'Name' , render: renderValueOrNoValue },
  { field: 'version', name: 'Version' , render: renderValueOrNoValue },
  { field: 'update_interval', name: 'Update interval' , render: renderValueOrNoValue },
  { field: 'update_from_year', name: 'Update from year' , render: renderValueOrNoValue },
  { field: 'path', name: 'Path' , render: renderValueOrNoValue },
  { field: 'url', name: 'URL' , render: renderValueOrNoValue },
  { field: 'url_attrs', name: 'URL attributes', render: renderUrlAttr },
  { field: 'allow', name: 'Allow', render: renderAllowAttr }
];

class WzConfigurationVulnerabilitiesProviders extends Component{
  constructor(props){
    super(props);
  }
  render(){
    let { currentConfig } = this.props;
    //TODO: delete testing 
    // Testing data to see the render of this properties
    // if(currentConfig['vulnerability-detector'].providers){
    //   currentConfig['vulnerability-detector'].providers[0].url_attrs = {
    //     start: 1, end: 2, port: 1323
    //   }
    //   currentConfig['vulnerability-detector'].providers[0].allow = [
    //     { replaced_os: 'linux', src:'DATA'},
    //     { replaced_os: 'win10', src:'DATA2'}
    //   ]
    // }
    return (
      <Fragment>
        {(currentConfig['vulnerability-detector'] && !currentConfig['vulnerability-detector'].providers && (
          <WzNoConfig error='not-present' help={helpLinks}></WzNoConfig>
        )) || (
          <Fragment>
            <WzConfigurationSettingsTabSelector
              title='Providers'
              description='List of OVAL databases providers to check for vulnerability scans'
              currentConfig={currentConfig}
              helpLinks={helpLinks}
            >
              <EuiBasicTable
                items={currentConfig['vulnerability-detector'].providers}
                columns={columns}/>
            </WzConfigurationSettingsTabSelector>
          </Fragment>
        )}
      </Fragment>
    )
  }
}

WzConfigurationVulnerabilitiesProviders.propTypes = {
  config: PropTypes.object.isRequired
};

export default WzConfigurationVulnerabilitiesProviders;