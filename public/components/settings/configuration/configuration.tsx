/*
 * Wazuh app - React component building the configuration component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import { Header, Categories, BottomBar } from './components';
import { useKbnLoadingIndicator} from '../../common/hooks';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
  Query,
} from '@elastic/eui';
import {
  configEquivalences,
  nameEquivalence,
  categoriesEquivalence,
  formEquivalence
} from '../../../../common/config-equivalences';
import store from '../../../redux/store'
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import { withUserAuthorizationPrompt, withErrorBoundary, withReduxProvider } from '../../common/hocs'
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../common/constants';
import { compose } from 'redux';

export type ISetting = {
  setting: string
  value: boolean | string | number | object
  description: string
  category: string
  name: string
  readonly?: boolean
  form: { type: string, params: {} }
}

const WzConfigurationSettingsProvider = (props) => {
  const [loading, setLoading ] = useKbnLoadingIndicator();
  const [config, setConfig] = useState<ISetting[]>([]);
  const [query, setQuery] = useState('');
  const [updatedConfig, setUpdateConfig] = useState({});
  useEffect(() => {
    store.dispatch(updateSelectedSettingsSection('configuration'));
    const rawConfig = props.wazuhConfig.getConfig();
    const formatedConfig = Object.keys(rawConfig).reduce<ISetting[]>((acc, conf) => [
      ...acc,
      {
        setting: conf,
        value: rawConfig[conf],
        description: configEquivalences[conf],
        category: categoriesEquivalence[conf],
        name: nameEquivalence[conf],
        form: formEquivalence[conf],
      }
    ], []);
    setConfig(formatedConfig);
  }, []);
  return (
    <EuiPage >
      <EuiPageBody className='mgtPage__body' restrictWidth>
        <EuiPageHeader>
          <Header query={query} setQuery={setQuery} />
        </EuiPageHeader>
        <Categories config={Query.execute(query.query || query, config)} updatedConfig={updatedConfig} setUpdatedConfig={setUpdateConfig} />
        <EuiSpacer size="xxl" />
        <BottomBar
          updatedConfig={updatedConfig}
          setUpdateConfig={setUpdateConfig}
          setLoading={setLoading}
          config={config} />
      </EuiPageBody>
    </EuiPage>
  );
}
export const WzConfigurationSettings = compose (
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(WzConfigurationSettingsProvider);
