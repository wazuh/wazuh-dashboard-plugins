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

import React, { } from 'react';
import ConfigurationHandler from '../utils/configuration-handler';
//@ts-ignore
import { getToasts } from '../../../../kibana-services';
import { ISetting } from '../configuration'
import {
  EuiBottomBar,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButtonEmpty,
  EuiButton
} from '@elastic/eui';
import { WazuhConfig } from '../../../../react-services/wazuh-config';
import { UI_LOGGER_LEVELS, PLUGIN_PLATFORM_NAME } from '../../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

interface IBottomBarProps {
  updatedConfig: { [setting: string]: string | number | boolean | object }
  setUpdateConfig(setting: {}): void
  setLoading(loading: boolean): void
  config: ISetting[]
}

export const BottomBar: React.FunctionComponent<IBottomBarProps> = ({ updatedConfig, setUpdateConfig, setLoading, config }) => {
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

const saveSettings = async (updatedConfig: {}, setUpdateConfig: Function, setLoading: Function, config: ISetting[]) => {
  setLoading(true);
  try {
    await Promise.all(Object.keys(updatedConfig).map(async setting => await saveSetting(setting, updatedConfig, config)));
    successToast();
    setUpdateConfig({});
  } catch (error) {
    const options: UIErrorLog = {
      context: `${BottomBar.name}.saveSettings`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Error saving the configuration: ${error.message || error}`,
      },
    };

    getErrorOrchestrator().handleError(options);
  } finally {
    setLoading(false);
  }
}

const saveSetting = async (setting, updatedConfig, config: ISetting[]) => {
  try {
    (config.find(item => item.setting === setting) || { value: '' }).value = updatedConfig[setting];
    const result = await ConfigurationHandler.editKey(setting, updatedConfig[setting]);

    // Update the app configuration frontend-cached setting in memory with the new value
    const wzConfig = new WazuhConfig();
    wzConfig.setConfig({ ...wzConfig.getConfig(), ...{ [setting]: formatValueCachedConfiguration(updatedConfig[setting]) } });

    // Show restart and/or reload message in toast
    const response = result.data.data;
    response.needRestart && restartToast();
    response.needReload && reloadToast();
    response.needHealtCheck && executeHealtCheck();
  } catch (error) {
    return Promise.reject(error);
  }
}

const reloadToast = () => {
  getToasts().add({
    color: 'success',
    title: 'This settings require you to reload the page to take effect.',
    text: <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
      <EuiFlexItem grow={false}>
        <EuiButton onClick={() => window.location.reload()} size="s">Reload page</EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  })
}

const executeHealtCheck = () => {
  const toast = getToasts().add({
    color: 'warning',
    title: 'You must execute the health check for the changes to take effect',
    toastLifeTimeMs: 5000,
    text:
      <EuiFlexGroup alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false} >
          <EuiButton onClick={() => {
            getToasts().remove(toast);
            window.location.href = '#/health-check';
          }} size="s">Execute health check</EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
  });
}

const restartToast = () => {
  getToasts().add({
    color: 'warning',
    title: `You must restart ${PLUGIN_PLATFORM_NAME} for the changes to take effect`,
  });
}

const successToast = () => {
  getToasts().add({
    color: 'success',
    title: 'The configuration has been successfully updated',
  });
}

const formatValueCachedConfiguration = (value) => typeof value === 'string'
  ? isNaN(Number(value)) ? value : Number(value)
  : value;
