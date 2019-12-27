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
  badgeEnabled(){
    return this.props.currentConfig && this.props.currentConfig['aws-s3'] && this.props.currentConfig['aws-s3'].disabled === 'no'
  }
  render(){
    let { currentConfig } = this.props;
    currentConfig = wodleBuilder(currentConfig, 'aws-s3');
    return (
      <Fragment>
        <WzConfigurationPath title='Amazon S3' description='Security events related to Amazon AWS services, collected directly via AWS API' updateConfigurationSection={this.props.updateConfigurationSection} badge={this.badgeEnabled()}/>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']} help={helpLinks} />
          )}
        {currentConfig && !currentConfig['aws-s3'] && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present' help={helpLinks} />
        )}
        {currentConfig && currentConfig['aws-s3'] && (
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
        )}
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig('000', sections)(WzConfigurationAmazonS3);