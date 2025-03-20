import React from 'react';
import {
  EuiSteps,
  EuiAccordion,
  EuiInMemoryTable,
  EuiCallOut,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingSpinner,
  EuiSpacer,
} from '@elastic/eui';
import { IAgentResponse } from '../../../../../../common/types';
import { GroupResult, RESULT_TYPE } from './edit-groups-modal';
import { EditActionGroups } from './types';

interface EditAgentsGroupsModalResultProps {
  editAction: EditActionGroups;
  finalAgents: IAgentResponse[];
  getAgentsStatus: string;
  getAgentsError?: Error;
  saveChangesStatus: string;
  documentResults: GroupResult[];
  groups: string[];
}

export const EditAgentsGroupsModalResult = ({
  editAction,
  finalAgents,
  getAgentsStatus,
  getAgentsError,
  saveChangesStatus,
  documentResults,
  groups,
}: EditAgentsGroupsModalResultProps) => {
  const agentsTable = (agents: IAgentResponse[]) => (
    <EuiInMemoryTable
      items={agents}
      tableLayout='auto'
      columns={[
        {
          field: '_id',
          name: 'Document id',
          align: 'left',
          sortable: true,
        },
        {
          field: 'agent.name',
          name: 'Name',
          align: 'left',
          sortable: true,
        },
      ]}
      pagination={true}
      sorting={{
        sort: {
          field: 'id',
          direction: 'asc',
        },
      }}
    />
  );

  const groupStatus = (options: {
    isLoading?: boolean;
    status: RESULT_TYPE;
    text: string;
  }) => {
    const { isLoading, status, text } = options;

    return (
      <EuiFlexGroup
        alignItems='center'
        responsive={false}
        wrap={false}
        gutterSize='s'
      >
        <EuiFlexItem grow={false}>
          {isLoading ? (
            <EuiLoadingSpinner size='m' />
          ) : (
            <EuiIcon
              type={status === RESULT_TYPE.SUCCESS ? 'check' : 'alert'}
              color={status === RESULT_TYPE.SUCCESS ? 'success' : 'danger'}
            />
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText color={status === RESULT_TYPE.ERROR ? 'danger' : undefined}>
            {text}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const renderAgentsAccordion = () => (
    <EuiAccordion
      id='agentsAccordion'
      arrowDisplay='none'
      paddingSize='m'
      buttonContent={`Agents details (${finalAgents.length})`}
    >
      {agentsTable(finalAgents)}
    </EuiAccordion>
  );
  const renderErrorCallout = () => (
    <EuiCallOut
      color='danger'
      iconType='alert'
      title='Could not get agents data'
    >
      <EuiText>{getAgentsError?.message}</EuiText>
    </EuiCallOut>
  );

  const renderAgentsDataStep = () => {
    if (getAgentsStatus === 'loading') {
      return null;
    }

    return getAgentsStatus === 'complete'
      ? renderAgentsAccordion()
      : renderErrorCallout();
  };

  const AgentGroupActionResult = ({ agent }: { agent: IAgentResponse }) => {
    const documentResult = documentResults.find(
      result => result.documentId === agent._id,
    );

    // Loading state
    if (!documentResult) {
      return (
        <EuiFlexItem key={agent._id}>
          {groupStatus({
            isLoading: true,
            status: RESULT_TYPE.SUCCESS,
            text: agent.agent.name,
          })}
        </EuiFlexItem>
      );
    }

    const { result, successAgents } = documentResult;
    const actionText =
      editAction === EditActionGroups.ADD ? 'added' : 'removed';
    const groupsList = groups.join(', ');

    // Success state
    if (result === RESULT_TYPE.SUCCESS) {
      return (
        <EuiFlexItem key={agent._id}>
          {groupStatus({
            status: RESULT_TYPE.SUCCESS,
            text: `${agent.agent.name} (${groupsList} ${actionText})`,
          })}
        </EuiFlexItem>
      );
    }

    // Error state
    return (
      <EuiFlexItem key={agent._id}>
        {groupStatus({
          status: RESULT_TYPE.ERROR,
          text: `${agent.agent.name} (no ${groupsList} have been ${actionText})`,
        })}
        {successAgents?.length > 0 && (
          <>
            <EuiSpacer size='s' />
            {groupStatus({
              status: RESULT_TYPE.SUCCESS,
              text: `Success agents (${successAgents.length})`,
            })}
          </>
        )}
      </EuiFlexItem>
    );
  };

  return (
    <EuiSteps
      steps={[
        {
          step: 1,
          title: 'Retrieve agents data',
          status: getAgentsStatus,
          children: renderAgentsDataStep(),
        },
        {
          step: 2,
          title:
            editAction === EditActionGroups.ADD
              ? 'Add groups'
              : 'Remove groups',
          status: saveChangesStatus,
          children:
            getAgentsStatus === 'complete' ? (
              <EuiFlexGroup direction='column'>
                {finalAgents.map(agent => (
                  <AgentGroupActionResult key={agent._id} agent={agent} />
                ))}
              </EuiFlexGroup>
            ) : null,
        },
      ]}
    />
  );
};
