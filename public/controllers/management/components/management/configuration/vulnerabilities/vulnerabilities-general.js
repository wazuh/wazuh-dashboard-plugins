/*
 * Wazuh app - React component for show configuration of vulnerabilities - general tab.
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

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzNoConfig from '../util-components/no-config';
import { isString } from '../utils/utils';
import helpLinks from './help-links';
import { renderValueYesThenEnabled } from '../utils/utils';
import { i18n } from '@kbn/i18n';

const mainSettings = [
  {
    field: 'enabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.vulnerabilities.gernal.status',
      {
        defaultMessage: 'Vulnerability detector status',
      },
    ),
    render: renderValueYesThenEnabled,
  },
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.vulnerabilities.gernal.interval',
      {
        defaultMessage: 'Interval between scan executions',
      },
    ),
  },
  {
    field: 'run_on_start',
    label: i18n.translate(
      'wazuh.public.controller.management.config.vulnerabilities.gernal.start',
      {
        defaultMessage: 'Scan on start',
      },
    ),
  },
  {
    field: 'ignore_time',
    label: i18n.translate(
      'wazuh.public.controller.management.config.vulnerabilities.gernal.time',
      {
        defaultMessage: 'Time to ignore already detected vulnerabilities',
      },
    ),
  },
];

class WzConfigurationVulnerabilitiesGeneral extends Component {
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
          !wodleConfig['vulnerability-detector'] &&
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {wodleConfig['vulnerability-detector'] && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.vulnerabilities.gernal.Mainsettings',
              {
                defaultMessage: 'Main settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.vulnerabilities.gernal.setting',
              {
                defaultMessage:
                  'General settings applied to the vulnerability detector and its providers',
              },
            )}
            currentConfig={wodleConfig}
            minusHeight={320}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={wodleConfig['vulnerability-detector']}
              items={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

WzConfigurationVulnerabilitiesGeneral.propTypes = {
  currentConfig: PropTypes.object.isRequired,
};

export default WzConfigurationVulnerabilitiesGeneral;
