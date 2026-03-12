import React from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
  EuiTitle,
} from '@elastic/eui';

export const SettingsAboutAppInfo = ({
  appInfo,
  clusterUuid,
}: {
  appInfo: string;
  clusterUuid?: string | null;
}) => {
  return (
    <EuiCallOut>
      <EuiFlexGroup
        direction='row'
        alignItems='center'
        justifyContent='flexStart'
        gutterSize='none'
      >
        <EuiFlexItem>
          <EuiText>
            App version: <b>{appInfo}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            Cluster UUID:{' '}
            <b>
              {clusterUuid ? (
                clusterUuid
              ) : (
                <EuiTextColor color='subdued'>-</EuiTextColor>
              )}
            </b>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
