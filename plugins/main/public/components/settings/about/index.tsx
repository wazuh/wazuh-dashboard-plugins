import React from 'react';
import { EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import { SettingsAboutAppInfo } from './appInfo';
import { SettingsAboutGeneralInfo } from './generalInfo';
import { PLUGIN_APP_NAME } from '../../../../common/constants';

interface SettingsAboutProps {
  appInfo?: {
    'app-version': string;
    revision: string;
  };
}

export const SettingsAbout = (props: SettingsAboutProps) => {
  const { appInfo } = props;

  return (
    <EuiPage paddingSize='m'>
      <EuiPageBody>
        <SettingsAboutAppInfo appInfo={appInfo} />
        <EuiSpacer size='l' />
        <SettingsAboutGeneralInfo pluginAppName={PLUGIN_APP_NAME} />
      </EuiPageBody>
    </EuiPage>
  );
};
