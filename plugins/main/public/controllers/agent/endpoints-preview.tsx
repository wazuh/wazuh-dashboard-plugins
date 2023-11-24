import React from 'react';
import { EuiProgress, EuiIcon } from '@elastic/eui';
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
  if (init || loading) {
    return (
      <div class="md-padding md-padding-top-16">
        <EuiProgress size="xs" color="primary" />
      </div>
    );
  }

  if (errorInit) {
    <div class="wz-margin-top-16" layout="column" layout-align="start space-around">
      <div flex layout="row" layout-align="center center">
        <div class="euiPanel euiFlexItem wz-margin-10" flex="50" class="wz-md-card" flex>
          <md-card-content class="wz-text-center">
            <span class="embPanel__header embPanel__title embPanel__dragger layout-row wz-headline-title">
              <EuiIcon type="help" />
              Error fetching agents
            </span>
            <md-divider class="wz-margin-top-10"></md-divider>
            <div layout="row" class="wz-margin-top-10 layout-align-center-center">
              <p class="wz-text-gray">{errorInit || 'Internal error'}</p>
            </div>
            <div layout="row" class="wz-margin-top-10 layout-align-center-center">
              <button class="kuiButton kuiButton--secondary height-35" onClick={load}>
                <EuiIcon type="refresh" />
                Refresh
              </button>
            </div>
          </md-card-content>
        </div>
      </div>
    </div>;
  }

  return (
    <div layout="column" layout-align="start space-around">
      {addingNewAgent ? (
        <div class="registerAgent">
          <RegisterAgent registerAgentsProps={registerAgentsProps} />
        </div>
      ) : (
        <div>
          {/* <kbn-dis class="hide-filter-control"></kbn-dis> */}
          <AgentsPreview tableProps={tableAgentsProps} resultState={resultState} />
        </div>
      )}
    </div>
  );
};
