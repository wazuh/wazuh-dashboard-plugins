/*
 * Wazuh app - React component for show configuration of AWS S3.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import WzTabSelector, {
  WzTabSelectorTab,
} from '../util-components/tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import { wodleBuilder } from '../utils/builders';

import WzConfigurationAmazonS3General from './aws-s3-general';
import WzConfigurationAmazonS3Buckets from './aws-s3-buckets';
import WzConfigurationAmazonS3Services from './aws-s3-services';
import { i18n } from '@kbn/i18n';

class WzConfigurationAmazonS3 extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'aws-s3');
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.wodleConfig &&
      this.wodleConfig['aws-s3'] &&
      this.wodleConfig['aws-s3'].disabled === 'no'
    );
  }
  render() {
    return (
      <WzTabSelector>
        <WzTabSelectorTab
          label={i18n.translate(
            'wazuh.public.controller.management.config.aws.s3.js.General',
            {
              defaultMessage: 'General',
            },
          )}
        >
          <WzConfigurationAmazonS3General
            currentConfig={this.props.currentConfig}
            wodleConfig={this.wodleConfig}
          />
        </WzTabSelectorTab>
        <WzTabSelectorTab
          label={i18n.translate(
            'wazuh.public.controller.management.config.aws.s3.js.Buckets',
            {
              defaultMessage: 'Buckets',
            },
          )}
        >
          <WzConfigurationAmazonS3Buckets
            currentConfig={this.props.currentConfig}
            wodleConfig={this.wodleConfig}
          />
        </WzTabSelectorTab>
        <WzTabSelectorTab
          label={i18n.translate(
            'wazuh.public.controller.management.config.aws.s3.js.Services',
            {
              defaultMessage: 'Services',
            },
          )}
        >
          <WzConfigurationAmazonS3Services
            currentConfig={this.props.currentConfig}
            wodleConfig={this.wodleConfig}
          />
        </WzTabSelectorTab>
      </WzTabSelector>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationAmazonS3.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default withWzConfig(sections)(WzConfigurationAmazonS3);
