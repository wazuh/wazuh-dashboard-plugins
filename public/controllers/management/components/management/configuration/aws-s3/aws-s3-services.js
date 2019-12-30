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
  { field: 'type', label: 'Service type' },
  { field: 'aws_profile', label: 'Profile name with read permissions' },
  { field: 'account_alias', label: 'AWS account alias' },
  { field: 'iam_role_arn', label: 'IAM ARN role to read bucket logs' },
  { field: 'only_logs_after', label: 'Parse only logs from this date onwards' },
  { field: 'regions', label: 'Limit log parsing to these regions' }
];

class WzConfigurationAmazonS3Services extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const items = settingsListBuilder(currentConfig['aws-s3'].services, 'type');
    return (
      <Fragment>
        {urrentConfig && currentConfig['aws-s3'] && !currentConfig['aws-s3'].services && (
          <WzNoConfig error='not-present' help={helpLinks}/>
          )}
        {/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['aws-s3']) && ( 
          <WzNoConfig error='Wazuh not ready yet' help={helpLinks}/>
        )}
        {currentConfig && currentConfig['aws-s3'] && currentConfig['aws-s3'].services && (
          <WzConfigurationTabSelector
            title='Services'
            description='Amazon services from where logs are read'
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

export default WzConfigurationAmazonS3Services;