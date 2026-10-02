import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
    setIsScanVulnerabilitiesModalVisible,
  }: {
    setIsRemoveModalVisible: SetModalIsVisible;
    setIsScanVulnerabilitiesModalVisible: SetModalIsVisible;
  },
) => [
  {
    name: (agent: Agent) => {
      const name = i18n.translate(
        'wazuh.endpointsSummary.agentActions.viewAgentDetails',
        { defaultMessage: 'View agent details' },
      );

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip
          content={i18n.translate(
            'wazuh.endpointsSummary.agentActions.viewAgentDetailsNeverConnectedTooltip',
            {
              defaultMessage:
                'Since the agent never connected, it is not possible to access its details',
            },
          )}
        >
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: i18n.translate(
      'wazuh.endpointsSummary.agentActions.viewAgentDetailsDescription',
      { defaultMessage: 'View agent details' },
    ),
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
      const name = i18n.translate(
        'wazuh.endpointsSummary.agentActions.agentConfiguration',
        { defaultMessage: 'Agent configuration' },
      );

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip
          content={i18n.translate(
            'wazuh.endpointsSummary.agentActions.agentConfigurationNeverConnectedTooltip',
            {
              defaultMessage:
                'Since the agent never connected, it is not possible to access its configuration',
            },
          )}
        >
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: i18n.translate(
      'wazuh.endpointsSummary.agentActions.agentConfigurationDescription',
      { defaultMessage: 'Agent configuration' },
    ),
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
    name: i18n.translate('wazuh.endpointsSummary.agentActions.editGroups', {
      defaultMessage: 'Edit groups',
    }),
    description: i18n.translate(
      'wazuh.endpointsSummary.agentActions.editGroupsDescription',
      { defaultMessage: 'Edit groups' },
    ),
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
        return i18n.translate('wazuh.endpointsSummary.agentActions.upgrade', {
          defaultMessage: 'Upgrade',
        });
      }

      return (
        <EuiToolTip
          content={
            agent.status !== API_NAME_AGENT_STATUS.ACTIVE
              ? i18n.translate(
                  'wazuh.endpointsSummary.agentActions.upgradeNotActiveTooltip',
                  { defaultMessage: 'Agent is not active' },
                )
              : i18n.translate(
                  'wazuh.endpointsSummary.agentActions.upgradeUpToDateTooltip',
                  { defaultMessage: 'Agent is up to date' },
                )
          }
        >
          <span>
            {i18n.translate(
              'wazuh.endpointsSummary.agentActions.upgradeDisabled',
              { defaultMessage: 'Upgrade' },
            )}
          </span>
        </EuiToolTip>
      );
    },
    description: i18n.translate(
      'wazuh.endpointsSummary.agentActions.upgradeDescription',
      { defaultMessage: 'Upgrade' },
    ),
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
    name: (agent: Agent) => {
      const name = i18n.translate(
        'wazuh.endpointsSummary.agentActions.scanVulnerabilities',
        { defaultMessage: 'Scan vulnerabilities' },
      );

      if (agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
        return name;
      }

      return (
        <EuiToolTip
          content={i18n.translate(
            'wazuh.endpointsSummary.agentActions.scanVulnerabilitiesNeverConnectedTooltip',
            {
              defaultMessage:
                'Since the agent never connected, there is no inventory to scan',
            },
          )}
        >
          <span>{name}</span>
        </EuiToolTip>
      );
    },
    description: i18n.translate(
      'wazuh.endpointsSummary.agentActions.scanVulnerabilitiesDescription',
      { defaultMessage: 'Scan vulnerabilities' },
    ),
    icon: 'search',
    type: 'icon',
    onClick: (agent: Agent) => {
      setAgent(agent);
      setIsScanVulnerabilitiesModalVisible(true);
    },
    'data-test-subj': 'action-scan-vulnerabilities',
    enabled: (agent: Agent) =>
      agent.status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED,
  },
  {
    name: i18n.translate('wazuh.endpointsSummary.agentActions.remove', {
      defaultMessage: 'Remove',
    }),
    description: i18n.translate(
      'wazuh.endpointsSummary.agentActions.removeDescription',
      { defaultMessage: 'Remove' },
    ),
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
