import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import React from 'react';
import { formatUIDate } from '../../../react-services/time-service';

interface SettingsAboutAppInfoProps {
  appInfo?: {
    'app-version': string;
    installationDate: string;
    revision: string;
  };
}

export const SettingsAboutAppInfo = ({ appInfo }: SettingsAboutAppInfoProps) => {
  return (
    <EuiCallOut>
      <EuiFlexGroup alignItems="center" justifyContent="flexStart" gutterSize="none">
        <EuiFlexItem>
          <EuiText>
            App version: <b>{appInfo?.['app-version'] ? appInfo['app-version'] : ''}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            App revision: <b>{appInfo?.['revision'] ? appInfo['revision'] : ''}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            Install date:{' '}
            <b>{appInfo?.['installationDate'] ? formatUIDate(appInfo['installationDate']) : ''}</b>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
