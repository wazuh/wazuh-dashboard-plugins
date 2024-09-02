import React, { JSXElementConstructor, ReactElement, ReactNode } from 'react';
import { EuiTitle, EuiEmptyPrompt, EuiProgress } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import './loading-searchbar-progress.scss';

interface LoadingSearchbarProgress {
  message?: React.ReactNode;
}

export function LoadingSearchbarProgress({
  message,
}: LoadingSearchbarProgress) {
  return (
    <>
      <EuiProgress size='xs' color='primary' />
      <EuiEmptyPrompt
        className='wz-loading-searchbar-progress'
        title={
          <EuiTitle size='m' data-test-subj='loadingSearchbarProgress'>
            <h4>
              {message ? (
                message
              ) : (
                <FormattedMessage
                  id='discover.searchingTitle'
                  defaultMessage='Searching'
                />
              )}
            </h4>
          </EuiTitle>
        }
      />
    </>
  );
}
