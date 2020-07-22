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
import { Header, Categories } from './components';
import {
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiBottomBar,
  EuiFlexGroup,
  EuiButtonEmpty,
} from '@elastic/eui';
import {
  configEquivalences,
  nameEquivalence,
  categoriesEquivalence,
  formEquivalence
} from '../../../utils/config-equivalences';

export type ISetting = {
  setting: string
  value: boolean | string | number | object
  description: string
  category: string
  name: string
  readonly?: boolean
  form: { type: string, params: {} }
}

export const WzConfigurationSettings = (props) => {
  const [config, setConfig] = useState<ISetting[]>([]);
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
        readOnly: conf === 'admin',
        form: formEquivalence[conf],
      }
    ], []);
    setConfig(formatedConfig);
  }, []);
  const [updatedConfig, setUpdateConfig] = useState({});
  return (
    <EuiPage >
      <EuiPageBody className='mgtPage__body' restrictWidth>
        <EuiPageHeader>
          <Header />
        </EuiPageHeader>
        <Categories config={config} updatedConfig={updatedConfig} setUpdatedConfig={setUpdateConfig} />
        {!!Object.keys(updatedConfig).length &&
          <EuiBottomBar paddingSize="s">
            <EuiFlexGroup>
              <EuiFlexItem>{`${Object.keys(updatedConfig).length}`} unsaved settings</EuiFlexItem>
              <EuiFlexItem grow={false}><EuiButtonEmpty iconSide='left' iconType='cross' onClick={() => setUpdateConfig({})}>Cancel changes</EuiButtonEmpty></EuiFlexItem>
            </EuiFlexGroup>
          </EuiBottomBar>
        }
      </EuiPageBody>
    </EuiPage>
  );
}
