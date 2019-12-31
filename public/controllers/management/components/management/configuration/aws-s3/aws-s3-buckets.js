import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzNoConfig from "../util-components/no-config";
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

const mainSettings = [
  { field: 'name', label: 'Bucket name' },
  { field: 'type', label: 'Bucket type' },
  { field: 'aws_account_id', label: 'AWS account ID' },
  { field: 'aws_account_alias', label: 'AWS account alias' },
  { field: 'aws_profile', label: 'Profile name with read permissions' },
  { field: 'iam_role_arn', label: 'IAM ARN role to read bucket logs' },
  { field: 'path', label: 'Bucket path' },
  { field: 'only_logs_after', label: 'Parse only logs from this date onwards' },
  { field: 'remove_from_bucket', label: 'Remove bucket logs after being read' },
  { field: 'regions', label: 'Limit log parsing to these regions' }
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
          <WzConfigurationSettingsTabSelector
            title='Main settings'
            description='Common settings applied to all Amazon S3 buckets'
            currentConfig={currentConfig}
            helpLinks={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationAmazonS3Buckets;