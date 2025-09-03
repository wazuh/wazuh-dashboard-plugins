import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiEmptyPrompt } from '@elastic/eui';
import { AppState, WzRequest } from '../../../react-services';

const PromptServerAPIUnavailable = () => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>Server API is not available</h2>}
    body={
      <div>
        <p>
          The server API is currently not available. Review the connection with
          the selected server API, the service is running and the API host
          configuration is valid.
        </p>
      </div>
    }
  />
);

export const withServerAPIAvailable = WrappedComponent => props => {
  const available = useObservable(
    WzRequest.serverAPIAvailableChanged$,
    WzRequest.serverAPIAvailable$.getValue(),
  );

  if (!available) {
    return <PromptServerAPIUnavailable />;
  }

  return <WrappedComponent {...props} />;
};

const PromptServerAPINotSelected = () => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>Server API is not selected</h2>}
    body={
      <div>
        <p>
          The server API is not selected. Select it using the server API
          selector.
        </p>
      </div>
    }
  />
);

export const withSelectedServerAPI = WrappedComponent => props => {
  const available = useObservable(
    AppState.selectedServerAPIChanged$,
    AppState.selectedServerAPI$.getValue(),
  );

  if (!available) {
    return <PromptServerAPINotSelected />;
  }

  return <WrappedComponent {...props} />;
};
