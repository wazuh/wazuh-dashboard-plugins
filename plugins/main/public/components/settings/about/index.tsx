import React from 'react';
import { EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import { SettingsAboutAppInfo } from './appInfo';
import { SettingsAboutGeneralInfo } from './generalInfo';

interface SettingsAboutProps {
  appInfo?: {
    'app-version': string;
    revision: string;
  };
  pluginAppName: string;
}

export const SettingsAbout = (props: SettingsAboutProps) => {
  const { appInfo, pluginAppName } = props;

  return (
    <EuiPage paddingSize='m'>
      <EuiPageBody>
        <SettingsAboutAppInfo appInfo={appInfo} />
        <EuiSpacer size='l' />
        <SettingsAboutGeneralInfo pluginAppName={pluginAppName} />
      </EuiPageBody>
    </EuiPage>
  );
};
