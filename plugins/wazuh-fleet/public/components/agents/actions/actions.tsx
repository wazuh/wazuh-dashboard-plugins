// import React from 'react';
// import { EuiToolTip } from '@elastic/eui';
// import { endpointSummary } from '../../../../utils/applications';
// import { API_NAME_AGENT_STATUS } from '../../../../../common/constants';
// import { WzElementPermissions } from '../../../common/permissions/element';
// import { Agent } from '../../types';
// import NavigationService from '../../../../react-services/navigation-service';

export const agentsTableActions = () =>
  // allowEditGroups: boolean,
  // allowUpgrade: boolean,
  // setAgent: (agent: Agent) => void,
  // setIsEditGroupsVisible: (visible: boolean) => void,
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
      onClick: () => {},
      // enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
      // onClick: agent =>
      // NavigationService.getInstance().navigateToApp(endpointSummary.id, {
      //   path: `#/agents?tab=welcome&agent=${agent.id}`,
      // }),
    },
    {
      name: 'Agent configuration',
      description: 'Agent configuration',
      icon: 'wrench',
      type: 'icon',
      onClick: () => {},
      // onClick: agent =>
      //   NavigationService.getInstance().navigateToApp(endpointSummary.id, {
      //     path: `#/agents?tab=configuration&agent=${agent.id}`,
      //   }),
      // enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
      // 'data-test-subj': 'action-configuration',
    },
    {
      name: 'Edit groups',
      description: 'Edit groups',
      icon: 'pencil',
      type: 'icon',
      onClick: () => {},
      // onClick: (agent: Agent) => {
      //   setAgent(agent);
      //   setIsEditGroupsVisible(true);
      // },
      // 'data-test-subj': 'action-groups',
      // enabled: () => allowEditGroups,
    },
    {
      name: 'Upgrade',
      description: 'Upgrade',
      icon: 'package',
      type: 'icon',
      onClick: () => {},
      // onClick: agent => {
      //   setAgent(agent);
      //   setIsUpgradeModalVisible(true);
      // },
      // 'data-test-subj': 'action-upgrade',
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
