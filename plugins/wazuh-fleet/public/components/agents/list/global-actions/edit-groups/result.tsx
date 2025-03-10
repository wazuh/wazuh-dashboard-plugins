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
          field: '_source.agent.name',
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

  return (
    <EuiSteps
      steps={[
        {
          step: 1,
          title: 'Retrieve agents data',
          status: getAgentsStatus,
          children:
            getAgentsStatus === 'loading' ? null : getAgentsStatus ===
              'complete' ? (
              <EuiAccordion
                id='agentsAccordion'
                arrowDisplay='none'
                paddingSize='m'
                buttonContent={`Agents details (${finalAgents.length})`}
              >
                {agentsTable(finalAgents)}
              </EuiAccordion>
            ) : (
              <EuiCallOut
                color='danger'
                iconType='alert'
                title='Could not get agents data'
              >
                <EuiText>{getAgentsError?.message}</EuiText>
              </EuiCallOut>
            ),
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
                {finalAgents.map(agent => {
                  const documentResult = documentResults.find(
                    documentResult => documentResult.documentId === agent._id,
                  );
                  const isLoading = !documentResult;

                  if (isLoading) {
                    return (
                      <EuiFlexItem key={agent._id}>
                        {groupStatus({
                          isLoading,
                          status: RESULT_TYPE.SUCCESS,
                          text: agent._source.agent.name,
                        })}
                      </EuiFlexItem>
                    );
                  }

                  const { result, successAgents } = documentResult;

                  if (result === RESULT_TYPE.SUCCESS) {
                    return (
                      <EuiFlexItem key={agent._id}>
                        {groupStatus({
                          status: RESULT_TYPE.SUCCESS,
                          text: `${agent._source.agent.name} (${groups.join(', ')} ${editAction === EditActionGroups.ADD ? 'added' : 'removed'})`,
                        })}
                      </EuiFlexItem>
                    );
                  }

                  return (
                    <EuiFlexItem key={agent._id}>
                      {groupStatus({
                        status: RESULT_TYPE.ERROR,
                        text: `${agent._source.agent.name} (no ${groups.join(', ')} have been ${editAction === EditActionGroups.ADD ? 'added' : 'removed'})`,
                      })}
                      {successAgents?.length ? (
                        <>
                          <EuiSpacer size='s' />
                          {groupStatus({
                            status: RESULT_TYPE.SUCCESS,
                            text: `Success agents (${successAgents?.length})`,
                          })}
                        </>
                      ) : null}
                    </EuiFlexItem>
                  );
                })}
              </EuiFlexGroup>
            ) : null,
        },
      ]}
    />
  );
};
