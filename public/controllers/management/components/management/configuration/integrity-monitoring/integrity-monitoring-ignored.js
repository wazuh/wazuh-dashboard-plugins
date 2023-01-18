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

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';
import { i18n } from '@kbn/i18n';

const columnsPath = [
  {
    field: 'path',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.monitering.Path',
      {
        defaultMessage: 'Path',
      },
    ),
  },
];

const columnsSregex = [
  {
    field: 'sregex',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.monitering.Sregex',
      {
        defaultMessage: 'Sregex',
      },
    ),
  },
];

const columnsEntryArch = [
  {
    field: 'entry',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.monitering.Entry',
      {
        defaultMessage: 'Entry',
      },
    ),
  },
  {
    field: 'arch',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.monitering.Arch',
      {
        defaultMessage: 'Arch',
      },
    ),
  },
];

const columnsEntryArchSRegex = [
  {
    field: 'entry',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.monitering.EntrySregex',
      {
        defaultMessage: 'Entry Sregex',
      },
    ),
  },
  {
    field: 'arch',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.monitering.Arch',
      {
        defaultMessage: 'Arch',
      },
    ),
  },
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
        currentConfig['syscheck-syscheck'] &&
        currentConfig['syscheck-syscheck'].syscheck &&
        !currentConfig['syscheck-syscheck'].syscheck.ignore &&
        !currentConfig['syscheck-syscheck'].syscheck.ignore_sregex ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {((agent || {}).os || {}).platform !== 'windows' &&
        currentConfig &&
        currentConfig['syscheck-syscheck'] &&
        currentConfig['syscheck-syscheck'].syscheck &&
        (currentConfig['syscheck-syscheck'].syscheck.ignore ||
          currentConfig['syscheck-syscheck'].syscheck.ignore_sregex) ? (
          <Fragment>
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.intergrity.monitering.ignoredFiles',
                {
                  defaultMessage: 'Ignored files and directories',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.intergrity.monitering.files',
                {
                  defaultMessage:
                    'These files and directories are ignored from the integrity scan',
                },
              )}
              currentConfig={currentConfig['syscheck-syscheck']}
              minusHeight={this.props.agent.id === '000' ? 320 : 415}
              helpLinks={helpLinks}
            >
              {currentConfig['syscheck-syscheck'].syscheck.ignore && (
                <EuiBasicTable
                  items={currentConfig['syscheck-syscheck'].syscheck.ignore.map(
                    item => ({ path: item }),
                  )}
                  columns={columnsPath}
                />
              )}
              {currentConfig['syscheck-syscheck'].syscheck.ignore_sregex && (
                <Fragment>
                  {currentConfig['syscheck-syscheck'].syscheck.ignore && (
                    <EuiSpacer size='s' />
                  )}
                  <EuiBasicTable
                    items={currentConfig[
                      'syscheck-syscheck'
                    ].syscheck.ignore_sregex.map(item => ({ sregex: item }))}
                    columns={columnsSregex}
                  />
                </Fragment>
              )}
            </WzConfigurationSettingsTabSelector>
          </Fragment>
        ) : null}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          !currentConfig['syscheck-syscheck'].syscheck.ignore &&
          !currentConfig['syscheck-syscheck'].syscheck.ignore_sregex &&
          !currentConfig['syscheck-syscheck'].syscheck.registry_ignore &&
          !currentConfig['syscheck-syscheck'].syscheck
            .registry_ignore_sregex && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          (currentConfig['syscheck-syscheck'].syscheck.ignore ||
            currentConfig['syscheck-syscheck'].syscheck.ignore_sregex ||
            currentConfig['syscheck-syscheck'].syscheck.registry_ignore ||
            currentConfig['syscheck-syscheck'].syscheck
              .registry_ignore_sregex) && (
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.intergrity.monitering.Ignored',
                {
                  defaultMessage: 'Ignored',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.intergrity.monitering.ignored',
                {
                  defaultMessage:
                    'A list of registry entries that will be ignored',
                },
              )}
              currentConfig={currentConfig}
              minusHeight={this.props.agent.id === '000' ? 320 : 415}
              helpLinks={helpLinks}
            >
              {currentConfig['syscheck-syscheck'].syscheck.registry_ignore && (
                <EuiBasicTable
                  items={
                    currentConfig['syscheck-syscheck'].syscheck.registry_ignore
                  }
                  columns={columnsEntryArch}
                />
              )}
              {currentConfig['syscheck-syscheck'].syscheck
                .registry_ignore_sregex && (
                <Fragment>
                  {currentConfig['syscheck-syscheck'].syscheck
                    .registry_ignore && <EuiSpacer />}
                  <EuiBasicTable
                    items={
                      currentConfig['syscheck-syscheck'].syscheck
                        .registry_ignore_sregex
                    }
                    columns={columnsEntryArchSRegex}
                  />
                </Fragment>
              )}
              {currentConfig['syscheck-syscheck'].syscheck.ignore && (
                <Fragment>
                  {(currentConfig['syscheck-syscheck'].syscheck
                    .registry_ignore ||
                    currentConfig['syscheck-syscheck'].syscheck
                      .registry_ignore_sregex) && <EuiSpacer />}
                  <EuiBasicTable
                    items={currentConfig[
                      'syscheck-syscheck'
                    ].syscheck.ignore.map(item => ({ path: item }))}
                    columns={columnsPath}
                  />
                </Fragment>
              )}
              {currentConfig['syscheck-syscheck'].syscheck.ignore_sregex && (
                <Fragment>
                  {(currentConfig['syscheck-syscheck'].syscheck
                    .registry_ignore ||
                    currentConfig['syscheck-syscheck'].syscheck
                      .registry_ignore_sregex ||
                    currentConfig['syscheck-syscheck'].syscheck.ignore) && (
                    <EuiSpacer />
                  )}
                  <EuiBasicTable
                    items={currentConfig[
                      'syscheck-syscheck'
                    ].syscheck.ignore_sregex.map(item => ({ sregex: item }))}
                    columns={columnsSregex}
                  />
                </Fragment>
              )}
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

WzConfigurationMonitoringIgnored.proptTypes = {
  // currentConfig: PropTypes.object.isRequired,
  agent: PropTypes.object,
};

export default WzConfigurationMonitoringIgnored;
