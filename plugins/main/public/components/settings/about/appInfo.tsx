import React from 'react';
import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';

export const SettingsAboutAppInfo = ({ appInfo }: { appInfo: string }) => {
  return (
    <EuiCallOut>
      <EuiFlexGroup
        alignItems='center'
        justifyContent='flexStart'
        gutterSize='none'
      >
        <EuiFlexItem>
          <EuiText>
            App version: <b>{appInfo}</b>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
