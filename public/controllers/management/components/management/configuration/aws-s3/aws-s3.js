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
  
} from "@elastic/eui";

import WzConfigurationPath from "../util-components/configuration-path";
import WzNoConfig from "../util-components/no-config";
import WzTabSelector from "../util-components/tab-selector";
import withWzConfig from "../util-hocs/wz-config";
import { isString } from '../utils/utils';
import { wodleBuilder } from '../utils/builders';

import WzConfigurationAmazonS3General from './aws-s3-general';
import WzConfigurationAmazonS3Buckets from './aws-s3-buckets';
import WzConfigurationAmazonS3Services from './aws-s3-services';

const helpLinks = [
  { text: 'Using Wazuh to monitor AWS', href: 'https://documentation.wazuh.com/current/amazon/index.html' },
  { text: 'Amazon S3 module reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-s3.html' },
];

class WzConfigurationAmazonS3 extends Component{
  constructor(props){
    super(props);
  }
  componentDidMount(){
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled(){
    return (this.props.currentConfig && this.props.currentConfig['aws-s3'] && this.props.currentConfig['aws-s3'].disabled === 'no') || false;
  }
  render(){
    let { currentConfig } = this.props;
    currentConfig = wodleBuilder(currentConfig, 'aws-s3');
    return (
      <WzTabSelector>
        <div label='General'>
          <WzConfigurationAmazonS3General currentConfig={currentConfig}/>
        </div>
        <div label='Buckets'>
          <WzConfigurationAmazonS3Buckets currentConfig={currentConfig}/>
        </div>
        <div label='Services'>
          <WzConfigurationAmazonS3Services currentConfig={currentConfig}/>
        </div>
      </WzTabSelector>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig(sections)(WzConfigurationAmazonS3);