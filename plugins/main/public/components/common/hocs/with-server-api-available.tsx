import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { useSelectedServerApi } from '../hooks/use-selected-server-api';
import { useServerApiAvailable } from '../hooks/use-server-api-available';

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

export const withServerAPIAvailable =
  (WrappedComponent: React.FC) => (props: any) => {
    const { isAvailable } = useServerApiAvailable();

    if (!isAvailable) {
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

export const withSelectedServerAPI =
  (WrappedComponent: React.FC) => (props: any) => {
    const { selectedAPI } = useSelectedServerApi();

    if (!selectedAPI) {
      return <PromptServerAPINotSelected />;
    }

    return <WrappedComponent {...props} />;
  };
