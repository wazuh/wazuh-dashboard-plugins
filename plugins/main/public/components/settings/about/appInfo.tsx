import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTitle,
  EuiHorizontalRule,
  EuiDescriptionList,
  EuiCallOut,
} from '@elastic/eui';
import React, { useState } from 'react';
import { getWazuhCheckUpdatesPlugin } from '../../../kibana-services';
import { ApiAvailableUpdates } from '../../../../../wazuh-check-updates/common/types';

interface SettingsAboutAppInfoProps {
  appInfo: {
    'app-version': string;
    installationDate: string;
    revision: string;
  };
}

export const SettingsAboutAppInfo = ({ appInfo }: SettingsAboutAppInfoProps) => {
  const [apisAvailableUpdates, setApisAvailableUpdates] = useState<ApiAvailableUpdates[]>();

  const { ApisUpdateStatus } = getWazuhCheckUpdatesPlugin();

  const showVersionWarning = !!apisAvailableUpdates?.find(
    (apiAvailableUpdates) => apiAvailableUpdates.version !== appInfo['app-version']
  );

  return (
    <>
      <EuiTitle>
        <h2>Dashboard version</h2>
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
      {showVersionWarning ? (
        <>
          <EuiSpacer size="l" />
          <EuiCallOut
            title="Dashboard version must be the same as APIs"
            color="warning"
            iconType="alert"
          />
        </>
      ) : null}
      <EuiHorizontalRule margin="l" />
      <ApisUpdateStatus setApisAvailableUpdates={setApisAvailableUpdates} />
    </>
  );
};
