import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import React from 'react';
import { AppInfo } from '../types';

interface SettingsAboutAppInfoProps {
  appInfo?: AppInfo;
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
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
