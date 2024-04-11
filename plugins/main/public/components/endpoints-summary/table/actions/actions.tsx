import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { endpointSummary } from '../../../../utils/applications';
import { API_NAME_AGENT_STATUS } from '../../../../../common/constants';
import { getCore } from '../../../../kibana-services';
import { WzElementPermissions } from '../../../common/permissions/element';
import { Agent } from '../../types';

export const agentsTableActions = (
  allowEditGroups: boolean,
  allowUpgrade: boolean,
  setAgent: (agent: Agent) => void,
  setIsEditGroupsVisible: (visible: boolean) => void,
  setIsUpgradeModalVisible: (visible: boolean) => void,
  outdatedAgents: Agent[],
) => [
  {
    name: agent => {
      const name = 'View agent details';

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip content='Since the agent never connected, it is not possible to access its details'>
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: 'View agent details',
    icon: 'eye',
    type: 'icon',
    isPrimary: true,
    color: 'primary',
    enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    onClick: agent =>
      getCore().application.navigateToApp(endpointSummary.id, {
        path: `#/agents?tab=welcome&agent=${agent.id}`,
      }),
  },
  {
    name: agent => {
      const name = 'Agent configuration';

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip content='Since the agent never connected, it is not possible to access its configuration'>
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: 'Agent configuration',
    icon: 'wrench',
    type: 'icon',
    onClick: agent =>
      getCore().application.navigateToApp(endpointSummary.id, {
        path: `#/agents?tab=configuration&agent=${agent.id}`,
      }),
    enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    'data-test-subj': 'action-configuration',
  },
  {
    name: (
      <WzElementPermissions
        permissions={[
          { action: 'group:modify_assignments', resource: 'group:id:*' },
        ]}
      >
        <span>Edit groups</span>
      </WzElementPermissions>
    ),
    description: 'Edit groups',
    icon: 'pencil',
    type: 'icon',
    onClick: (agent: Agent) => {
      setAgent(agent);
      setIsEditGroupsVisible(true);
    },
    'data-test-subj': 'action-groups',
    enabled: () => allowEditGroups,
  },
  {
    name: agent => {
      const name = <span>Upgrade</span>;

      const isOutdated = !!outdatedAgents.find(
        outdatedAgent => outdatedAgent.id === agent.id,
      );

      if (agent.status === API_NAME_AGENT_STATUS.ACTIVE && isOutdated) {
        return (
          <WzElementPermissions
            permissions={[{ action: 'agent:upgrade', resource: 'agent:id:*' }]}
          >
            {name}
          </WzElementPermissions>
        );
      }

      return (
        <EuiToolTip
          content={
            agent.status !== API_NAME_AGENT_STATUS.ACTIVE
              ? 'Agent is not active'
              : 'Agent is up to date'
          }
        >
          {name}
        </EuiToolTip>
      );
    },
    description: 'Upgrade',
    icon: 'package',
    type: 'icon',
    onClick: agent => {
      setAgent(agent);
      setIsUpgradeModalVisible(true);
    },
    'data-test-subj': 'action-upgrade',
    enabled: agent => {
      const isOutdated = !!outdatedAgents.find(
        outdatedAgent => outdatedAgent.id === agent.id,
      );
      return (
        allowUpgrade &&
        agent.status === API_NAME_AGENT_STATUS.ACTIVE &&
        isOutdated
      );
    },
  },
];
