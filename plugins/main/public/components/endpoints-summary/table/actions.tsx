import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { API_NAME_AGENT_STATUS } from '../../../../common/constants';
import { getCore } from '../../../kibana-services';
import { itHygiene } from '../../../utils/applications';
import { WzElementPermissions } from '../../common/permissions/element';

export const agentsTableActions = (
  allowEditGroups: boolean,
  setAgent: (agent) => void,
  setIsEditGroupsVisible: (visible: boolean) => void,
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
    enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    onClick: agent =>
      getCore().application.navigateToApp(itHygiene.id, {
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
      getCore().application.navigateToApp(itHygiene.id, {
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
    onClick: agent => {
      setAgent(agent);
      setIsEditGroupsVisible(true);
    },
    'data-test-subj': 'action-groups',
    enabled: () => !allowEditGroups,
  },
  {
    name: (
      <WzElementPermissions
        permissions={[
          { action: 'group:modify_assignments', resource: 'group:id:*' },
        ]}
      >
        <span>Upgrade</span>
      </WzElementPermissions>
    ),
    description: 'Upgrade',
    icon: 'package',
    type: 'icon',
    onClick: agent => {
      setAgent(agent);
      setIsEditGroupsVisible(true);
    },
    'data-test-subj': 'action-upgrade',
    enabled: () => !allowEditGroups,
  },
];
