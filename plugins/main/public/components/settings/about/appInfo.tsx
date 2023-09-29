import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiTitle,
  EuiHorizontalRule,
} from '@elastic/eui';
import React from 'react';
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
      <EuiTitle>
        <h2>Wazuh Dashboard version</h2>
      </EuiTitle>
      <EuiSpacer size="l" />
      <EuiFlexGroup
        direction="row"
        responsive
        alignItems="center"
        justifyContent="flexStart"
        gutterSize="xl"
      >
        <EuiFlexItem grow={false}>
          <EuiText>
            <div className="wz-text-truncatable">
              {'Version: '}
              <span className="wz-text-bold">{appInfo['app-version']}</span>
            </div>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            <div className="wz-text-truncatable">
              {'Revision: '}
              <span className="wz-text-bold">{appInfo['revision']}</span>
            </div>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            <div className="wz-text-truncatable">
              {'Install date: '}
              <span className="wz-text-bold">{appInfo['installationDate']}</span>
            </div>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiHorizontalRule margin="l" />
      <APIsUpdateStatus />
    </>
  );
};
