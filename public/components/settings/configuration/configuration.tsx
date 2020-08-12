/*
 * Wazuh app - React component building the configuration component.
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

import React, { useState, useEffect } from 'react';
import { Header, Categories, BottomBar } from './components';
import { useKbnLoadingIndicator} from '../../common/hooks';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  Query,
} from '@elastic/eui';
import {
  configEquivalences,
  nameEquivalence,
  categoriesEquivalence,
  formEquivalence
} from '../../../utils/config-equivalences';
import WzReduxProvider from '../../../redux/wz-redux-provider'
import { withUserAuthorizationPrompt } from '../../common/hocs/withUserAuthorization'
import { EuiSpacer } from '@elastic/eui';

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
const WzConfigurationSettingsWrapper = withUserAuthorizationPrompt(null, ['administrator'])(WzConfigurationSettingsProvider);
export function WzConfigurationSettings(props) {
  return(
    <WzReduxProvider>
      <WzConfigurationSettingsWrapper {...props}/>
    </WzReduxProvider>
  );
}
