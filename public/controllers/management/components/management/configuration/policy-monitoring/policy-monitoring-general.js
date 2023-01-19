/*
 * Wazuh app - React component for show configuration of policy monitoring - general tab.
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

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import helpLinks from './help-links';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import WzNoConfig from '../util-components/no-config';
import { i18n } from '@kbn/i18n';

const allSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.status',
      {
        defaultMessage: 'Policy monitoring service status',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'base_directory',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.Basedirectory',
      {
        defaultMessage: 'Base directory',
      },
    ),
  },
  {
    field: 'scanall',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.scanEntire',
      {
        defaultMessage: 'Scan the entire system',
      },
    ),
  },
  {
    field: 'frequency',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.frequency',
      {
        defaultMessage: 'Frequency (in seconds) to run the scan',
      },
    ),
  },
  {
    field: 'check_dev',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.devPath',
      {
        defaultMessage: 'Check /dev path',
      },
    ),
  },
  {
    field: 'check_files',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.checkFiles',
      {
        defaultMessage: 'Check files',
      },
    ),
  },
  {
    field: 'check_if',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.Checknetworkinterfaces',
      {
        defaultMessage: 'Check network interfaces',
      },
    ),
  },
  {
    field: 'check_pids',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.checkID',
      {
        defaultMessage: 'Check processes IDs',
      },
    ),
  },
  {
    field: 'check_ports',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.Checknetworkports',
      {
        defaultMessage: 'Check network ports',
      },
    ),
  },
  { field: 'check_sys', label: 'Check anomalous system objects' },
  {
    field: 'check_trojans',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.Checktrojans',
      {
        defaultMessage: 'Check trojans',
      },
    ),
  },
  {
    field: 'check_unixaudit',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.unix',
      {
        defaultMessage: 'Check UNIX audit',
      },
    ),
  },
  {
    field: 'check_winapps',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.CheckWindowsapps',
      {
        defaultMessage: 'Check Windows apps',
      },
    ),
  },
  {
    field: 'check_winaudit',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.CheckWindowsaudit',
      {
        defaultMessage: 'Check Windows audit',
      },
    ),
  },
  {
    field: 'check_winmalware',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.malware',
      {
        defaultMessage: 'Check Windows malware',
      },
    ),
  },
  {
    field: 'skip_nfs',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.mounts',
      {
        defaultMessage: 'Skip scan on CIFS/NFS mounts',
      },
    ),
  },
  {
    field: 'rootkit_files',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.fileDatabase',
      {
        defaultMessage: 'Rootkit files database path',
      },
    ),
  },
  {
    field: 'rootkit_trojans',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.rootkit',
      {
        defaultMessage: 'Rootkit trojans database path',
      },
    ),
  },
  {
    field: 'windows_audit',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.audit',
      {
        defaultMessage: 'Windows audit definition file path',
      },
    ),
  },
  {
    field: 'windows_apps',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.path',
      {
        defaultMessage: 'Windows application definition file path',
      },
    ),
  },
  {
    field: 'windows_malware',
    label: i18n.translate(
      'wazuh.public.controller.management.config.policy.monitoring.gernal.windows',
      {
        defaultMessage: 'Windows malware definitions file path',
      },
    ),
  },
];

class WzConfigurationPolicyMonitoringGeneral extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['syscheck-rootcheck'] &&
          isString(currentConfig['syscheck-rootcheck']) && (
            <WzNoConfig
              error={currentConfig['syscheck-rootcheck']}
              help={helpLinks}
            />
          )}
        {currentConfig['syscheck-rootcheck'] &&
          !isString(currentConfig['syscheck-rootcheck']) &&
          !currentConfig['syscheck-rootcheck'].rootcheck && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {((currentConfig['syscheck-rootcheck'] &&
          !isString(currentConfig['syscheck-rootcheck']) &&
          currentConfig['syscheck-rootcheck'].rootcheck) ||
          currentConfig['sca']) && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.policy.monitoring.gernal.Allsettings',
              {
                defaultMessage: 'All settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.policy.monitoring.gernal.rootCheck',
              {
                defaultMessage: 'General settings for the rootcheck daemon',
              },
            )}
            currentConfig={currentConfig}
            minusHeight={this.props.agent.id === '000' ? 320 : 415}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={currentConfig['syscheck-rootcheck'].rootcheck}
              items={allSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

WzConfigurationPolicyMonitoringGeneral.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationPolicyMonitoringGeneral;
