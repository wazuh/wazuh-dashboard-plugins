import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzNoConfig from "../util-components/no-config";
import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

const mainSettings = [
  { key: 'name', text: 'Bucket name' },
  { key: 'type', text: 'Bucket type' },
  { key: 'aws_account_id', text: 'AWS account ID' },
  { key: 'aws_account_alias', text: 'AWS account alias' },
  { key: 'aws_profile', text: 'Profile name with read permissions' },
  { key: 'iam_role_arn', text: 'IAM ARN role to read bucket logs' },
  { key: 'path', text: 'Bucket path' },
  { key: 'only_logs_after', text: 'Parse only logs from this date onwards' },
  { key: 'remove_from_bucket', text: 'Remove bucket logs after being read' },
  { key: 'regions', text: 'Limit log parsing to these regions' }
];

class WzConfigurationAmazonS3Buckets extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const items = settingsListBuilder(currentConfig['aws-s3'].buckets, 'name') //TODO: type?
    return (
      <Fragment>
        {currentConfig && currentConfig['aws-s3'] && !currentConfig['aws-s3'].buckets && (
          <WzNoConfig error='not-present' help={helpLinks}/>
          )}
        {/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['aws-s3']) && ( 
          <WzNoConfig error='Wazuh not ready yet' help={helpLinks}/>
        )}
        {currentConfig && currentConfig['aws-s3'] && currentConfig['aws-s3'].buckets && (
          <WzConfigurationTabSelector
            title='Main settings'
            description='Common settings applied to all Amazon S3 buckets'
            currentConfig={currentConfig}
            helpLinks={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationAmazonS3Buckets;