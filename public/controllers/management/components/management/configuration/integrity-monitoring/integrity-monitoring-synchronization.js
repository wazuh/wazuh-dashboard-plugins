/*
 * Wazuh app - React component for show configuration of integrity monitoring - synchronization tab.
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

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';
import { renderValueYesThenEnabled } from '../utils/utils';

const mainSettings = [
  {
    field: 'enabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.moniterting.sync.status',
      {
        defaultMessage: 'Synchronization status',
      },
    ),
    render: renderValueYesThenEnabled,
  },
  {
    field: 'max_interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.moniterting.sync.maxInterval',
      {
        defaultMessage: 'Maximum interval (in seconds) between every sync',
      },
    ),
  },
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.moniterting.sync.interval',
      {
        defaultMessage: 'Interval (in seconds) between every sync',
      },
    ),
  },
  {
    field: 'response_timeout',
    label: i18n.translate(
      'wazuh.public.controller.management.config.moniterting.sync.timeOut',
      {
        defaultMessage: 'Response timeout (in seconds)',
      },
    ),
  },
  {
    field: 'queue_size',
    label: i18n.translate(
      'wazuh.public.controller.management.config.moniterting.sync.responses',
      {
        defaultMessage: 'Queue size of the manager responses',
      },
    ),
  },
  {
    field: 'max_eps',
    label: i18n.translate(
      'wazuh.public.controller.management.config.moniterting.sync.message',
      {
        defaultMessage: 'Maximum message throughput',
      },
    ),
  },
];

class WzConfigurationIntegrityMonitoringSynchronization extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig &&
        currentConfig['syscheck-syscheck'] &&
        currentConfig['syscheck-syscheck'].syscheck &&
        currentConfig['syscheck-syscheck'].syscheck.synchronization ? (
          <WzConfigurationSettingsTabSelector
            title='Syncronization'
            description='Database synchronization settings'
            currentConfig={currentConfig['syscheck-syscheck']}
            minusHeight={this.props.agent.id === '000' ? 320 : 415}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={
                currentConfig['syscheck-syscheck'].syscheck.synchronization
              }
              items={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        ) : (
          <WzNoConfig error='not-present' help={helpLinks} />
        )}
      </Fragment>
    );
  }
}

WzConfigurationIntegrityMonitoringSynchronization.proptTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationIntegrityMonitoringSynchronization;
