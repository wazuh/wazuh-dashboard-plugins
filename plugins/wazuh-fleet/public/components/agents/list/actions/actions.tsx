// import React from 'react';
// import { EuiToolTip } from '@elastic/eui';
// import { endpointSummary } from '../../../../utils/applications';
// import { API_NAME_AGENT_STATUS } from '../../../../../common/constants';
// import { WzElementPermissions } from '../../../common/permissions/element';
// import { Agent } from '../../types';
// import NavigationService from '../../../../react-services/navigation-service';

import { Agent } from '../../../../../common/types';

export interface AgentsTableGlobalActionsProps {
  setIsFlyoutAgentVisible: (visible: boolean) => void;
  setIsDeleteModalVisible: (visible: boolean) => void;
  setIsEditGroupsVisible: (visible: boolean) => void;
  setIsUpgradeModalVisible: (visible: boolean) => void;
  setIsEditNameVisible: (visible: boolean) => void;
  setAgent: (agent: Agent) => void;
}

export const agentsTableActions = ({
  setIsFlyoutAgentVisible,
  setAgent,
  setIsDeleteModalVisible,
  setIsEditGroupsVisible,
  setIsUpgradeModalVisible,
  setIsEditNameVisible,
}: AgentsTableGlobalActionsProps) =>
  // allowEditGroups: boolean,
  // allowUpgrade: boolean,
  // setIsUpgradeModalVisible: (visible: boolean) => void,
  // outdatedAgents: Agent[],
  [
    {
      name: 'View agent details',
      description: 'View agent details',
      icon: 'eye',
      type: 'icon',
      isPrimary: true,
      color: 'primary',
      onClick: (agent: Agent) => {
        setAgent(agent);
        setIsFlyoutAgentVisible(true);
      },
      // enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
      // onClick: agent =>
      // NavigationService.getInstance().navigateToApp(endpointSummary.id, {
      //   path: `#/agents?tab=welcome&agent=${agent.id}`,
      // }),
    },
    {
      name: 'Delete agent',
      description: 'Delete agent',
      icon: 'trash',
      type: 'icon',
      isPrimary: true,
      color: 'danger',
      onClick: (agent: Agent) => {
        setAgent(agent);
        setIsDeleteModalVisible(true);
      },
    },
    {
      name: 'Edit name',
      description: 'Edit name',
      icon: 'pencil',
      type: 'icon',
      onClick: (agent: Agent) => {
        setAgent(agent);
        setIsEditNameVisible(true);
      },
      // enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
      // 'data-test-subj': 'action-configuration',
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
      // enabled: () => allowEditGroups,
    },
    {
      name: 'Upgrade',
      description: 'Upgrade',
      icon: 'package',
      type: 'icon',
      onClick: (agent: Agent) => {
        setAgent(agent);
        setIsUpgradeModalVisible(true);
      },
      'data-test-subj': 'action-upgrade',
      // enabled: agent => {
      //   const isOutdated = !!outdatedAgents.find(
      //     outdatedAgent => outdatedAgent.id === agent.id,
      //   );
      //   return (
      //     allowUpgrade &&
      //     agent.status === API_NAME_AGENT_STATUS.ACTIVE &&
      //     isOutdated
      //   );
      // },
    },
  ];
