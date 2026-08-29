import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { API_NAME_AGENT_STATUS } from '../../../../../common/constants';
import { Agent } from '../../types';
import NavigationService from '../../../../react-services/navigation-service';
import { isVersionLower } from '../utils';
import { endpointsSummaryI18n } from '../../i18n';

type SetModalIsVisible = (visible: boolean) => void;

export const agentsTableActions = (
  setAgent: (agent: Agent) => void,
  setIsEditGroupsVisible: SetModalIsVisible,
  setIsUpgradeModalVisible: SetModalIsVisible,
  apiVersion: string,
  {
    // TODO: consider moving the positional arguments to this to avoid bug related to position and allow to extend easily.
    setIsRemoveModalVisible,
  }: { setIsRemoveModalVisible: SetModalIsVisible },
) => [
  {
    name: (agent: Agent) => {
      const name = endpointsSummaryI18n.viewAgentDetails;

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip content={endpointsSummaryI18n.neverConnectedDetailsTip}>
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: endpointsSummaryI18n.viewAgentDetails,
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
      const name = endpointsSummaryI18n.agentConfiguration;

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip content={endpointsSummaryI18n.neverConnectedConfigTip}>
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: endpointsSummaryI18n.agentConfiguration,
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
    name: endpointsSummaryI18n.editGroups,
    description: endpointsSummaryI18n.editGroups,
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
        return endpointsSummaryI18n.upgrade;
      }

      return (
        <EuiToolTip
          content={
            agent.status !== API_NAME_AGENT_STATUS.ACTIVE
              ? endpointsSummaryI18n.agentNotActive
              : endpointsSummaryI18n.agentUpToDate
          }
        >
          <span>{endpointsSummaryI18n.upgrade}</span>
        </EuiToolTip>
      );
    },
    description: endpointsSummaryI18n.upgrade,
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
    name: endpointsSummaryI18n.remove,
    description: endpointsSummaryI18n.remove,
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
