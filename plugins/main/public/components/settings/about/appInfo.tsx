import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import React from 'react';
import { Update } from '../../../../../wazuh-check-updates/common/types';
import { getWazuhCheckUpdatesPlugin } from '../../../kibana-services';

interface SettingsAboutProvider {
  appInfo: {
    'app-version': string;
    installationDate: string;
    revision: string;
  };
  setCurrentUpdate: (update: Update | undefined) => void;
}

export const SettingsAboutAppInfo = ({ appInfo, setCurrentUpdate }: SettingsAboutProvider) => {
  const { UpToDateStatus } = getWazuhCheckUpdatesPlugin();

  return (
    <EuiCallOut>
      <EuiFlexGroup
        direction="row"
        responsive
        alignItems="center"
        justifyContent="flexStart"
        gutterSize="m"
      >
        <EuiFlexItem>
          <EuiFlexGroup
            direction="row"
            responsive
            alignItems="center"
            justifyContent="flexStart"
            gutterSize="s"
          >
            <EuiFlexItem grow={false}>
              <EuiText>
                <div className="wz-text-truncatable">
                  {'App version: '}
                  <span className="wz-text-bold">
                    {appInfo ? appInfo['app-version'] : <EuiLoadingSpinner size="s" />}
                  </span>
                </div>
              </EuiText>
            </EuiFlexItem>
            {appInfo ? (
              <>
                <EuiFlexItem grow={false}>
                  <UpToDateStatus setCurrentUpdate={setCurrentUpdate} />
                </EuiFlexItem>
              </>
            ) : null}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <div className="wz-text-truncatable">
              {'App revision: '}
              <span className="wz-text-bold">
                {appInfo ? appInfo['revision'] : <EuiLoadingSpinner size="s" />}
              </span>
            </div>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <div className="wz-text-truncatable">
              {'Install date: '}
              <span className="wz-text-bold">
                {appInfo ? appInfo['installationDate'] : <EuiLoadingSpinner size="s" />}
              </span>
            </div>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
