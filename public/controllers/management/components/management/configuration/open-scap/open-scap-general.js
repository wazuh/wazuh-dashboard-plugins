/*
 * Wazuh app - React component for show configuration of OpenSCAP - general tab.
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
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { i18n } from '@kbn/i18n';

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.open.scap.gernal.integation',
      {
        defaultMessage: 'OpenSCAP integration status',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'timeout',
    label: i18n.translate(
      'wazuh.public.controller.management.config.open.scap.gernal.timeOut',
      {
        defaultMessage: 'Timeout (in seconds) for scan executions',
      },
    ),
  },
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.open.scap.gernal.interval',
      {
        defaultMessage: 'Interval between scan executions',
      },
    ),
  },
  {
    field: 'scan-on-start',
    label: i18n.translate(
      'wazuh.public.controller.management.config.open.scap.gernal.start',
      {
        defaultMessage: 'Scan on start',
      },
    ),
  },
];

class WzConfigurationOpenSCAPGeneral extends Component {
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
          !wodleConfig['open-scap'] &&
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {wodleConfig['open-scap'] && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.open.scap.gernal.MainSettings',
              {
                defaultMessage: 'Main settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.open.scap.gernal.setting',
              {
                defaultMessage:
                  'These settings apply to all OpenSCAP evaluations',
              },
            )}
            currentConfig={wodleConfig}
            minusHeight={this.props.agent.id === '000' ? 320 : 415}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={wodleConfig['open-scap']}
              items={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

WzConfigurationOpenSCAPGeneral.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationOpenSCAPGeneral;
