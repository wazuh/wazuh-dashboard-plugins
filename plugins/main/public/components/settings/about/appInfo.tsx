import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiTitle,
  EuiHorizontalRule,
  EuiDescriptionList,
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
  const { ApisUpdateStatus } = getWazuhCheckUpdatesPlugin();

  return (
    <>
      <EuiTitle>
        <h2>Wazuh Dashboard version</h2>
      </EuiTitle>
      <EuiSpacer size="l" />
      <EuiFlexGroup responsive={false} wrap alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiDescriptionList
            listItems={[
              {
                title: 'Version',
                description: appInfo['app-version'],
              },
            ]}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiDescriptionList
            listItems={[
              {
                title: 'Revision',
                description: appInfo['revision'],
              },
            ]}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiDescriptionList
            listItems={[
              {
                title: 'Install date',
                description: appInfo['installationDate'],
              },
            ]}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiHorizontalRule margin="l" />
      <ApisUpdateStatus />
    </>
  );
};
