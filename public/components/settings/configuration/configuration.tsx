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
import {
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
} from '@elastic/eui';
import { WzConfigurationTable } from './configuration-table';
import { Header, Categories } from './components';
import { configEquivalences, nameEquivalence, categoriesEquivalence, formEquivalence } from '../../../utils/config-equivalences';

export type ISetting = {
  setting: string
  value: boolean | string | number | object
  description: string
  category: string
  name: string
  readonly?: boolean
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
  return (
    <EuiPage >
      <EuiPageBody>
        <EuiPageHeader>
          <Header />
        </EuiPageHeader>
        <Categories config={config} />


        {/* TODO: Delete this
        <br />
          ⬇ TO DELETE ⬇
          <br />
        <EuiFlexItem>
          <EuiPanel paddingSize="l">
            <WzConfigurationTable {...props} />
          </EuiPanel>
        </EuiFlexItem> */}


      </EuiPageBody>
    </EuiPage>
  );
}
