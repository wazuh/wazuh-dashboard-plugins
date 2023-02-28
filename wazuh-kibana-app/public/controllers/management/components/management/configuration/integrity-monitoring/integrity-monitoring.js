/*
 * Wazuh app - React component for show configuration of integrity monitoring.
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
import WzNoConfig from '../util-components/no-config';
import { isString } from '../utils/utils';
import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import helpLinks from './help-links';

import WzConfigurationIntegrityMonitoringGeneral from './integrity-monitoring-general';
import WzConfigurationIntegrityMonitoringMonitored from './integrity-monitoring-monitored';
import WzConfigurationIntegrityMonitoringIgnored from './integrity-monitoring-ignored';
import WzConfigurationIntegrityMonitoringNoDiff from './integrity-monitoring-no-diff';
import WzConfigurationIntegrityMonitoringWhoData from './integrity-monitoring-who-data';
import WzConfigurationIntegrityMonitoringSynchronization from './integrity-monitoring-synchronization';
import WzConfigurationIntegrityMonitoringFileLimit from './integrity-monitoring-file-limit';

class WzConfigurationIntegrityMonitoring extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.props.currentConfig['syscheck-syscheck'] &&
      this.props.currentConfig['syscheck-syscheck'].syscheck &&
      this.props.currentConfig['syscheck-syscheck'].syscheck.disabled &&
      this.props.currentConfig['syscheck-syscheck'].syscheck.disabled === 'no'
    );
  }
  render() {
    const { currentConfig, agent } = this.props;
    const agentPlatform = ((agent || {}).os || {}).platform;
    return (
      <Fragment>
        {currentConfig['syscheck-syscheck'] &&
          isString(currentConfig['syscheck-syscheck']) && (
            <WzNoConfig
              error={currentConfig['syscheck-syscheck']}
              help={helpLinks}
            />
          )}
        {currentConfig['syscheck-syscheck'] &&
          !isString(currentConfig['syscheck-syscheck']) &&
          !currentConfig['syscheck-syscheck'].syscheck && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {currentConfig['syscheck-syscheck'] &&
          !isString(currentConfig['syscheck-syscheck']) &&
          currentConfig['syscheck-syscheck'].syscheck && (
            <WzTabSelector>
              <WzTabSelectorTab label="General">
                <WzConfigurationIntegrityMonitoringGeneral {...this.props} />
              </WzTabSelectorTab>
              <WzTabSelectorTab label="Monitored">
                <WzConfigurationIntegrityMonitoringMonitored {...this.props} />
              </WzTabSelectorTab>
              <WzTabSelectorTab label="Ignored">
                <WzConfigurationIntegrityMonitoringIgnored {...this.props} />
              </WzTabSelectorTab>
              <WzTabSelectorTab label="No diff">
                <WzConfigurationIntegrityMonitoringNoDiff {...this.props} />
              </WzTabSelectorTab>
              {agentPlatform !== 'windows' && (
                <WzTabSelectorTab label="Who-data">
                  <WzConfigurationIntegrityMonitoringWhoData {...this.props} />
                </WzTabSelectorTab>
              )}
              <WzTabSelectorTab label="Synchronization">
                <WzConfigurationIntegrityMonitoringSynchronization
                  {...this.props}
                />
              </WzTabSelectorTab>
              <WzTabSelectorTab label="File limit">
                <WzConfigurationIntegrityMonitoringFileLimit {...this.props} />
              </WzTabSelectorTab>
            </WzTabSelector>
          )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'syscheck', configuration: 'syscheck' }];

WzConfigurationIntegrityMonitoring.proptTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationIntegrityMonitoring);
