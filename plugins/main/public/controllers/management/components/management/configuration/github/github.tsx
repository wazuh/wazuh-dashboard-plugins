/*
 * Wazuh app - React component for show configuration of GitHub.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useMemo } from 'react';
import { compose } from 'redux';

import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsListSelector from '../util-components/configuration-settings-list-selector';
import WzTabSelector, {
  WzTabSelectorTab,
} from '../util-components/tab-selector';
import WzNoConfig from '../util-components/no-config';
import { isString, renderValueYesThenEnabled } from '../utils/utils';
import { wodleBuilder, settingsListBuilder } from '../utils/builders';
import { withGuard } from '../../../../../../components/common/hocs';
import withWzConfig from '../util-hocs/wz-config';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

const mainSettings = [
  {
    field: 'enabled',
    label: 'Service status',
    render: renderValueYesThenEnabled,
  },
  {
    field: 'only_future_events',
    label: 'Collect events generated since agent was started',
  },
  {
    field: 'time_delay',
    label:
      'Time in seconds that each scan will monitor until that delay backwards',
  },
  {
    field: 'curl_max_size',
    label: 'Maximum size allowed for the GitHub API response',
  },
  {
    field: 'interval',
    label: 'Interval between GitHub wodle executions in seconds',
  },
  { field: 'event_type', label: 'Event type' },
];

const columns = [
  { field: 'org_name', label: 'Organization' },
  { field: 'api_token', label: 'Token' },
];

const helpLinks = [
  {
    text: 'Monitoring GitHub',
    href: webDocumentationLink('cloud-security/github/index.html'),
  },
  {
    text: 'GitHub module reference',
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/github-module.html',
    ),
  },
];

export const WzConfigurationGitHub = withWzConfig(sections)(
  ({ currentConfig, updateBadge, ...rest }) => {
    const wodleConfiguration = useMemo(
      () => wodleBuilder(currentConfig, 'github'),
      [currentConfig],
    );

    useEffect(() => {
      updateBadge(
        currentConfig &&
          wodleConfiguration &&
          wodleConfiguration['github'] &&
          wodleConfiguration['github'].enabled === 'yes',
      );
    }, [currentConfig]);

    return (
      <WzTabSelector>
        <WzTabSelectorTab label='General'>
          <GeneralTab
            wodleConfiguration={wodleConfiguration}
            currentConfig={currentConfig}
            {...rest}
          />
        </WzTabSelectorTab>
        <WzTabSelectorTab label='Credentials'>
          <CredentialsTab
            wodleConfiguration={wodleConfiguration}
            currentConfig={currentConfig}
            {...rest}
          />
        </WzTabSelectorTab>
      </WzTabSelector>
    );
  },
);

const tabWrapper = compose(
  withGuard(
    ({ currentConfig }) =>
      currentConfig['wmodules-wmodules'] &&
      isString(currentConfig['wmodules-wmodules']),
    ({ currentConfig }) => (
      <WzNoConfig error={currentConfig['wmodules-wmodules']} help={helpLinks} />
    ),
  ),
  withGuard(
    ({ wodleConfiguration }) => !wodleConfiguration['github'],
    props => <WzNoConfig error='not-present' help={helpLinks} />,
  ),
);

const GeneralTab = tabWrapper(({ agent, wodleConfiguration }) => (
  <WzConfigurationSettingsHeader
    title='Main settings'
    description='Configuration for the GitHub module'
    help={helpLinks}
  >
    <WzConfigurationSettingsGroup
      config={wodleConfiguration['github']}
      items={mainSettings}
    />
  </WzConfigurationSettingsHeader>
));

const CredentialsTab = tabWrapper(({ agent, wodleConfiguration }) => {
  const credentials = useMemo(
    () =>
      settingsListBuilder(wodleConfiguration['github'].api_auth, 'org_name'),
    [wodleConfiguration],
  );
  return (
    <WzConfigurationSettingsHeader
      title='List of organizations to auditing'
      help={helpLinks}
    >
      <WzConfigurationSettingsListSelector
        items={credentials}
        settings={columns}
      />
    </WzConfigurationSettingsHeader>
  );
});
