import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';

export const ErrorComponentPrompt = (props: {
  errorTitle: any;
  errorInfo?: any;
  style?: any;
  action?: React.ReactNode;
}) => {
  const styles = {
    error: {
      borderTop: '1px solid #777',
      borderBottom: '1px solid #777',
      padding: '12px',
    },
  };

  return (
    <EuiEmptyPrompt
      iconType="faceSad"
      title={<h2>Something went wrong.</h2>}
      body={
        <div style={props.style || styles.error}>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {props.errorTitle && props.errorTitle.toString()}
            <br />
            {props.errorInfo?.componentStack || ''}
          </details>
        </div>
      }
      actions={props.action || null}
    />
  );
};
