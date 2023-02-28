/*
 * Wazuh app - React component for show configuration of AWS S3 - buckets tab.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import WzNoConfig from "../util-components/no-config";
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

import { connect } from 'react-redux';

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

class WzConfigurationAmazonS3Buckets extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wodleConfig, wazuhNotReadyYet } = this.props;
    const items =
      wodleConfig && wodleConfig['aws-s3'] && wodleConfig['aws-s3'].buckets
        ? settingsListBuilder(wodleConfig['aws-s3'].buckets, 'name')
        : {};
    return (
      <Fragment>
        {currentConfig &&
        (!wodleConfig['aws-s3'] || (wodleConfig['aws-s3'] && !wodleConfig['aws-s3'].buckets)) && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {wazuhNotReadyYet && (!currentConfig || !wodleConfig['aws-s3']) && (
          <WzNoConfig error="Wazuh not ready yet" help={helpLinks} />
        )}
        {currentConfig &&
          wodleConfig['aws-s3'] &&
          wodleConfig['aws-s3'].buckets && (
            <WzConfigurationSettingsTabSelector
              title="Main settings"
              description="Amazon buckets from where logs are read"
              currentConfig={wodleConfig}
              minusHeight={320}
              helpLinks={helpLinks}
            >
              <WzConfigurationListSelector
                items={items}
                settings={mainSettings}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
});

WzConfigurationAmazonS3Buckets.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
};

export default connect(mapStateToProps)(WzConfigurationAmazonS3Buckets);
