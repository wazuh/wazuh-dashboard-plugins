/*
 * Wazuh app - React component for main settings
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState, } from 'react';
import { Route, Switch } from 'react-router-dom';
import { compose } from 'redux';
import {getWzConfig} from '../../../react-services/get-config';
import { withGlobalBreadcrumb } from '../../common/hocs/withGlobalBreadcrumb';
import { useHistory } from 'react-router-dom';
import { useAgentsSummary } from '../../common/hooks/agents/use-agents-summary';
import { EuiFlexGroup, EuiFlexItem, EuiTab, EuiTabs } from '@elastic/eui';
import { ApiTable } from '../components/settings-api'
import SettingsLogs from '../components/settings-logs'
import { WzSampleDataProvider } from '../components/settings-sample-data'
import { EnableModulesWrapper } from '../components/settings-modules'
import { AboutSettings } from  '../components/settings-about'
import { WzConfigurationSettings }  from '../components/settings-configuration'



const SETTINGS_PAGE_URL = '/settings';
const SETTINGS_API_PAGE_URL = `${SETTINGS_PAGE_URL}/api`;
const SETTINGS_MODULES_PAGE_URL = `${SETTINGS_PAGE_URL}/modules`;
const SETTINGS_CONFIGURATION_PAGE_URL = `${SETTINGS_PAGE_URL}/configuration`;
const SETTINGS_SAMPLE_DATA_PAGE_URL = `${SETTINGS_PAGE_URL}/sampledata`;
const SETTINGS_LOGS_PAGE_URL = `${SETTINGS_PAGE_URL}/logs`;
const SETTINGS_ABOUT_PAGE_URL = `${SETTINGS_PAGE_URL}/about`;




const tabs = [
  {
    id: 'api',
    name: 'API'
  },
  {
    id: 'modules',
    name: 'Modules',
    disabled: false,
    href: SETTINGS_MODULES_PAGE_URL
  },
  {
    id: 'sampledata',
    name: 'Sample data',
    disabled: false,
    href: SETTINGS_SAMPLE_DATA_PAGE_URL
  },
  {
    id: 'configuration',
    name: 'Configuration',
    disabled: false,
    href: SETTINGS_CONFIGURATION_PAGE_URL
  },
  {
    id: 'logs',
    name: 'Logs',
    disabled: false,
    href: SETTINGS_LOGS_PAGE_URL
  },
  {
    id: 'about',
    name: 'About'
  },
];

export const MainSettings = compose(withGlobalBreadcrumb([{ text: '' }, { text: 'Settings' }]))(
  (props) => {
    useEffect(()=> {getWzConfig()},[]
    )
    const history = useHistory();
    const settingTabs = tabs.map((tab, index) => (
      <EuiTab
        // {...(tab.href && { href: tab.href, target: '_blank' })}
        onClick={() => history.push(`${SETTINGS_PAGE_URL}/${tab.id}`)}
        isSelected={tab.id === props.match.params.section}
        // disabled={tab.disabled}
        key={index}>
        {tab.name}
      </EuiTab>
    ));
    return <>
      <EuiTabs>{settingTabs}</EuiTabs>
      <Switch>
        <Route path={SETTINGS_API_PAGE_URL} render={() => <ApiTable />} />
        <Route path={SETTINGS_MODULES_PAGE_URL} render={() => <EnableModulesWrapper />} />
        <Route path={SETTINGS_CONFIGURATION_PAGE_URL} render={() => <WzConfigurationSettings />} />
        <Route path={SETTINGS_ABOUT_PAGE_URL} render={() => <AboutSettings />} />
        <Route path={SETTINGS_SAMPLE_DATA_PAGE_URL} render={() => <WzSampleDataProvider />} />
        <Route path={SETTINGS_LOGS_PAGE_URL} render={() => <SettingsLogs />} />
      </Switch>
    </>
  })
