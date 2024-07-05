import React from 'react';
import {
  EuiDescriptionList,
  EuiFlexItem,
  EuiFlexGroup,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiCard,
} from '@elastic/eui';
import { Agent } from '../../../../common/types';
import { AgentGroups, HostOS } from '../../common';
import { getWazuhCore } from '../../../plugin-services';

export interface AgentResumeProps {
  agent: Agent;
}
export const AgentResume = ({ agent }: AgentResumeProps) => {
  const { utils } = getWazuhCore();

  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={2}>
        <EuiCard title='Agent' layout='horizontal'>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>Groups</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  <AgentGroups groups={agent.agent.groups} />
                </EuiDescriptionListDescription>
                <EuiDescriptionListTitle>Cluster node</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent.wazuh.cluster.name}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList compressed>
                <EuiDescriptionListTitle>Version</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {agent.agent.version}
                </EuiDescriptionListDescription>
                <EuiDescriptionListTitle>Last login</EuiDescriptionListTitle>
                <EuiDescriptionListDescription>
                  {utils.formatUIDate(agent.agent.last_login)}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiCard>
      </EuiFlexItem>
      <EuiFlexItem grow={1}>
        <EuiCard title='Host' layout='horizontal'>
          <EuiDescriptionList compressed>
            <EuiDescriptionListTitle>Host OS</EuiDescriptionListTitle>
            <EuiDescriptionListDescription>
              <HostOS os={agent.host.os} />
            </EuiDescriptionListDescription>
            <EuiDescriptionListTitle>Host IP</EuiDescriptionListTitle>
            <EuiDescriptionListDescription>
              {agent.host.ip}
            </EuiDescriptionListDescription>
          </EuiDescriptionList>
        </EuiCard>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
