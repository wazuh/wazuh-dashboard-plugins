/*
 * Wazuh app - React component for show configuration of policy monitoring - sca tab.
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

import { EuiBasicTable } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import helpLinks from './help-links';
import { renderValueYesThenEnabled } from '../utils/utils';
import { wodleBuilder } from '../utils/builders';

const securitySettings = [
  {
    field: 'enabled',
    label: 'Security configuration assessment status',
    render: renderValueYesThenEnabled,
  },
  { field: 'interval', label: 'Interval' },
  { field: 'scan_on_start', label: 'Scan on start' },
  { field: 'skip_nfs', label: 'Skip nfs' },
];

const columns = [{ field: 'policy', name: 'Name' }];

/**
 * Build the table rows from the reported policies.
 *
 * A policy is reported as `{ policy: <path> }`, and the block is absent
 * altogether when no policy is enabled. Bare paths are still accepted so a
 * report that carries them renders instead of breaking the tab.
 */
const buildPolicyItems = policies => {
  const reported = Array.isArray(policies)
    ? policies
    : policies
    ? [policies]
    : [];
  return reported.map(entry =>
    typeof entry === 'string' ? { policy: entry } : entry,
  );
};

class WzPolicyMonitoringSCA extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'sca');
  }
  render() {
    if (!this.wodleConfig.sca) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    const policyItems = buildPolicyItems(this.wodleConfig.sca.policies);

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Security configuration assessment status'
          help={helpLinks}
        >
          <WzConfigurationSettingsGroup
            config={this.wodleConfig.sca}
            items={securitySettings}
          />
          {policyItems.length > 0 && (
            <Fragment>
              <WzConfigurationSettingsHeader title='Policies' />
              <EuiBasicTable items={policyItems} columns={columns} />
            </Fragment>
          )}
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

export default WzPolicyMonitoringSCA;
