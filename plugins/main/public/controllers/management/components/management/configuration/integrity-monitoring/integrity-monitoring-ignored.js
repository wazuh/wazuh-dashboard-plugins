/*
 * Wazuh app - React component for show configuration of integrity monitoring - ignored tab.
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

import { EuiBasicTable, EuiSpacer } from '@elastic/eui';

import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';

const columnsPath = [{ field: 'path', name: 'Path' }];

const columnsSregex = [{ field: 'sregex', name: 'Sregex' }];

const columnsEntryArch = [
  { field: 'entry', name: 'Entry' },
  { field: 'arch', name: 'Arch' },
];

const columnsEntryArchSRegex = [
  { field: 'entry', name: 'Entry Sregex' },
  { field: 'arch', name: 'Arch' },
];

class WzConfigurationMonitoringIgnored extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent } = this.props;
    return (
      <Fragment>
        {((agent || {}).os || {}).platform !== 'windows' &&
        currentConfig &&
        currentConfig.fim &&
        currentConfig.fim.syscheck &&
        !currentConfig.fim.syscheck.ignore &&
        !currentConfig.fim.syscheck.ignore_sregex ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {((agent || {}).os || {}).platform !== 'windows' &&
        currentConfig &&
        currentConfig.fim &&
        currentConfig.fim.syscheck &&
        (currentConfig.fim.syscheck.ignore ||
          currentConfig.fim.syscheck.ignore_sregex) ? (
          <Fragment>
            <WzConfigurationSettingsHeader
              title='Ignored files and directories'
              description='These files and directories are ignored from the integrity scan'
              help={helpLinks}
            >
              {currentConfig.fim.syscheck.ignore && (
                <EuiBasicTable
                  items={currentConfig.fim.syscheck.ignore.map(item => ({
                    path: item,
                  }))}
                  columns={columnsPath}
                />
              )}
              {currentConfig.fim.syscheck.ignore_sregex && (
                <Fragment>
                  {currentConfig.fim.syscheck.ignore && <EuiSpacer size='s' />}
                  <EuiBasicTable
                    items={currentConfig.fim.syscheck.ignore_sregex.map(
                      item => ({ sregex: item }),
                    )}
                    columns={columnsSregex}
                  />
                </Fragment>
              )}
            </WzConfigurationSettingsHeader>
          </Fragment>
        ) : null}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig.fim &&
          currentConfig.fim.syscheck &&
          !currentConfig.fim.syscheck.ignore &&
          !currentConfig.fim.syscheck.ignore_sregex &&
          !currentConfig.fim.syscheck.registry_ignore &&
          !currentConfig.fim.syscheck.registry_ignore_sregex && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig.fim &&
          currentConfig.fim.syscheck &&
          (currentConfig.fim.syscheck.ignore ||
            currentConfig.fim.syscheck.ignore_sregex ||
            currentConfig.fim.syscheck.registry_ignore ||
            currentConfig.fim.syscheck.registry_ignore_sregex) && (
            <WzConfigurationSettingsHeader
              title='Ignored'
              description='A list of registry entries that will be ignored'
              help={helpLinks}
            >
              {currentConfig.fim.syscheck.registry_ignore && (
                <EuiBasicTable
                  items={currentConfig.fim.syscheck.registry_ignore}
                  columns={columnsEntryArch}
                />
              )}
              {currentConfig.fim.syscheck.registry_ignore_sregex && (
                <Fragment>
                  {currentConfig.fim.syscheck.registry_ignore && <EuiSpacer />}
                  <EuiBasicTable
                    items={currentConfig.fim.syscheck.registry_ignore_sregex}
                    columns={columnsEntryArchSRegex}
                  />
                </Fragment>
              )}
              {currentConfig.fim.syscheck.ignore && (
                <Fragment>
                  {(currentConfig.fim.syscheck.registry_ignore ||
                    currentConfig.fim.syscheck.registry_ignore_sregex) && (
                    <EuiSpacer />
                  )}
                  <EuiBasicTable
                    items={currentConfig.fim.syscheck.ignore.map(item => ({
                      path: item,
                    }))}
                    columns={columnsPath}
                  />
                </Fragment>
              )}
              {currentConfig.fim.syscheck.ignore_sregex && (
                <Fragment>
                  {(currentConfig.fim.syscheck.registry_ignore ||
                    currentConfig.fim.syscheck.registry_ignore_sregex ||
                    currentConfig.fim.syscheck.ignore) && <EuiSpacer />}
                  <EuiBasicTable
                    items={currentConfig.fim.syscheck.ignore_sregex.map(
                      item => ({ sregex: item }),
                    )}
                    columns={columnsSregex}
                  />
                </Fragment>
              )}
            </WzConfigurationSettingsHeader>
          )}
      </Fragment>
    );
  }
}

WzConfigurationMonitoringIgnored.propTypes = {
  agent: PropTypes.object,
  currentConfig: PropTypes.object,
};

export default WzConfigurationMonitoringIgnored;
