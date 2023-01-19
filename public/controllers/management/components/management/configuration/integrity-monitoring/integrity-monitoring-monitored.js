/*
 * Wazuh app - React component for show configuration of integrity monitoring - monitored tab.
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
import { i18n } from '@kbn/i18n';

import { EuiBasicTable, EuiSpacer } from '@elastic/eui';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import WzNoConfig from '../util-components/no-config';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

const renderOptsIncludes = key => item => item.includes(key) ? 'yes' : 'no';

const mainSettings = [
  {
    field: 'dir',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Selecteditem',
      {
        defaultMessage: 'Selected item',
      },
    ),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Enablerealtime',
      {
        defaultMessage: 'Enable realtime monitoring',
      },
    ),
    render: renderOptsIncludes('realtime'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Enableauditing',
      {
        defaultMessage: 'Enable auditing (who-data)',
      },
    ),
    render: renderOptsIncludes('check_whodata'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Reportfilechanges',
      {
        defaultMessage: 'Report file changes',
      },
    ),
    render: renderOptsIncludes('report_changes'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Performallchecksums',
      {
        defaultMessage: 'Perform all checksums',
      },
    ),
    render: renderOptsIncludes('check_all'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Checksums',
      {
        defaultMessage: 'Check sums (MD5 & SHA1)',
      },
    ),
    render: renderOptsIncludes('check_sum'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.CheckMD5sum',
      {
        defaultMessage: 'Check MD5 sum',
      },
    ),
    render: renderOptsIncludes('check_md5sum'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.CheckSHA1sum',
      {
        defaultMessage: 'Check SHA1 sum',
      },
    ),
    render: renderOptsIncludes('check_sha1sum'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.CheckSHA256sum',
      {
        defaultMessage: 'Check SHA256 sum',
      },
    ),
    render: renderOptsIncludes('check_sha256sum'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Checkfilessize',
      {
        defaultMessage: 'Check files size',
      },
    ),
    render: renderOptsIncludes('check_size'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Checkfilesowner',
      {
        defaultMessage: 'Check files owner',
      },
    ),
    render: renderOptsIncludes('check_owner'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Checkfilesgroups',
      {
        defaultMessage: 'Check files groups',
      },
    ),
    render: renderOptsIncludes('check_group'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.premisssion',
      {
        defaultMessage: 'Check files permissions',
      },
    ),
    render: renderOptsIncludes('check_perm'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.fileTimes',
      {
        defaultMessage: 'Check files modification time',
      },
    ),
    render: renderOptsIncludes('check_mtime'),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.inodes',
      {
        defaultMessage: 'Check files inodes',
      },
    ),
    render: renderOptsIncludes('check_inode'),
  },
  {
    field: 'restrict',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.string',
      {
        defaultMessage: 'Restrict to files containing this string',
      },
    ),
  },
  {
    field: 'tags',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.CustomTags',
      {
        defaultMessage: 'Custom tags for alerts',
      },
    ),
  },
  {
    field: 'recursion_level',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Recursionlevel',
      {
        defaultMessage: 'Recursion level',
      },
    ),
  },
  {
    field: 'opts',
    label: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.link',
      {
        defaultMessage: 'Follow symbolic link',
      },
    ),
    render: renderOptsIncludes('follow_symbolic_link'),
  },
];

const columnsAgentWin = [
  {
    field: 'entry',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Entry',
      {
        defaultMessage: 'Entry',
      },
    ),
  },
  {
    field: 'arch',
    name: i18n.translate(
      'wazuh.public.controller.management.config.intergrity.moniterted.Arch',
      {
        defaultMessage: 'Arch',
      },
    ),
  },
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
            'dir',
          )
        : [];
    return (
      <Fragment>
        {currentConfig &&
        currentConfig['syscheck-syscheck'] &&
        currentConfig['syscheck-syscheck'].syscheck &&
        currentConfig['syscheck-syscheck'].syscheck.directories &&
        !currentConfig['syscheck-syscheck'].syscheck.directories.length &&
        ((currentConfig['syscheck-syscheck'].syscheck.registry &&
          !currentConfig['syscheck-syscheck'].syscheck.registry.length) ||
          !currentConfig['syscheck-syscheck'].syscheck.registry) ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {currentConfig &&
        currentConfig['syscheck-syscheck'] &&
        currentConfig['syscheck-syscheck'].syscheck &&
        currentConfig['syscheck-syscheck'].syscheck.directories &&
        currentConfig['syscheck-syscheck'].syscheck.directories.length > 0 ? (
          <WzConfigurationSettingsTabSelector
            title='Monitored directories'
            description='These directories are included on the integrity scan'
            currentConfig={currentConfig['syscheck-syscheck']}
            minusHeight={this.props.agent.id === '000' ? 320 : 415}
            helpLinks={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={mainSettings}
            />
            {((agent || {}).os || {}).platform === 'windows' &&
              currentConfig &&
              currentConfig['syscheck-syscheck'] &&
              currentConfig['syscheck-syscheck'].syscheck &&
              currentConfig['syscheck-syscheck'].syscheck.registry && (
                <Fragment>
                  <EuiSpacer />
                  <WzConfigurationSettingsHeader
                    title={i18n.translate(
                      'wazuh.public.controller.management.config.intergrity.moniterted.registryEntries',
                      {
                        defaultMessage: 'Monitored registry entries',
                      },
                    )}
                    description={i18n.translate(
                      'wazuh.public.controller.management.config.intergrity.moniterted.list',
                      {
                        defaultMessage:
                          'A list of registry entries that will be monitored',
                      },
                    )}
                  />
                  <EuiBasicTable
                    items={currentConfig['syscheck-syscheck'].syscheck.registry}
                    columns={columnsAgentWin}
                  />
                </Fragment>
              )}
          </WzConfigurationSettingsTabSelector>
        ) : null}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          !currentConfig['syscheck-syscheck'].syscheck.registry && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {((agent || {}).os || {}).platform === 'windows' &&
          currentConfig &&
          currentConfig['syscheck-syscheck'] &&
          currentConfig['syscheck-syscheck'].syscheck &&
          currentConfig['syscheck-syscheck'].syscheck.registry &&
          currentConfig['syscheck-syscheck'].syscheck.registry.length > 0 &&
          ((currentConfig['syscheck-syscheck'].syscheck.directories &&
            !currentConfig['syscheck-syscheck'].syscheck.directories.length) ||
            !currentConfig['syscheck-syscheck'].syscheck.directories) && (
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.intergrity.moniterted.registry',
                {
                  defaultMessage: 'Monitored registry entries',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.intergrity.moniterted.entries',
                {
                  defaultMessage:
                    'A list of registry entries that will be monitored',
                },
              )}
              currentConfig={currentConfig}
              minusHeight={this.props.agent.id === '000' ? 320 : 415}
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
  agent: PropTypes.object,
};

export default WzConfigurationIntegrityMonitoringMonitored;
