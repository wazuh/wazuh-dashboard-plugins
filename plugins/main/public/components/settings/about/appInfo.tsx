import React, { useState } from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
  EuiButton,
  EuiIcon,
} from '@elastic/eui';

export const SettingsAboutAppInfo = ({
  appInfo,
  clusterUuid,
}: {
  appInfo: string;
  clusterUuid?: string | null;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdateClick = async () => {
    setIsLoading(true);
    setShowSuccess(false);

    // Adam

    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);

      // Look for how much time is given on other sections
      setTimeout(() => setShowSuccess(false), 5000);
    }, 2000);
  };
  return (
    <EuiCallOut>
      <EuiFlexGroup direction='column' gutterSize='s'>
        <EuiFlexItem grow={false}>
          <EuiText>
            App version: <b>{appInfo}</b>
          </EuiText>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction='row' alignItems='center' gutterSize='m'>
            <EuiFlexItem grow={false}>
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

            <EuiFlexItem grow={false}>
              <EuiButton
                size='s'
                isLoading={isLoading}
                onClick={handleUpdateClick}
                iconType='refresh'
              >
                Request CTI update
              </EuiButton>
            </EuiFlexItem>

            {showSuccess && (
              <EuiFlexItem grow={false}>
                <EuiText size='s'>
                  <EuiTextColor color='success'>
                    <EuiIcon type='check' /> Update requested successfully
                  </EuiTextColor>
                </EuiText>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
