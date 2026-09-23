import React from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

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
            {i18n.translate(
              'wazuh.dashboardsSettings.aboutAppInfo.appVersionLabel',
              {
                defaultMessage: 'App version:',
              },
            )}{' '}
            <b>{appInfo}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem className='wzAboutAppInfoClusterItem'>
          <EuiText>
            {i18n.translate(
              'wazuh.dashboardsSettings.aboutAppInfo.clusterUuidLabel',
              {
                defaultMessage: 'Cluster UUID:',
              },
            )}{' '}
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
