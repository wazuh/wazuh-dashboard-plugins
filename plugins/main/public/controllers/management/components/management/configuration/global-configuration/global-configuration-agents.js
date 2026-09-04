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

import { isString, renderValueOrNoValue } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Agents times reference',
    href: webDocumentationLink(
      'user-manual/agent/agent-enrollment/agent-life-cycle.html#agent-connection-states',
    ),
  },
];

/* The values come from wazuh-manager.conf as written by the user, so they keep
their configured time suffix (for example `15m`) instead of being resolved to
seconds. The labels are therefore unit-agnostic. */
const agentsSettings = [
  {
    field: 'agents_disconnection_time',
    label:
      'Time after which the manager considers an agent as disconnected since its last keepalive',
    render: renderValueOrNoValue,
  },
];

class WzConfigurationAgentsConfigurationGlobal extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, wazuhNotReadyYet } = this.props;
    const agentsSettingsConfig = currentConfig?.['global'];

    if (agentsSettingsConfig && isString(agentsSettingsConfig)) {
      return <WzNoConfig error={agentsSettingsConfig} help={helpLinks} />;
    }

    if (wazuhNotReadyYet && (!currentConfig || !agentsSettingsConfig)) {
      return <WzNoConfig error='Server not ready yet' help={helpLinks} />;
    }

    if (!agentsSettingsConfig || !Object.keys(agentsSettingsConfig).length) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Agents settings'
          description='Time alert agents settings'
          help={helpLinks}
        >
          <WzConfigurationSettingsGroup
            config={agentsSettingsConfig}
            items={agentsSettings}
          />
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

WzConfigurationAgentsConfigurationGlobal.propTypes = {
  agent: PropTypes.object,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default WzConfigurationAgentsConfigurationGlobal;
