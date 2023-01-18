/*
 * Wazuh app - React component for show configuration of log settings - alerts tab.
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

import WzNoConfig from '../util-components/no-config';

import { isString } from '../utils/utils';
import helpLinks from './help-links';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import { i18n } from '@kbn/i18n';

const mainSettings = [
  {
    field: 'plain_format',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.Plainformat',
      {
        defaultMessage: 'Plain format',
      },
    ),
  },
  {
    field: 'json_format',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.JSONFormat',
      {
        defaultMessage: 'JSON format',
      },
    ),
  },
  {
    field: 'compress_rotation',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.CompressRotation',
      {
        defaultMessage: 'Compress rotation',
      },
    ),
  },
  {
    field: 'saved_rotations',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.SavedRotations',
      {
        defaultMessage: 'Saved rotations',
      },
    ),
  },
  {
    field: 'schedule',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.Schedule',
      {
        defaultMessage: 'Schedule',
      },
    ),
  },
  {
    field: 'maxsize',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.Maximumlogsize',
      {
        defaultMessage: 'Maximum log size',
      },
    ),
  },
  {
    field: 'minsize',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.Minimumlogsize',
      {
        defaultMessage: 'Minimum log size',
      },
    ),
  },
  {
    field: 'maxage',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.alert.Maximumlogage',
      {
        defaultMessage: 'Maximum log age',
      },
    ),
  },
];

class WzConfigurationLogSettingsAlerts extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['analysis-logging'] &&
          isString(currentConfig['analysis-logging']) && (
            <WzNoConfig
              error={currentConfig['analysis-logging']}
              help={helpLinks}
            />
          )}
        {((currentConfig['analysis-logging'] &&
          currentConfig['analysis-logging'].logging) ||
          (currentConfig['com-logging'] &&
            currentConfig['com-logging'].logging)) && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.log.setting.alert.AlertsSettings',
              {
                defaultMessage: 'Alerts settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.log.setting.alert.basicAlert',
              {
                defaultMessage: 'Basic alerts log settings',
              },
            )}
            currentConfig={currentConfig['analysis-logging'].logging.alerts}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={currentConfig['analysis-logging'].logging.alerts}
              items={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

export default WzConfigurationLogSettingsAlerts;
