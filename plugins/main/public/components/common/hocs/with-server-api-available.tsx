import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { useSelectedServerApi } from '../hooks/use-selected-server-api';
import { useServerApiAvailable } from '../hooks/use-server-api-available';

const PromptServerAPIUnavailable = () => (
  <EuiEmptyPrompt
    iconType='alert'
    body={
      <p>
        The server API is not available. Check the connection, ensure the
        service is running, and verify the API host configuration.
      </p>
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
    body={
      <p>
        No server API selected. Please choose one from the server API selector.
      </p>
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
