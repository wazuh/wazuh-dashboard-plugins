import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { API_NAME_AGENT_STATUS } from '../../../../../common/constants';
import { WzElementPermissions } from '../../../common/permissions/element';
import { Agent } from '../../types';
import NavigationService from '../../../../react-services/navigation-service';
import { isVersionLower } from '../utils';

type SetModalIsVisible = (visible: boolean) => void;

export const agentsTableActions = (
  allowEditGroups: boolean,
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
    name: agent => {
      const name = i18n.translate('wazuh.endpoints.table.actions.viewDetails', {
        defaultMessage: 'View agent details',
      });

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip content={i18n.translate('wazuh.endpoints.table.actions.viewDetailsDisabledTooltip', {
          defaultMessage: 'Since the agent never connected, it is not possible to access its details',
        })}>
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: i18n.translate('wazuh.endpoints.table.actions.viewDetailsDescription', {
      defaultMessage: 'View agent details',
    }),
    icon: 'eye',
    type: 'icon',
    isPrimary: true,
    color: 'primary',
    enabled: agent => agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
    onClick: agent =>
      NavigationService.getInstance().navigate(
        `/agents?tab=welcome&agent=${agent.id}`,
      ),
  },
  {
    name: agent => {
      const name = i18n.translate('wazuh.endpoints.table.actions.agentConfiguration', {
        defaultMessage: 'Agent configuration',
      });

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip content={i18n.translate('wazuh.endpoints.table.actions.agentConfigurationDisabledTooltip', {
          defaultMessage: 'Since the agent never connected, it is not possible to access its configuration',
        })}>
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: i18n.translate('wazuh.endpoints.table.actions.agentConfigurationDescription', {
      defaultMessage: 'Agent configuration',
    }),
    icon: 'wrench',
    type: 'icon',
    onClick: agent =>
      NavigationService.getInstance().navigate(
        `/agents?tab=configuration&agent=${agent.id}`,
      ),
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
        <span>{i18n.translate('wazuh.endpoints.table.actions.editGroups', {
          defaultMessage: 'Edit groups',
        })}</span>
      </WzElementPermissions>
    ),
    description: i18n.translate('wazuh.endpoints.table.actions.editGroupsDescription', {
      defaultMessage: 'Edit groups',
    }),
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
    name: (agent: Agent) => {
      const isOutdated = isVersionLower(agent.version, apiVersion);

      if (agent.status === API_NAME_AGENT_STATUS.ACTIVE && isOutdated) {
        return i18n.translate('wazuh.endpoints.table.actions.upgrade', {
          defaultMessage: 'Upgrade',
        });
      }

      return (
        <EuiToolTip
          content={
            agent.status !== API_NAME_AGENT_STATUS.ACTIVE
              ? i18n.translate('wazuh.endpoints.table.actions.upgradeDisabledNotActive', {
                  defaultMessage: 'Agent is not active',
                })
              : i18n.translate('wazuh.endpoints.table.actions.upgradeDisabledUpToDate', {
                  defaultMessage: 'Agent is up to date',
                })
          }
        >
          <span>{i18n.translate('wazuh.endpoints.table.actions.upgrade', {
            defaultMessage: 'Upgrade',
          })}</span>
        </EuiToolTip>
      );
    },
    description: i18n.translate('wazuh.endpoints.table.actions.upgradeDescription', {
      defaultMessage: 'Upgrade',
    }),
    icon: 'package',
    type: 'icon',
    onClick: agent => {
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
    name: (agent: Agent) => {
      return i18n.translate('wazuh.endpoints.table.actions.remove', {
        defaultMessage: 'Remove',
      });
    },
    description: i18n.translate('wazuh.endpoints.table.actions.removeDescription', {
      defaultMessage: 'Remove',
    }),
    icon: 'trash',
    type: 'icon',
    onClick: agent => {
      setAgent(agent);
      setIsRemoveModalVisible(true);
    },
    'data-test-subj': 'action-remove',
    enabled: (agent: Agent) => {
      return true;
    },
  },
];
