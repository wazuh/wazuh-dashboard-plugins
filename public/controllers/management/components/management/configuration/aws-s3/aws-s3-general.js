import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzSettingsGroup from '../util-components/configuration-settings-group';

import { renderValueNoThenEnabled, renderValueOrYes } from '../utils/utils';

import helpLinks from './help-links';

const mainSettings = [
  { field: 'disabled', label: 'Amazon S3 integration status', render: renderValueNoThenEnabled },
  { field: 'interval', label: 'Frequency for reading from S3 buckets' },
  { field: 'run_on_start', label: 'Run on start' },
  { field: 'remove_from_bucket', label: 'Remove bucket logs after being read', render: renderValueOrYes },
  { field: 'skip_on_error', label: "Skip logs that can't be processed" }
];

class WzConfigurationAmazonS3General extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsTabSelector
          title='Main settings'
          description='Common settings applied to all Amazon S3 buckets'
          currentConfig={currentConfig}
          helpLinks={helpLinks}
        >
          <WzSettingsGroup
            config={currentConfig['aws-s3'].syscheck}
            items={mainSettings}
          />
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    )
  }
}

export default WzConfigurationAmazonS3General;