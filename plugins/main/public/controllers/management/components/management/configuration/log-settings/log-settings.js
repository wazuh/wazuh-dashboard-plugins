/*
 * Wazuh app - React component for show configuration of log settings.
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

import WzConfigurationLogSettingsAlerts from './log-settings-alerts';
import WzConfigurationLogSettingsArchives from './log-settings-archives';
import WzConfigurationLogSettingsInternal from './log-settings-internal';
import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import withWzConfig from '../util-hocs/wz-config';

class WzConfigurationLogSettings extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { agent } = this.props;
    return (
      <Fragment>
        {agent && agent.id === '000' ? (
          <WzTabSelector>
            <WzTabSelectorTab label="Alerts">
              <WzConfigurationLogSettingsAlerts {...this.props} />
            </WzTabSelectorTab>
            <WzTabSelectorTab label="Archives">
              <WzConfigurationLogSettingsArchives {...this.props} />
            </WzTabSelectorTab>
            <WzTabSelectorTab label="Internal">
              <WzConfigurationLogSettingsInternal {...this.props} />
            </WzTabSelectorTab>
          </WzTabSelector>
        ) : (
          <div {...this.props}></div>
        )}{' '}
        {/*TODO: when is agent && agent.id !== '000' */}
      </Fragment>
    );
  }
}

const sections = [
  { component: 'analysis', configuration: 'logging' },
  { component: 'monitor', configuration: 'logging' }
];

const sectionsAgent = [
  {
    component: 'agent',
    configuration: 'logging',
    scope: 'null',
    agentId: 'true'
  }
];

export default withWzConfig(sections)(WzConfigurationLogSettings);
