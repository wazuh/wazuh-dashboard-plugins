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

import React, { Component, Fragment } from 'react';

import withWzConfig from '../util-hocs/wz-config';
import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';

import WzConfigurationPolicyMonitoringGeneral from './policy-monitoring-general';
import WzConfigurationPolicyMonitoringSystemAudit from './policy-monitoring-system-audit';
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
    return (
      this.props.currentConfig['syscheck-rootcheck'] &&
      this.props.currentConfig['syscheck-rootcheck'].rootcheck &&
      this.props.currentConfig['syscheck-rootcheck'].rootcheck.disabled &&
      this.props.currentConfig['syscheck-rootcheck'].rootcheck.disabled === 'no'
    );
  }
  render() {
    return (
      <Fragment>
        {(this.props.onlyShowTab === 'Policy Monitoring' && (
          <WzTabSelector>
            <WzTabSelectorTab label="General">
              <WzConfigurationPolicyMonitoringGeneral {...this.props} />
            </WzTabSelectorTab>
            <WzTabSelectorTab label="Ignored">
              <WzConfigurationPolicyMonitoringIgnored {...this.props} />
            </WzTabSelectorTab>
          </WzTabSelector>
        )) ||
          (this.props.onlyShowTab === 'System audit' && (
            <WzConfigurationPolicyMonitoringSystemAudit {...this.props} />
          )) ||
          (this.props.onlyShowTab === 'SCA' && (
            <WzConfigurationPolicyMonitoringSCA {...this.props} />
          )) || (
            <WzTabSelector>
              <WzTabSelectorTab label="General">
                <WzConfigurationPolicyMonitoringGeneral {...this.props} />
              </WzTabSelectorTab>
              <WzTabSelectorTab label="System audit">
                <WzConfigurationPolicyMonitoringSystemAudit {...this.props} />
              </WzTabSelectorTab>
              <WzTabSelectorTab label="Ignored">
                <WzConfigurationPolicyMonitoringIgnored {...this.props} />
              </WzTabSelectorTab>
              <WzTabSelectorTab label="SCA">
                <WzConfigurationPolicyMonitoringSCA {...this.props} />
              </WzTabSelectorTab>
            </WzTabSelector>
          )}
      </Fragment>
    );
  }
}

const sections = [
  { component: 'syscheck', configuration: 'rootcheck' },
  { component: 'wmodules', configuration: 'wmodules' }
];

WzPolicyMonitoring.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzPolicyMonitoring);
