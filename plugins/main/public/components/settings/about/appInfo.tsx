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
}

export const SettingsAboutAppInfo = ({ appInfo }: SettingsAboutAppInfoProps) => {
  const { APIsUpdateStatus } = getWazuhCheckUpdatesPlugin();

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
      <APIsUpdateStatus />
    </>
  );
};
