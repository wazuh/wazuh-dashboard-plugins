/*
 * Wazuh app - React component for show configuration of GitHub.
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useMemo } from 'react';
import { EuiBasicTable } from '@elastic/eui';
import { compose } from 'redux';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import WzNoConfig from '../util-components/no-config';
import { isString, renderValueYesThenEnabled } from '../utils/utils';
import { wodleBuilder } from '../utils/builders';
import { withGuard } from '../../../../../../components/common/hocs';
import withWzConfig from '../util-hocs/wz-config';

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

const mainSettings = [
  { field: 'enabled', label: 'Enabled', render: renderValueYesThenEnabled },
  { field: 'only_future_events', label: 'Collect events generated since Wazuh agent was started' },
  { field: 'time_delay', label: 'Time in seconds that each scan will monitor until that delay backwards' },
  { field: 'curl_max_size', label: 'Maximum size allowed for the GitHub API response' },
  { field: 'interval', label: 'Interval between GitHub wodle executions in seconds' },
  { field: 'event_type', label: 'Event type' },
];

const columns = [
  { field: 'org_name', name: 'Name' }
];

const helpLinks = [
  {
    text: 'Using Wazuh to audit GitHub organizations',
    href: 'https://documentation.wazuh.com/current/github/index.html'
  },
  {
    text: 'GitHub module reference',
    href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/github-module.html'
  }
];

export const WzConfigurationGitHub = withWzConfig(sections)(({currentConfig, updateBadge, ...rest }) => {
  const wodleConfiguration = useMemo(() => wodleBuilder(currentConfig, 'github'), [currentConfig]);
  
  useEffect(() => {
    updateBadge(currentConfig &&
      wodleConfiguration &&
      wodleConfiguration['github'] &&
      wodleConfiguration['github'].enabled === 'yes');
  }, [currentConfig]);

  return (
    <WzTabSelector>
      <WzTabSelectorTab label="General">
        <GeneralTab wodleConfiguration={wodleConfiguration} currentConfig={currentConfig} {...rest}/>
      </WzTabSelectorTab>
      <WzTabSelectorTab label="Organizations">
        <OrganizationsTab wodleConfiguration={wodleConfiguration} currentConfig={currentConfig} {...rest}/>
      </WzTabSelectorTab>
    </WzTabSelector>
  )
});


const tabWrapper = compose(
  withGuard(({currentConfig}) => currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']), ({currentConfig}) => <WzNoConfig error={currentConfig['wmodules-wmodules']} help={helpLinks}/>),
  withGuard(({wodleConfiguration}) => !wodleConfiguration['github'], (props) => <WzNoConfig error='not-present' help={helpLinks}/>),
);

const GeneralTab = tabWrapper(({agent, wodleConfiguration}) => (
  <WzConfigurationSettingsTabSelector
    title="Main settings"
    description="Configuration for the GitHub module"
    currentConfig={wodleConfiguration}
    minusHeight={agent.id === '000' ? 260 : 320}
    helpLinks={helpLinks}
  >
    <WzConfigurationSettingsGroup
      config={wodleConfiguration['github']}
      items={mainSettings}
    />           
  </WzConfigurationSettingsTabSelector>
));

const OrganizationsTab = tabWrapper(({agent, wodleConfiguration}) => (
  <WzConfigurationSettingsTabSelector
    title="List of organizations to auditing"
    currentConfig={wodleConfiguration}
    minusHeight={agent.id === '000' ? 260 : 320}
    helpLinks={helpLinks}
  >
    <EuiBasicTable
      columns={columns}
      items={wodleConfiguration['github'].api_auth}
    />
  </WzConfigurationSettingsTabSelector>
));
