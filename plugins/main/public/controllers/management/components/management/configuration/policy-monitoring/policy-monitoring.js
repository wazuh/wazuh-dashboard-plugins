/*
 * Wazuh app - React component for React component for show configuration of policy monitoring.
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
import { reportedEnabled } from '../utils/utils';
import WzTabSelector, {
  WzTabSelectorTab,
} from '../util-components/tab-selector';

import WzConfigurationPolicyMonitoringGeneral from './policy-monitoring-general';
import WzConfigurationPolicyMonitoringIgnored from './policy-monitoring-ignored';
import WzConfigurationPolicyMonitoringSCA from './policy-monitoring-sca';

class WzPolicyMonitoring extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return reportedEnabled(
      this.props.currentConfig?.fim?.rootcheck?.disabled,
      'no',
    );
  }
  render() {
    return (
      <WzTabSelector>
        <WzTabSelectorTab label='General'>
          <WzConfigurationPolicyMonitoringGeneral {...this.props} />
        </WzTabSelectorTab>
        <WzTabSelectorTab label='Ignored'>
          <WzConfigurationPolicyMonitoringIgnored {...this.props} />
        </WzTabSelectorTab>
        <WzTabSelectorTab label='SCA'>
          <WzConfigurationPolicyMonitoringSCA {...this.props} />
        </WzTabSelectorTab>
      </WzTabSelector>
    );
  }
}

WzPolicyMonitoring.propTypes = {
  currentConfig: PropTypes.object,
};

export default withWzConfig()(WzPolicyMonitoring);
