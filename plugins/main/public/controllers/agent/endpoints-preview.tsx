import React from 'react';
import { EuiProgress, EuiPage, EuiPageBody, EuiButton, EuiCallOut } from '@elastic/eui';
import { RegisterAgent } from '../../controllers/register-agent/containers/register-agent/register-agent';
import { AgentsPreview } from './components/agents-preview';

interface EndpointsPreviewProps {
  init: any;
  loading: boolean;
  errorInit: any;
  load: () => void;
  addingNewAgent: any;
  registerAgentsProps: any;
  tableAgentsProps: any;
  resultState: any;
}

export const EndpointsPreview = ({
  init,
  loading,
  errorInit,
  load,
  addingNewAgent,
  registerAgentsProps,
  tableAgentsProps,
  resultState,
}: EndpointsPreviewProps) => {
  console.log({
    init,
    loading,
    errorInit,
    load,
    addingNewAgent,
    registerAgentsProps,
    tableAgentsProps,
    resultState,
  });
  if (init || loading) {
    return (
      <EuiPage paddingSize="m">
        <EuiPageBody>
          <EuiProgress size="xs" color="primary" />
        </EuiPageBody>
      </EuiPage>
    );
  }

  if (errorInit) {
    return (
      <EuiPage paddingSize="m">
        <EuiPageBody>
          <EuiCallOut title="Error fetching agents" color="danger" iconType="alert">
            <p>{errorInit || 'Internal error'}</p>
            <EuiButton type="secondary" iconType="refresh" onClick={load}>
              Refresh
            </EuiButton>
          </EuiCallOut>
        </EuiPageBody>
      </EuiPage>
    );
  }

  return (
    <EuiPage paddingSize="m">
      <EuiPageBody>
        {addingNewAgent ? (
          <div className="registerAgent">
            <RegisterAgent registerAgentsProps={registerAgentsProps} />
          </div>
        ) : (
          <AgentsPreview tableProps={tableAgentsProps} resultState={resultState} />
        )}
      </EuiPageBody>
    </EuiPage>
  );
};
