import React, { useState } from 'react';
import { EuiLoadingContent, EuiPage, EuiPageBody, EuiPanel, EuiSpacer } from '@elastic/eui';
import { SettingsAboutAppInfo } from './appInfo';
import { SettingsAboutGeneralInfo } from './generalInfo';
import { Update } from '../../../../../wazuh-check-updates/common/types';
import { getWazuhCheckUpdatesPlugin } from '../../../kibana-services';

interface SettingsAboutPageProps {
  appInfo?: {
    'app-version': string;
    installationDate: string;
    revision: string;
  };
  pluginAppName: string;
}

export const SettingsAboutPage = (props: SettingsAboutPageProps) => {
  const { appInfo, pluginAppName } = props;

  const [currentUpdate, setCurrentUpdate] = useState<Update | undefined>();

  const { CurrentUpdateDetails } = getWazuhCheckUpdatesPlugin();

  const isLoading = !appInfo;

  return (
    <EuiPage paddingSize="m">
      <EuiPageBody>
        <SettingsAboutGeneralInfo pluginAppName={pluginAppName} />
        <EuiSpacer size="l" />
        <EuiPanel paddingSize="l">
          {isLoading ? (
            <EuiLoadingContent lines={3} />
          ) : (
            <>
              <SettingsAboutAppInfo appInfo={appInfo} setCurrentUpdate={setCurrentUpdate} />
              {currentUpdate ? (
                <>
                  <EuiSpacer size="l" />
                  <CurrentUpdateDetails currentUpdate={currentUpdate} />
                </>
              ) : null}
            </>
          )}
        </EuiPanel>
      </EuiPageBody>
    </EuiPage>
  );
};
