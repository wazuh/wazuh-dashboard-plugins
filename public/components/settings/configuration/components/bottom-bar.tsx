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

import React, { } from 'react';
import ConfigurationHandler from '../utils/configuration-handler';
//@ts-ignore
import { toastNotifications } from 'ui/notify';
import { ISetting } from '../configuration'
import {
  EuiBottomBar,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButtonEmpty,
  EuiButton
} from '@elastic/eui';



interface IButtomBarProps {
  updatedConfig: { [setting: string]: string | number | boolean | object }
  setUpdateConfig(setting: {}): void
  setLoading(loading:boolean): void
  config: ISetting[]
}

export const ButtomBar: React.FunctionComponent<IButtomBarProps> = ({ updatedConfig, setUpdateConfig, setLoading, config }) => {
  return (!!Object.keys(updatedConfig).length
    ? <EuiBottomBar paddingSize="m">
      <EuiFlexGroup alignItems='center' justifyContent='spaceBetween' gutterSize='s'>
        <SettingLabel updatedConfig={updatedConfig} />
        <CancelButton setUpdateConfig={setUpdateConfig} />
        <SaveButton
          updatedConfig={updatedConfig}
          setUpdateConfig={setUpdateConfig}
          setLoading={setLoading}
          config={config} />
      </EuiFlexGroup>
    </EuiBottomBar>
    : null
  );
}

const SettingLabel = ({ updatedConfig }) => (
  <EuiFlexItem className='mgtAdvancedSettingsForm__unsavedCount'>
    <EuiText color='ghost' className='mgtAdvancedSettingsForm__unsavedCountMessage'>
      {`${Object.keys(updatedConfig).length} unsaved settings`}
    </EuiText>
  </EuiFlexItem>
);


const CancelButton = ({ setUpdateConfig }) => (
  <EuiFlexItem grow={false}>
    <EuiButtonEmpty
      size='s'
      iconSide='left'
      iconType='cross'
      color="ghost"
      className="mgtAdvancedSettingsForm__button"
      onClick={() => setUpdateConfig({})}>
      Cancel changes
    </EuiButtonEmpty>
  </EuiFlexItem>
)

const SaveButton = ({ updatedConfig, setUpdateConfig, setLoading, config }) => (
  <EuiFlexItem grow={false}>
    <EuiButton
      fill
      size='s'
      iconSide='left'
      iconType='check'
      color='secondary'
      className="mgtAdvancedSettingsForm__button"
      onClick={() => saveSettings(updatedConfig, setUpdateConfig, setLoading, config)} >
      Save changes
      </EuiButton>
  </EuiFlexItem>
)

const saveSettings = (updatedConfig: {}, setUpdateConfig: Function, setLoading: Function, config: ISetting[]) => {
  setLoading(true);
  Object.keys(updatedConfig).forEach(async setting => await saveSetting(setting, updatedConfig, config));
  successToast();
  setUpdateConfig({});
  setTimeout(() => setLoading(false), 500);
}

const saveSetting = async (setting, updatedConfig, config:ISetting[]) => {
  (config.find(item => item.setting === setting) || {value:''}).value = updatedConfig[setting]
  const result = await ConfigurationHandler.editKey(setting, updatedConfig[setting]);
  const response = result.data.data;
  response.needRestart && restartToast();
  response.needReload && reloadToast();
}

const reloadToast = () => {
  toastNotifications.add({
    color: 'success',
    title: 'This settings require you to reload the page to take effect.',
    text: <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
      <EuiFlexItem grow={false}>
        <EuiButton onClick={() => window.location.reload()} size="s">Reload page</EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  })
}

const restartToast = () => {
  toastNotifications.add({
    color:'warning',
    title:'You must restart Kibana for the changes to take effect',
  });
}

const successToast = () => {
  toastNotifications.add({
    color:'success',
    title:'The configuration has been successfully updated',
  });
}