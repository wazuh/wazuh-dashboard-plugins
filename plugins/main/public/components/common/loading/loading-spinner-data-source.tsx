import React from 'react';
import {
  EuiTitle,
  EuiPanel,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { IntlProvider } from 'react-intl';

export function LoadingSpinnerDataSource() {
  return (
    <IntlProvider locale='en'>
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
                <FormattedMessage
                  id='wazuh.dataSource.checking'
                  defaultMessage='Checking data source'
                />
              </h2>
            </EuiTitle>
          }
        />
      </EuiPanel>
    </IntlProvider>
  );
}
