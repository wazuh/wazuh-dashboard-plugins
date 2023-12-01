import React, { useState, useEffect } from 'react';
import { EuiPage, EuiPageBody, EuiEmptyPrompt, EuiButton, EuiProgress } from '@elastic/eui';
import { RegisterAgent } from '../../controllers/register-agent/containers/register-agent/register-agent';
import { AgentsPreview } from '../../controllers/agent/components/agents-preview';
import { WzRequest } from '../../react-services/wz-request';

export const FleetPreview = () => {
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [agentStatusSummary, setAgentStatusSummary] = useState();
  const [agentCount, setAgentCount] = useState<number>();
  const [agentsActiveCoverage, setAgentsActiveCoverage] = useState();

  const getSummary = async () => {
    setIsSummaryLoading(true);

    const {
      data: {
        data: { connection: agentStatusSummary, configuration: agentConfiguration },
      },
    } = await WzRequest.apiReq('GET', '/agents/summary/status', {});

    const agentsActiveCoverage = (
      (agentStatusSummary.active / agentStatusSummary.total) *
      100
    ).toFixed(2);

    setAgentStatusSummary(agentStatusSummary);
    setAgentCount(agentStatusSummary.total ?? 0);
    setAgentsActiveCoverage(isNaN(agentsActiveCoverage) ? 0 : agentsActiveCoverage);
    setIsSummaryLoading(false);
  };

  useEffect(() => {
    getSummary();
  }, []);

  if (isSummaryLoading) {
    return (
      <EuiPage paddingSize="m">
        <EuiPageBody>
          <EuiProgress size="xs" color="primary" />
        </EuiPageBody>
      </EuiPage>
    );
  }

  if (agentCount === 0) {
    return (
      <EuiEmptyPrompt
        iconType="watchesApp"
        title={<h2>There are no agents</h2>}
        body={<p>Add agents to fleet to start monitoring</p>}
        actions={
          <EuiButton
            color="primary"
            fill
            //  onClick={openAgentSelector}
          >
            Deploy new agent
          </EuiButton>
        }
      />
    );
  }

  return (
    <EuiPage paddingSize="m">
      <EuiPageBody>
        <AgentsPreview
          agentStatusSummary={agentStatusSummary}
          agentsActiveCoverage={agentsActiveCoverage}
        />
      </EuiPageBody>
    </EuiPage>
  );
};
