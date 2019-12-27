import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzSettingsGroup from '../util-components/configuration-settings-group';

import { renderValueNoThenEnabled, renderValueOrYes } from '../utils/utils';

import helpLinks from './help-links';

const mainSettings = [
  { key: 'disabled', text: 'Amazon S3 integration status', render: renderValueNoThenEnabled },
  { key: 'interval', text: 'Frequency for reading from S3 buckets' },
  { key: 'run_on_start', text: 'Run on start' },
  { key: 'remove_from_bucket', text: 'Remove bucket logs after being read', render: renderValueOrYes },
  { key: 'skip_on_error', text: "Skip logs that can't be processed" }
];

class WzConfigurationAmazonS3General extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationTabSelector
          title='Main settings'
          description='Common settings applied to all Amazon S3 buckets'
          currentConfig={currentConfig}
          helpLinks={helpLinks}
        >
          <WzSettingsGroup
            config={currentConfig['aws-s3'].syscheck}
            items={mainSettings}
          />
        </WzConfigurationTabSelector>
      </Fragment>
    )
  }
}

export default WzConfigurationAmazonS3General;