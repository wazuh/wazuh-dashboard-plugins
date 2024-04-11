import './loading-spinner.scss';
import React from 'react';
import { EuiTitle, EuiPanel, EuiEmptyPrompt, EuiLoadingSpinner } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

export function LoadingSpinner() {
  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="transparent" className="discoverNoResults">
      <EuiEmptyPrompt
        icon={<EuiLoadingSpinner data-test-subj="loadingSpinner" size="xl" />}
        title={
          <EuiTitle size="s" data-test-subj="loadingSpinnerText">
            <h2>
              <FormattedMessage id="discover.searchingTitle" defaultMessage="Searching" />
            </h2>
          </EuiTitle>
        }
      />
    </EuiPanel>
  );
}
