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

import React, { Component, Fragment } from 'react';

import withWzConfig from '../util-hocs/wz-config';
import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import WzConfigurationVulnerabilitiesGeneral from './vulnerabilities-general';
import WzConfigurationVulnerabilitiesProviders from './vulnerabilities-providers';
import { wodleBuilder } from '../utils/builders';

class WzConfigurationVulnerabilities extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(
      this.props.currentConfig,
      'vulnerability-detector'
    );
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.wodleConfig &&
      this.wodleConfig['vulnerability-detector'] &&
      this.wodleConfig['vulnerability-detector'].enabled === 'yes'
    );
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzTabSelector>
          <WzTabSelectorTab label="General">
            <WzConfigurationVulnerabilitiesGeneral
              currentConfig={currentConfig}
              wodleConfig={this.wodleConfig}
            />
          </WzTabSelectorTab>
          <WzTabSelectorTab label="Providers">
            <WzConfigurationVulnerabilitiesProviders
              currentConfig={currentConfig}
              wodleConfig={this.wodleConfig}
            />
          </WzTabSelectorTab>
        </WzTabSelector>
      </Fragment>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationVulnerabilities.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationVulnerabilities);
