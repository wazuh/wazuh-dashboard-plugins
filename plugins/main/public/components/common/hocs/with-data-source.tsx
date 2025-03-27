import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { withGuard } from './withGuard';

const PromptErrorInitializatingDataSource = (props: { error?: string }) => {
  return (
    <EuiEmptyPrompt
      iconType='alert'
      title={<h2>Data source was not initialized</h2>}
      body={<>{typeof props.error === 'string' && <p>{props.error}</p>}</>}
    />
  );
};

export const withDataSourceInitiated = withGuard(
  ({ dataSource, isDataSourceLoading }) => !isDataSourceLoading && !dataSource,
  PromptErrorInitializatingDataSource,
);
