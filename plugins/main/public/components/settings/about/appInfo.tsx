import React, { useState } from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
  EuiButton,
} from '@elastic/eui';

import { GenericRequest } from '../../../react-services';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getToasts } from '../../../kibana-services';

export const SettingsAboutAppInfo = ({
  appInfo,
  clusterUuid,
}: {
  appInfo: string;
  clusterUuid?: string | null;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateClick = async () => {
    setIsLoading(true);

    try {
      await GenericRequest.request('POST', '/api/cti-feeds/update');
        getToasts().add({
          color: 'success',
          title: 'CTI update requested',
          text: 'The update has been requested successfully',
          toastLifeTimeMs: 5000,
        });
    } catch (error) {
      const options = {
        context: `${SettingsAboutAppInfo.name}.handleUpdateClick`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: 'Error updating CTI feeds',
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EuiCallOut>
      <p>
        <EuiFlexGroup alignItems='center' justifyContent='spaceBetween'>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction='column' gutterSize='xs'>
              <EuiFlexItem grow={false}>
                <EuiText>
                  App version: <b>{appInfo}</b>
                </EuiText>
              </EuiFlexItem>

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
            </EuiFlexGroup>
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
        </EuiFlexGroup>
      </p>
    </EuiCallOut>
  );
};
