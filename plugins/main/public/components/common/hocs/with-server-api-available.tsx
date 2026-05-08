import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { useSelector } from 'react-redux';
import { useSelectedServerApi } from '../hooks/use-selected-server-api';
import { useServerApiAvailable } from '../hooks/use-server-api-available';

const MESSAGES = {
  UNAVAILABLE:
    'The server API is not available. Check the connection, ensure the service is running, and verify the API host configuration.',
  NOT_SELECTED_CCS:
    'No server API selected. Please choose one from the server API selector.',
  NOT_SELECTED:
    'No server API selected. Go to Dashboard Management > Server API to verify the connection.',
};

const PromptServerAPIUnavailable = () => (
  <EuiEmptyPrompt iconType='alert' body={<p>{MESSAGES.UNAVAILABLE}</p>} />
);

export const withServerAPIAvailable =
  (WrappedComponent: React.FC) => (props: any) => {
    const { isAvailable } = useServerApiAvailable();

    if (!isAvailable) {
      return <PromptServerAPIUnavailable />;
    }

    return <WrappedComponent {...props} />;
  };

const PromptServerAPINotSelected = ({ isCCS }: { isCCS: boolean }) => (
  <EuiEmptyPrompt
    iconType='alert'
    body={<p>{isCCS ? MESSAGES.NOT_SELECTED_CCS : MESSAGES.NOT_SELECTED}</p>}
  />
);

export const withSelectedServerAPI =
  (WrappedComponent: React.FC) => (props: any) => {
    const { selectedAPI } = useSelectedServerApi();
    const isCCS = useSelector(
      (state: any) => state.appStateReducers?.isCCS ?? false,
    );

    if (!selectedAPI) {
      return <PromptServerAPINotSelected isCCS={isCCS} />;
    }

    return <WrappedComponent {...props} />;
  };
