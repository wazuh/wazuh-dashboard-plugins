import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import { useSelectedServerApi } from '../hooks/use-selected-server-api';
import { useServerApiAvailable } from '../hooks/use-server-api-available';

const PromptServerAPIUnavailable = () => (
  <EuiEmptyPrompt
    iconType='alert'
    body={
      <p>
        {i18n.translate(
          'wazuh.common.withServerApiAvailable.unavailable.body',
          {
            defaultMessage:
              'The server API is not available. Check the connection, ensure the service is running, and verify the API host configuration.',
          },
        )}
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

const PromptServerAPINotSelected = ({ isCCS }: { isCCS: boolean }) => (
  <EuiEmptyPrompt
    iconType='alert'
    body={
      <p>
        {isCCS
          ? i18n.translate(
              'wazuh.common.withServerApiAvailable.notSelected.ccsBody',
              {
                defaultMessage:
                  'No server API selected. Please choose one from the server API selector.',
              },
            )
          : i18n.translate(
              'wazuh.common.withServerApiAvailable.notSelected.body',
              {
                defaultMessage:
                  'No server API selected. Go to Dashboard Management > Server API to verify the connection.',
              },
            )}
      </p>
    }
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
