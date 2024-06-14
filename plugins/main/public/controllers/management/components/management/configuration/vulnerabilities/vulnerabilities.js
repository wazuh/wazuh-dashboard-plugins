/*
 * Wazuh app - React component for show configuration of vulnerabilities.
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

import withWzConfig from '../util-hocs/wz-config';
import { wodleBuilder } from '../utils/builders';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzNoConfig from '../util-components/no-config';
import { isString, renderValueYesThenEnabled } from '../utils/utils';
import helpLinks from './help-links';

const mainSettings = [
  {
    field: 'enabled',
    label: 'Enables the vulnerability detection module',
    render: renderValueYesThenEnabled,
  },
  {
    field: 'feed-update-interval',
    label: 'Time interval for periodic feed updates',
  },
];

class WzConfigurationVulnerabilities extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(
      this.props.currentConfig,
      'vulnerability-detection',
    );
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.wodleConfig &&
      this.wodleConfig['vulnerability-detection'] &&
      this.wodleConfig['vulnerability-detection'].enabled === 'yes'
    );
  }

  // TODO: This functionalities is repeated in other configuration components.
  // Maybe it should be extracted to a util function.

  // If it is a string,
  // it is an error message and the error view should be displayed.
  problemFetchingConfiguration() {
    const hasProblem = isString(
      this.props.currentConfig?.['wmodules-wmodules'],
    );
    return hasProblem;
  }

  // If it is not a string and the object does not have the vulnerability detection configuration,
  // it must show the configuration view not configured.
  currentConfigHasVulnerabilityDetection() {
    const hasVulnerabilityDetection =
      !isString(this.props.currentConfig?.['wmodules-wmodules']) &&
      !this.wodleConfig?.['vulnerability-detection'];
    return hasVulnerabilityDetection;
  }

  render() {
    const { currentConfig } = this.props;
    return (
      <>
        {this.problemFetchingConfiguration() && (
          <WzNoConfig
            error={currentConfig['wmodules-wmodules']}
            help={helpLinks}
          />
        )}
        {this.currentConfigHasVulnerabilityDetection() && (
          <WzNoConfig error='not-present' help={helpLinks} />
        )}
        {this.wodleConfig?.['vulnerability-detection'] && (
          <WzConfigurationSettingsHeader
            title='Main settings'
            description='General settings applied to the vulnerability detector and its providers'
            help={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={this.wodleConfig['vulnerability-detection']}
              items={mainSettings}
            />
          </WzConfigurationSettingsHeader>
        )}
      </>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationVulnerabilities.propTypes = {
  currentConfig: PropTypes.object.isRequired,
};

export default withWzConfig(sections)(WzConfigurationVulnerabilities);
