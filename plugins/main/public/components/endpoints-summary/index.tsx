import React, { useState, useEffect } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiEmptyPrompt,
  EuiProgress,
} from '@elastic/eui';
import { EndpointsSummary } from './endpoints-summary';
import { endpointSumary } from '../../utils/applications';
import {
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb,
} from '../common/hocs';
import { compose } from 'redux';
import { WzButtonPermissions } from '../common/permissions/button';
import { getCore } from '../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { useGetTotalAgents } from './hooks';

export const MainEndpointsSummary = compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb([{ text: endpointSumary.title }]),
)(() => {
  const { isLoading, totalAgents, error } = useGetTotalAgents();

  if (error) {
    const options = {
      context: `MainEndpointsSummary.getTotalAgents`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.CRITICAL,
      store: true,
      error: {
        error,
        message: error.message || error,
        title: `Could not get agents summary`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }

  if (isLoading) {
    return (
      <EuiPage paddingSize='m'>
        <EuiPageBody>
          <EuiProgress size='xs' color='primary' />
        </EuiPageBody>
      </EuiPage>
    );
  }

  if (totalAgents === 0) {
    return (
      <EuiEmptyPrompt
        iconType='watchesApp'
        title={<h2>No agents were added to this manager.</h2>}
        body={<p>Add agents to fleet to start monitoring</p>}
        actions={
          <WzButtonPermissions
            color='primary'
            fill
            permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
            iconType='plusInCircle'
            href={getCore().application.getUrlForApp(endpointSumary.id, {
              path: `#${endpointSumary.redirectTo()}deploy`,
            })}
          >
            Deploy new agent
          </WzButtonPermissions>
        }
      />
    );
  }

  return (
    <EuiPage paddingSize='m'>
      <EuiPageBody>
        <EndpointsSummary />
      </EuiPageBody>
    </EuiPage>
  );
});
