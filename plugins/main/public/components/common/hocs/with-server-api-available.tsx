import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiEmptyPrompt } from '@elastic/eui';
import { WzRequest } from '../../../react-services';

const PromptServerAPIUnavailable = () => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>Server API is not available</h2>}
    body={
      <div>
        <p>
          The server API is currently not available. Please check your network
          connection or contact the system administrator.
        </p>
      </div>
    }
  />
);

export const withServerAPIAvailable = WrappedComponent => props => {
  const available = useObservable(
    WzRequest.serverAPIAvailable$,
    WzRequest.serverAPIStatus$.getValue(),
  );

  if (!available) {
    return <PromptServerAPIUnavailable />;
  }

  return <WrappedComponent {...props} />;
};
