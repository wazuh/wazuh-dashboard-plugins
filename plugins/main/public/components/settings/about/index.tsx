import React from 'react';
import { EuiLoadingContent, EuiPage, EuiPageBody, EuiPanel, EuiSpacer } from '@elastic/eui';
import { SettingsAboutAppInfo } from './appInfo';
import { SettingsAboutGeneralInfo } from './generalInfo';

interface SettingsAboutProps {
  appInfo?: {
    'app-version': string;
    installationDate: string;
    revision: string;
  };
  pluginAppName: string;
}

export const SettingsAbout = (props: SettingsAboutProps) => {
  const { appInfo, pluginAppName } = props;

  const isLoading = !appInfo;

  return (
    <EuiPage paddingSize="m">
      <EuiPageBody>
        <SettingsAboutGeneralInfo pluginAppName={pluginAppName} />
        <EuiSpacer size="l" />
        <EuiPanel paddingSize="l">
          {isLoading ? <EuiLoadingContent lines={3} /> : <SettingsAboutAppInfo appInfo={appInfo} />}
        </EuiPanel>
      </EuiPageBody>
    </EuiPage>
  );
};
