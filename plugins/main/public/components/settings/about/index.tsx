import React from 'react';
import { EuiPage, EuiPageBody, EuiSpacer, EuiProgress } from '@elastic/eui';
import { SettingsAboutAppInfo } from './appInfo';
import { SettingsAboutGeneralInfo } from './generalInfo';
import { PLUGIN_APP_NAME } from '../../../../common/constants';
import { useAboutData } from './useAboutData';

export const SettingsAbout: React.FC = () => {
  const { appInfo, loading, error } = useAboutData();

  let headerAbout;
  if (error) {
    headerAbout = null;
  } else if (loading) {
    headerAbout = (
      <>
        <EuiProgress size='xs' color='primary' />
        <EuiSpacer size='l' />
      </>
    );
  } else {
    headerAbout = (
      <>
        <SettingsAboutAppInfo appInfo={appInfo} />
        <EuiSpacer size='l' />
      </>
    );
  }

  return (
    <EuiPage paddingSize='m'>
      <EuiPageBody>
        {headerAbout}
        <SettingsAboutGeneralInfo pluginAppName={PLUGIN_APP_NAME} />
      </EuiPageBody>
    </EuiPage>
  );
};
