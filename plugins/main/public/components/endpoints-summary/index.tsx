import React, { useState, useEffect } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiEmptyPrompt,
  EuiProgress,
} from '@elastic/eui';
import { EndpointsSummary } from './endpoints-summary';
import { WzRequest } from '../../react-services/wz-request';
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

export const MainEndpointsSummary = compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb([{ text: endpointSumary.title }]),
)(() => {
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [agentStatusSummary, setAgentStatusSummary] = useState();
  const [agentCount, setAgentCount] = useState<number>();
  const [agentsActiveCoverage, setAgentsActiveCoverage] = useState();

  const getSummary = async () => {
    try {
      setIsSummaryLoading(true);

      const {
        data: {
          data: {
            connection: agentStatusSummary,
            configuration: agentConfiguration,
          },
        },
      } = await WzRequest.apiReq('GET', '/agents/summary/status', {});

      const agentsActiveCoverage = (
        (agentStatusSummary?.active / agentStatusSummary?.total) *
        100
      ).toFixed(2);

      setAgentStatusSummary(agentStatusSummary);
      setAgentCount(agentStatusSummary?.total ?? 0);
      setAgentsActiveCoverage(
        isNaN(agentsActiveCoverage) ? 0 : agentsActiveCoverage,
      );
      setIsSummaryLoading(false);
    } catch (error) {
      setIsSummaryLoading(false);
      setAgentStatusSummary([]);
      setAgentCount(0);
      setAgentsActiveCoverage(0);
      const options = {
        context: `MainEndpointsSummary.getSummary`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Could not get agents summary`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  useEffect(() => {
    getSummary();
  }, []);

  if (isSummaryLoading) {
    return (
      <EuiPage paddingSize='m'>
        <EuiPageBody>
          <EuiProgress size='xs' color='primary' />
        </EuiPageBody>
      </EuiPage>
    );
  }

  if (agentCount === 0) {
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
        <EndpointsSummary
          agentStatusSummary={agentStatusSummary}
          agentsActiveCoverage={agentsActiveCoverage}
        />
      </EuiPageBody>
    </EuiPage>
  );
});
