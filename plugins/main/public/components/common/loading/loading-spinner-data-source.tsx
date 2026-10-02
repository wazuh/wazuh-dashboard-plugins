import React from 'react';
import {
  EuiTitle,
  EuiPanel,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

export function LoadingSpinnerDataSource() {
  return (
    <EuiPanel
      hasBorder={false}
      hasShadow={false}
      color='transparent'
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <EuiEmptyPrompt
        icon={<EuiLoadingSpinner data-test-subj='loadingSpinner' size='xl' />}
        title={
          <EuiTitle size='s' data-test-subj='loadingSpinnerText'>
            <h2>
              {i18n.translate('wazuh.common.loadingSpinnerDataSource.title', {
                defaultMessage: 'Checking data source',
              })}
            </h2>
          </EuiTitle>
        }
      />
    </EuiPanel>
  );
}
