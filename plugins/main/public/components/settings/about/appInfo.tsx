import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import React from 'react';
import { Update } from '../../../../../wazuh-check-updates/common/types';
import { getWazuhCheckUpdatesPlugin } from '../../../kibana-services';

interface SettingsAboutAppInfoProps {
  appInfo: {
    'app-version': string;
    installationDate: string;
    revision: string;
  };
  setCurrentUpdate: (update: Update | undefined) => void;
}

export const SettingsAboutAppInfo = ({ appInfo, setCurrentUpdate }: SettingsAboutAppInfoProps) => {
  const { UpToDateStatus, DismissNotificationCheck } = getWazuhCheckUpdatesPlugin();

  return (
    <>
      <EuiFlexGroup
        direction="row"
        responsive
        alignItems="center"
        justifyContent="flexStart"
        gutterSize="m"
      >
        <EuiFlexItem grow={false}>
          <EuiText>
            <div className="wz-text-truncatable">
              {'App version: '}
              <span className="wz-text-bold">{appInfo['app-version']}</span>
            </div>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <UpToDateStatus setCurrentUpdate={setCurrentUpdate} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiText>
        <div className="wz-text-truncatable">
          {'App revision: '}
          <span className="wz-text-bold">{appInfo['revision']}</span>
        </div>
      </EuiText>
      <EuiSpacer />
      <EuiText>
        <div className="wz-text-truncatable">
          {'Install date: '}
          <span className="wz-text-bold">{appInfo['installationDate']}</span>
        </div>
      </EuiText>
      <EuiSpacer />
      <DismissNotificationCheck />
    </>
  );
};
