/*
 * Wazuh app - React component for show configuration of integrity monitoring - monitored tab.
 * Copyright (C) 2015-2020 Wazuh, Inc.
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

import { EuiBasicTable } from '@elastic/eui';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import WzNoConfig from '../util-components/no-config';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

const renderOptsIncludes = key => item => (item.includes(key) ? 'yes' : 'no');

const mainSettings = [
  { field: 'dir', label: 'Selected item' },
  {
    field: 'opts',
    label: 'Enable realtime monitoring',
    render: renderOptsIncludes('realtime')
  },
  {
    field: 'opts',
    label: 'Enable auditing (who-data)',
    render: renderOptsIncludes('check_whodata')
  },
  {
    field: 'opts',
    label: 'Report file changes',
    render: renderOptsIncludes('report_changes')
  },
  {
    field: 'opts',
    label: 'Perform all checksums',
    render: renderOptsIncludes('check_all')
  },
  {
    field: 'opts',
    label: 'Check sums (MD5 & SHA1)',
    render: renderOptsIncludes('check_sum')
  },
  {
    field: 'opts',
    label: 'Check MD5 sum',
    render: renderOptsIncludes('check_md5sum')
  },
  {
    field: 'opts',
    label: 'Check SHA1 sum',
    render: renderOptsIncludes('check_sha1sum')
  },
  {
    field: 'opts',
    label: 'Check SHA256 sum',
    render: renderOptsIncludes('check_sha256sum')
  },
  {
    field: 'opts',
    label: 'Check files size',
    render: renderOptsIncludes('check_size')
  },
  {
    field: 'opts',
    label: 'Check files owner',
    render: renderOptsIncludes('check_owner')
  },
  {
    field: 'opts',
    label: 'Check files groups',
    render: renderOptsIncludes('check_group')
  },
  {
    field: 'opts',
    label: 'Check files permissions',
    render: renderOptsIncludes('check_perm')
  },
  {
    field: 'opts',
    label: 'Check files modification time',
    render: renderOptsIncludes('check_mtime')
  },
  {
    field: 'opts',
    label: 'Check files inodes',
    render: renderOptsIncludes('check_inode')
  },
  { field: 'restrict', label: 'Restrict to files containing this string' },
  { field: 'tags', label: 'Custom tags for alerts' },
  { field: 'recursion_level', label: 'Recursion level' },
  {
    field: 'opts',
    label: 'Follow symbolic link',
    render: renderOptsIncludes('follow_symbolic_link')
  }
];

const columnsAgentWin = [
  { field: 'entry', name: 'Entry' },
  { field: 'arch', name: 'Arch' }
];

class WzConfigurationIntegrityMonitoringMonitored extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent } = this.props;
    const items =
      currentConfig['syscheck-syscheck'] &&
      currentConfig['syscheck-syscheck'].syscheck &&
      currentConfig['syscheck-syscheck'].syscheck.directories
        ? settingsListBuilder(
            currentConfig['syscheck-syscheck'].syscheck.directories,
            'dir'
          )
        : [];
    return (
      <Fragment>
        {currentConfig &&
        currentConfig['syscheck-syscheck'] &&
        currentConfig['syscheck-syscheck'].syscheck &&
        currentConfig['syscheck-syscheck'].syscheck.directories &&
        !currentConfig['syscheck-syscheck'].syscheck.directories.length ? (
          <WzNoConfig error="not-present" help={helpLinks} />
        ) : null}
        {currentConfig &&
        currentConfig['syscheck-syscheck'] &&
        currentConfig['syscheck-syscheck'].syscheck &&
        currentConfig['syscheck-syscheck'].syscheck.directories &&
        currentConfig['syscheck-syscheck'].syscheck.directories.length ? (
          <WzConfigurationSettingsTabSelector
            title="Monitored directories"
            description="These directories are included on the integrity scan"
            currentConfig={currentConfig['syscheck-syscheck']}
            minusHeight={this.props.agent.id === '000' ? 310 : 410}
            helpLinks={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        ) : null}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          !currentConfig['syscheck-syscheck'].syscheck.registry &&
          !currentConfig['syscheck-syscheck'].syscheck.registry_ignore && (
            <WzNoConfig error="not-present" help={helpLinks} />
          )}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          (currentConfig['syscheck-syscheck'].syscheck.registry ||
            currentConfig['syscheck-syscheck'].syscheck.registry_ignore) && (
            <WzConfigurationSettingsTabSelector
              title="Monitored"
              description="A list of registry entries that will be monitored"
              currentConfig={currentConfig}
              minusHeight={this.props.agent.id === '000' ? 310 : 410}
              helpLinks={helpLinks}
            >
              <EuiBasicTable
                items={currentConfig['syscheck-syscheck'].syscheck.registry}
                columns={columnsAgentWin}
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

WzConfigurationIntegrityMonitoringMonitored.proptTypes = {
  // currentConfig: PropTypes.object.isRequired,
  agent: PropTypes.object
};

export default WzConfigurationIntegrityMonitoringMonitored;
