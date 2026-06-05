import React from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
} from '@elastic/eui';

import './appInfo.scss';

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
        alignItems='flexStart'
        justifyContent='flexStart'
        gutterSize='l'
        responsive
      >
        <EuiFlexItem>
          <EuiText>
            App version: <b>{appInfo}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem className='wzAboutAppInfoClusterItem'>
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
