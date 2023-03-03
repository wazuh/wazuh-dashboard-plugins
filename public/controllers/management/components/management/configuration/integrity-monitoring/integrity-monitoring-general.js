/*
 * Wazuh app - React component for show configuration of integrity monitoring - general tab.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@kbn/i18n';

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzSettingsGroup from '../util-components/configuration-settings-group';

import {
  renderValueOrDefault,
  renderValueOrNoValue,
  renderValueOrYes,
  renderValueOrNo,
  renderValueNoThenEnabled,
} from '../utils/utils';

import helpLinks from './help-links';

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.status',
      {
        defaultMessage: 'Integrity monitoring status',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'frequency',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.intervalScan',
      {
        defaultMessage: 'Interval (in seconds) to run the integrity scan',
      },
    ),
  },
  {
    field: 'scan_time',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.dayscans',
      {
        defaultMessage: 'Time of day to run integrity scans',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'scan_day',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.scans',
      {
        defaultMessage: 'Day of the week to run integrity scans',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'auto_ignore',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.times',
      {
        defaultMessage: 'Ignore files that change too many times',
      },
    ),
    render: renderValueOrNo,
    when: 'manager',
  },
  {
    field: 'alert_new_files',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.created',
      {
        defaultMessage: 'Alert when new files are created',
      },
    ),
    render: renderValueOrNo,
    when: 'manager',
  },
  {
    field: 'scan_on_start',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.sacnOn',
      {
        defaultMessage: 'Scan on start',
      },
    ),
  },
  {
    field: 'skip_nfs',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.cifs',
      {
        defaultMessage: 'Skip scan on CIFS/NFS mounts',
      },
    ),
  },
  {
    field: 'skip_dev',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.dev',
      {
        defaultMessage: 'Skip scan of /dev directory',
      },
    ),
  },
  {
    field: 'skip_sys',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.sys',
      {
        defaultMessage: 'Skip scan of /sys directory',
      },
    ),
  },
  {
    field: 'skip_proc',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.proc',
      {
        defaultMessage: 'Skip scan of /proc directory',
      },
    ),
  },
  {
    field: 'remove_old_diff',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.screenshots',
      {
        defaultMessage: 'Remove old local snapshots',
      },
    ),
    render: renderValueOrYes,
  },
  {
    field: 'restart_audit',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.restart',
      {
        defaultMessage: 'Restart the Audit daemon',
      },
    ),
  },
  {
    field: 'windows_audit_interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.SCALs',
      {
        defaultMessage: "Interval (in seconds) to check directories' SACLs",
      },
    ),
    render: renderValueOrDefault('300'),
  },
  {
    field: 'prefilter_cmd',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.command',
      {
        defaultMessage: 'Command to prevent prelinking',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'max_eps',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.throughout',
      {
        defaultMessage: 'Maximum event reporting throughput',
      },
    ),
  },
  {
    field: 'process_priority',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.Processpriority',
      {
        defaultMessage: 'Process priority',
      },
    ),
  },
  {
    field: 'database',
    label: i18n.translate(
      'wazuh.public.controller.management.config.monitering.Databasetype',
      {
        defaultMessage: 'Database type',
      },
    ),
  },
];

const mainSettingsOfAgentOrManager = agent =>
  agent.id === '000'
    ? mainSettings
    : mainSettings.filter(setting => setting.when !== 'manager');

class WzConfigurationIntegrityMonitoringGeneral extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsTabSelector
          title={i18n.translate(
            'wazuh.public.controller.management.config.monitering.General',
            {
              defaultMessage: 'General',
            },
          )}
          description={i18n.translate(
            'wazuh.public.controller.management.config.monitering.globally',
            {
              defaultMessage: 'The settings shown below are applied globally',
            },
          )}
          currentConfig={currentConfig['syscheck-syscheck']}
          minusHeight={this.props.agent.id === '000' ? 320 : 415}
          helpLinks={helpLinks}
        >
          <WzSettingsGroup
            config={currentConfig['syscheck-syscheck'].syscheck}
            items={mainSettingsOfAgentOrManager(agent)}
          />
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    );
  }
}

WzConfigurationIntegrityMonitoringGeneral.proptTypes = {
  // currentConfig: PropTypes.object.isRequired,
  agent: PropTypes.object,
};

export default WzConfigurationIntegrityMonitoringGeneral;
