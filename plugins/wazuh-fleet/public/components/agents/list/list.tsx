import React, { useState } from 'react';
import {
  EuiPageHeader,
  EuiSpacer,
  EuiButton,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiText,
  EuiTitle,
  EuiLink,
} from '@elastic/eui';
import { Agent } from '../../../../common/types';
import { AgentResume } from '../details/resume';
import { getAgentManagement, getCore } from '../../../plugin-services';
import NavigationService from '../../../react-services/navigation-service';
import { enrollmentAgent } from '../../common/views';
import { TableIndexer } from '../../common/table-indexer/table-indexer';
import { ConfirmModal } from '../../common/confirm-modal/confirm-modal';
import { agentsTableColumns } from './columns';
import { AgentsVisualizations } from './visualizations';
import { EditAgentGroupsModal } from './actions/edit-groups-modal';
import { UpgradeAgentModal } from './actions/upgrade-agent-modal';
import { AgentsTableGlobalActions } from './global-actions/global-actions';
import { EditAgentNameModal } from './actions/edit-name-agent-modal';

export interface AgentListProps {
  indexPatterns: any;
  filters: any[];
}

export const AgentList = (props: AgentListProps) => {
  const { indexPatterns, filters } = props;
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [agent, setAgent] = useState<Agent>();
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [isEditNameVisible, setIsEditNameVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [agentSelected, setAgentSelected] = useState<Agent[]>([]);

  const navigateToDeployNewAgent = () => {
    NavigationService.getInstance().navigate(enrollmentAgent.path);
  };

  const onSelectionChange = (selectedItems: Agent[]) => {
    setAgentSelected(selectedItems);
  };

  const reloadAgents = () => {
    getAgentManagement().getAll();
  };

  const closeModal = () => {
    setIsDeleteModalVisible(false);
    setAgent(undefined);
  };

  const confirmDelete = async () => {
    if (agent) {
      try {
        setIsLoadingModal(true);
        await getAgentManagement().delete(agent.agent.id);
        setIsLoadingModal(false);
        closeModal();
      } catch {
        setIsLoadingModal(false);
      }
    }
  };

  return (
    <>
      <EuiPageHeader
        pageTitle='Agents'
        rightSideItems={[
          <EuiButton
            key='add-agent'
            fill
            iconType='plusInCircle'
            onClick={() => navigateToDeployNewAgent()}
          >
            Enroll new agent
          </EuiButton>,
          <AgentsTableGlobalActions
            key='actions'
            selectedAgents={agentSelected}
            allowDeleteAgent
            allowEditGroups
            allowGetTasks
            allowUpgrade
            reloadAgents={() => reloadAgents()}
            // allAgentsSelected
          />,
        ]}
      />
      <EuiSpacer />
      {indexPatterns ? (
        <TableIndexer
          filters={filters}
          indexPatterns={indexPatterns}
          topTableComponent={(searchBarProps: any) => (
            <AgentsVisualizations searchBarProps={searchBarProps} />
          )}
          columns={agentsTableColumns({
            setIsFlyoutAgentVisible: setIsFlyoutVisible,
            setAgent,
            setIsDeleteModalVisible,
            setIsEditGroupsVisible,
            setIsUpgradeModalVisible,
            setIsEditNameVisible,
          })}
          tableProps={{
            hasActions: true,
            isSelectable: true,
            itemId: 'agent',
            selection: {
              selectable: (agent: Agent) => agent.agent.status === 'active',
              selectableMessage: selectable =>
                selectable ? undefined : 'Agent is currently offline',
              onSelectionChange: onSelectionChange,
            },
          }}
        />
      ) : null}
      {isEditGroupsVisible && agent && (
        <EditAgentGroupsModal
          onClose={() => {
            setIsEditGroupsVisible(false);
            setAgent(undefined);
          }}
          reloadAgents={() => {}}
          agent={agent}
        />
      )}
      <ConfirmModal
        isVisible={isDeleteModalVisible}
        title='Delete agent'
        message='Are you sure you want to delete this agent?'
        onConfirm={confirmDelete}
        onCancel={closeModal}
        confirmButtonText='Delete'
        buttonColor='danger'
        isLoading={isLoadingModal}
      />
      {isUpgradeModalVisible && agent && (
        <UpgradeAgentModal
          agent={agent}
          reloadAgents={() => reloadAgents()}
          onClose={() => {
            setIsUpgradeModalVisible(false);
            setAgent(undefined);
          }}
        />
      )}
      {isEditNameVisible && agent && (
        <EditAgentNameModal
          onClose={() => {
            setIsEditNameVisible(false);
            setAgent(undefined);
          }}
          reloadAgents={() => {}}
          agent={agent}
        />
      )}
      {isFlyoutVisible ? (
        <EuiFlyout
          ownFocus
          onClose={() => setIsFlyoutVisible(false)}
          aria-labelledby='flyout-agent'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>
                <EuiLink
                  href={getCore().application.getUrlForApp('wazuh-fleet', {
                    path: `#/agents/${agent?.agent.id}`,
                  })}
                  target='_blank'
                >
                  {agent?.agent.name}
                </EuiLink>
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText>
              <AgentResume agent={agent} />
            </EuiText>
          </EuiFlyoutBody>
        </EuiFlyout>
      ) : null}
    </>
  );
};
