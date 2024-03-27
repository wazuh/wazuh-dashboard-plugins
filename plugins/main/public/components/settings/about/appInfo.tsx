import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import React from 'react';

interface SettingsAboutAppInfoProps {
  appInfo?: {
    'app-version': string;
    revision: string;
  };
}

export const SettingsAboutAppInfo = ({
  appInfo,
}: SettingsAboutAppInfoProps) => {
  return (
    <EuiCallOut>
      <EuiFlexGroup
        alignItems='center'
        justifyContent='flexStart'
        gutterSize='none'
      >
        <EuiFlexItem>
          <EuiText>
            App version:{' '}
            <b>{appInfo?.['app-version'] ? appInfo['app-version'] : ''}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            App revision:{' '}
            <b>{appInfo?.['revision'] ? appInfo['revision'] : ''}</b>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
