/*
 * Wazuh app - React component for show configuration of log settings - archives tab.
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
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import { isString } from '../utils/utils';
import helpLinks from './help-links';
import { i18n } from '@kbn/i18n';

const mainSettings = [
  {
    field: 'plain_format',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.Plainformat',
      {
        defaultMessage: 'Plain format',
      },
    ),
  },
  {
    field: 'JSON format',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.jsonformat',
      {
        defaultMessage: 'json_format',
      },
    ),
  },
  {
    field: 'Compress rotatio',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.compressRotation',
      {
        defaultMessage: 'compressrotation',
      },
    ),
  },
  {
    field: 'Saved rotations',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.savedrotations',
      {
        defaultMessage: 'saved_rotations',
      },
    ),
  },
  {
    field: 'schedule',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.Schedule',
      {
        defaultMessage: 'Schedule',
      },
    ),
  },
  {
    field: 'maxsize',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.Maximumlogsize',
      {
        defaultMessage: 'Maximum log size',
      },
    ),
  },
  {
    field: 'minsize',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.logSize',
      {
        defaultMessage: 'Minimum log size',
      },
    ),
  },
  {
    field: 'maxage',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.setting.archives.Maximumlogage',
      {
        defaultMessage: 'Maximum log age',
      },
    ),
  },
];

class WzConfigurationLogSettingsArchives extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['analysis-logging'] &&
          isString(currentConfig['analysis-logging']) && (
            <Fragment>
              <WzNoConfig
                error={currentConfig['analysis-logging']}
                help={helpLinks}
              />
            </Fragment>
          )}
        {(currentConfig['analysis-logging'] &&
          currentConfig['analysis-logging'].logging) ||
          (currentConfig['com-logging'] &&
            currentConfig['com-logging'].logging && (
              <WzConfigurationSettingsTabSelector
                title={i18n.translate(
                  'wazuh.public.controller.management.config.log.setting.archives.Archivessettings',
                  {
                    defaultMessage: 'Archives settings',
                  },
                )}
                description={i18n.translate(
                  'wazuh.public.controller.management.config.log.setting.archives.logSettings',
                  {
                    defaultMessage: 'Basic archives log settings',
                  },
                )}
                currentConfig={
                  currentConfig['analysis-logging'].logging.archives
                }
                helpLinks={helpLinks}
              >
                <WzConfigurationSettingsGroup
                  config={currentConfig['analysis-logging'].logging.archives}
                  items={mainSettings}
                />
              </WzConfigurationSettingsTabSelector>
            ))}
      </Fragment>
    );
  }
}

export default WzConfigurationLogSettingsArchives;
