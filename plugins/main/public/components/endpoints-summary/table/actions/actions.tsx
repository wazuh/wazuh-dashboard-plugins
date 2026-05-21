import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { API_NAME_AGENT_STATUS } from '../../../../../common/constants';
import { Agent } from '../../types';
import NavigationService from '../../../../react-services/navigation-service';
import { isVersionLower } from '../utils';

type SetModalIsVisible = (visible: boolean) => void;

export const agentsTableActions = (
  setAgent: (agent: Agent) => void,
  setIsEditGroupsVisible: (visible: boolean) => void,
  setIsUpgradeModalVisible: (visible: boolean) => void,
  apiVersion: string,
  {
    // TODO: consider moving the positional arguments to this to avoid bug related to position and allow to extend easily.
    setIsRemoveModalVisible,
  }: { setIsRemoveModalVisible: SetModalIsVisible },
) => [
  {
    name: (agent: Agent) => {
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
    enabled: (agent: Agent) =>
      agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    onClick: (agent: Agent) =>
      NavigationService.getInstance().navigate(
        `/agents?tab=welcome&agent=${agent.id}`,
      ),
  },
  {
    name: (agent: Agent) => {
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
    onClick: (agent: Agent) =>
      NavigationService.getInstance().navigate(
        `/agents?tab=configuration&agent=${agent.id}`,
      ),
    enabled: (agent: Agent) =>
      agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    'data-test-subj': 'action-configuration',
  },
  {
    name: 'Edit groups',
    description: 'Edit groups',
    icon: 'pencil',
    type: 'icon',
    onClick: (agent: Agent) => {
      setAgent(agent);
      setIsEditGroupsVisible(true);
    },
    'data-test-subj': 'action-groups',
    enabled: () => true,
  },
  {
    name: (agent: Agent) => {
      const isOutdated = isVersionLower(agent.version, apiVersion);

      if (agent.status === API_NAME_AGENT_STATUS.ACTIVE && isOutdated) {
        return 'Upgrade';
      }

      return (
        <EuiToolTip
          content={
            agent.status !== API_NAME_AGENT_STATUS.ACTIVE
              ? 'Agent is not active'
              : 'Agent is up to date'
          }
        >
          <span>Upgrade</span>
        </EuiToolTip>
      );
    },
    description: 'Upgrade',
    icon: 'package',
    type: 'icon',
    onClick: (agent: Agent) => {
      setAgent(agent);
      setIsUpgradeModalVisible(true);
    },
    'data-test-subj': 'action-upgrade',
    enabled: (agent: Agent) => {
      const isOutdated = isVersionLower(agent.version, apiVersion);
      return agent.status === API_NAME_AGENT_STATUS.ACTIVE && isOutdated;
    },
  },
  {
    name: 'Remove',
    description: 'Remove',
    icon: 'trash',
    type: 'icon',
    onClick: (agent: Agent) => {
      setAgent(agent);
      setIsRemoveModalVisible(true);
    },
    'data-test-subj': 'action-remove',
    enabled: () => true,
  },
];
