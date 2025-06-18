import React, { useEffect, useState } from 'react';
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
import { Subject } from 'rxjs';
import { Agent, IAgentResponse } from '../../../../common/types';
import { AgentResume } from '../details/resume';
import {
  getAgentManagement,
  getCore,
  getWazuhCore,
} from '../../../plugin-services';
import { enrollmentAgent } from '../../common/views';
import { TableIndexer } from '../../common/table-indexer/table-indexer';
import { ConfirmModal } from '../../common/confirm-modal/confirm-modal';
import {
  Filter,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import { AGENTS_SUMMARY_ID } from '../../../groups/agents/applications';
import { AGENTS_ID } from '../../../groups/agents/constants';
import { agentsTableColumns } from './columns';
import { AgentsVisualizations } from './visualizations';
import { EditAgentGroupsModal } from './actions/edit-groups-modal';
import { UpgradeAgentModal } from './actions/upgrade-agent-modal';
import { AgentsTableGlobalActions } from './global-actions/global-actions';
import { EditAgentNameModal } from './actions/edit-name-agent-modal';
import { actionsButtons } from './actions/actions';
// import { getAgents } from './global-actions/common/get-agents';

export interface AgentListProps {
  indexPatterns: IndexPattern;
  filters: Filter[];
}

export const AgentList = ({ indexPatterns, filters }: AgentListProps) => {
  const refresh$ = new Subject<void>();
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [agent, setAgent] = useState<IAgentResponse>();
  const [isEditGroupsVisible, setIsEditGroupsVisible] = useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [isEditNameVisible, setIsEditNameVisible] = useState(false);
  const [agentSelected, setAgentSelected] = useState<Agent[]>([]);
  const [allAgentsSelected, setAllAgentsSelected] = useState<boolean>(false);
  const [params, setParams] = useState({
    filters: [],
    query: '',
    pagination: {
      pageIndex: 0,
      pageSize: 15,
    },
    sort: {
      field: '',
      direction: '',
    },
  });

  useEffect(() => {
    const subscription = refresh$.subscribe(() => {
      setAgentSelected([]);
      setAllAgentsSelected(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh$]);

  const navigateToDeployNewAgent = () => {
    getWazuhCore()
      .navigationService.getInstance()
      .navigate(enrollmentAgent.path);
  };

  const closeModal = () => {
    setIsDeleteModalVisible(false);
    setAgent(undefined);
  };

  const confirmDelete = async () => {
    if (agent) {
      try {
        setIsLoadingModal(true);
        await getAgentManagement().delete(agent._source.agent.id);
        setIsLoadingModal(false);
        closeModal();
        refresh$.next();
      } catch {
        setIsLoadingModal(false);
      }
    }
  };

  const onSelectAll = async (isAllChecked: boolean) => {
    setAllAgentsSelected(isAllChecked);
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
            reloadAgents={() => refresh$.next()}
            allAgentsSelected={allAgentsSelected}
            params={params}
          />,
        ]}
      />
      <EuiSpacer />
      {indexPatterns ? (
        <TableIndexer
          appId={AGENTS_ID}
          refresh$={refresh$.asObservable()}
          setParams={setParams}
          setAllAgentsSelected={setAllAgentsSelected}
          filters={filters}
          indexPatterns={indexPatterns}
          topTableComponent={(searchBarProps: any) => (
            <AgentsVisualizations searchBarProps={searchBarProps} />
          )}
          agentSelected={agentSelected}
          actionsColumn={actionsButtons({
            setIsFlyoutAgentVisible: setIsFlyoutVisible,
            setAgent,
            setIsDeleteModalVisible,
            setIsEditGroupsVisible,
            setIsUpgradeModalVisible,
            setIsEditNameVisible,
          })}
          onSelectAll={isAllChecked => onSelectAll(isAllChecked)}
          onSelectRow={agentSelected => {
            setAgentSelected(agentSelected);
          }}
          columns={agentsTableColumns}
        />
      ) : null}
      {isEditGroupsVisible && agent && (
        <EditAgentGroupsModal
          onClose={() => {
            setIsEditGroupsVisible(false);
            setAgent(undefined);
          }}
          reloadAgents={() => refresh$.next()}
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
          reloadAgents={() => refresh$.next()}
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
          reloadAgents={() => refresh$.next()}
          agent={agent}
        />
      )}
      {isFlyoutVisible && agent ? (
        <EuiFlyout
          ownFocus
          onClose={() => setIsFlyoutVisible(false)}
          aria-labelledby='flyout-agent'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>
                <EuiLink
                  href={getCore().application.getUrlForApp(AGENTS_SUMMARY_ID, {
                    path: `#/agents/${agent?._source.agent.id}`,
                  })}
                  target='_blank'
                >
                  {agent?._source.agent.name}
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
