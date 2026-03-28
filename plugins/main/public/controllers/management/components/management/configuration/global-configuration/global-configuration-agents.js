/*
 * Wazuh app - React component for show configuration of global configuration - global tab.
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

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';

import { isString } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Agents times reference',
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/global.html#agents-disconnection-time',
    ),
  },
];

const agentsSettings = [
  {
    field: 'agents_disconnection_time',
    label:
      'Seconds after which the manager considers an agent as disconnected since its last keepalive',
  },
  {
    field: 'agents_disconnection_alert_time',
    label: 'Alert time in seconds after agent disconnection',
  },
];

const buildHelpLinks = agent => [helpLinks[0]];

class WzConfigurationAgentsConfigurationGlobal extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    const helpLinks = buildHelpLinks(agent);
    const agentsSettingsConfig = currentConfig['monitor-global'].monitord;
    const agentsSettingsConfigMinutes =
      agentsSettingsConfig.agents_disconnection_time
        ? {
            ...agentsSettingsConfig,
          }
        : agentsSettingsConfig;
    return (
      <Fragment>
        {currentConfig['monitor-global'] &&
          isString(currentConfig['monitor-global']) && (
            <WzNoConfig
              error={currentConfig['monitor-global']}
              help={helpLinks}
            />
          )}
        {currentConfig['monitor-global'] &&
          !isString(currentConfig['monitor-global']) &&
          !currentConfig['monitor-global'].monitord && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig['monitor-global'] &&
          currentConfig['monitor-global'].monitord && (
            <WzConfigurationSettingsHeader
              title='Agents settings'
              description='Time alert agents settings'
              help={helpLinks}
            >
              <WzConfigurationSettingsGroup
                config={agentsSettingsConfigMinutes}
                items={agentsSettings}
              />
            </WzConfigurationSettingsHeader>
          )}
      </Fragment>
    );
  }
}

WzConfigurationAgentsConfigurationGlobal.propTypes = {
  agent: PropTypes.object,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default WzConfigurationAgentsConfigurationGlobal;
