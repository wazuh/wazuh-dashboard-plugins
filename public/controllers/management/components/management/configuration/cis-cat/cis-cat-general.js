/*
 * Wazuh app - React component for show configuration of CIS-CAT - general tab.
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
import { i18n } from '@kbn/i18n';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';
import { isString, renderValueNoThenEnabled } from '../utils/utils';

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.status',
      {
        defaultMessage: 'CIS-CAT integration status',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'timeout',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.scans',
      {
        defaultMessage: 'Timeout (in seconds) for scan executions',
      },
    ),
  },
  {
    field: 'java_path',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.java',
      {
        defaultMessage: 'Path to Java executable directory',
      },
    ),
  },
  {
    field: 'ciscat_path',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.directory',
      {
        defaultMessage: 'Path to CIS-CAT executable directory',
      },
    ),
  },
];

const schedulingSettings = [
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.executions',
      {
        defaultMessage: 'Interval between scan executions',
      },
    ),
  },
  {
    field: 'scan-on-start',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.ScanOnStart',
      {
        defaultMessage: 'Scan on start',
      },
    ),
  },
  {
    field: 'day',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.dayOfMonth',
      {
        defaultMessage: 'Day of the month to run scans',
      },
    ),
  },
  {
    field: 'wday',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.dayOfWeek',
      {
        defaultMessage: 'Day of the week to run scans',
      },
    ),
  },
  {
    field: 'time',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cis.general.timeofDay',
      {
        defaultMessage: 'Time of the day to run scans',
      },
    ),
  },
];

class WzConfigurationCisCatGeneral extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wodleConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] &&
          isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig
              error={currentConfig['wmodules-wmodules']}
              help={helpLinks}
            />
          )}
        {currentConfig &&
          !wodleConfig['cis-cat'] &&
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {wodleConfig['cis-cat'] && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.cis.general.Main  settings',
              {
                defaultMessage: 'Main settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.cis.general.Generalsettings',
              {
                defaultMessage: 'General settings applied to all benchmarks',
              },
            )}
            currentConfig={wodleConfig}
            minusHeight={this.props.agent.id === '000' ? 320 : 415}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={wodleConfig['cis-cat']}
              items={mainSettings}
            />
            <WzConfigurationSettingsGroup
              title={i18n.translate(
                'wazuh.public.controller.management.config.cis.general.Schedulingsettings',
                {
                  defaultMessage: 'Scheduling settings',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.cis.general.customize',
                {
                  defaultMessage: 'Customize CIS-CAT scans scheduling',
                },
              )}
              config={wodleConfig['cis-cat']}
              items={schedulingSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

WzConfigurationCisCatGeneral.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
};

export default WzConfigurationCisCatGeneral;
