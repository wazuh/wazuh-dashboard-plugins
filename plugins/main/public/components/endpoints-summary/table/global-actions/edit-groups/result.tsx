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
import { Agent } from '../../../types';
import { GroupResult, RESULT_TYPE } from './edit-groups-modal';
import { ErrorAgent } from '../../../services/paginated-agents-group';

interface EditAgentsGroupsModalResultProps {
  addOrRemove: 'add' | 'remove';
  finalAgents: Agent[];
  getAgentsStatus: string;
  getAgentsError?: Error;
  saveChangesStatus: string;
  groupResults: GroupResult[];
  groups: string[];
}

export const EditAgentsGroupsModalResult = ({
  addOrRemove,
  finalAgents,
  getAgentsStatus,
  getAgentsError,
  saveChangesStatus,
  groupResults,
  groups,
}: EditAgentsGroupsModalResultProps) => {
  const agentsTable = (agents: Agent[]) => (
    <EuiInMemoryTable
      items={agents}
      tableLayout='auto'
      columns={[
        {
          field: 'id',
          name: 'Id',
          align: 'left',
          sortable: true,
        },
        {
          field: 'name',
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

  const errorsTable = (errors: ErrorAgent[] = []) => (
    <EuiInMemoryTable
      items={errors}
      tableLayout='auto'
      columns={[
        {
          field: 'error.code',
          name: 'Code',
          align: 'left',
          sortable: true,
          width: '100px',
        },
        {
          field: 'error.message',
          name: 'Error',
          align: 'left',
          sortable: true,
        },
        {
          field: 'error.remediation',
          name: 'Remediation',
          align: 'left',
          sortable: true,
        },
        {
          field: 'id',
          name: 'Agent IDs',
          align: 'left',
          render: ids => ids.join(', '),
        },
      ]}
      pagination={true}
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
          title: addOrRemove === 'add' ? 'Add groups' : 'Remove groups',
          status: saveChangesStatus,
          children:
            getAgentsStatus === 'complete' ? (
              <EuiFlexGroup direction='column'>
                {groups.map(group => {
                  const groupResult = groupResults.find(
                    groupResult => groupResult.group === group,
                  );
                  const isLoading = !groupResult;

                  if (isLoading)
                    return (
                      <EuiFlexItem key={group}>
                        {groupStatus({
                          isLoading,
                          status: RESULT_TYPE.SUCCESS,
                          text: group,
                        })}
                      </EuiFlexItem>
                    );

                  const {
                    result,
                    successAgents,
                    errorAgents,
                    totalErrorAgents,
                  } = groupResult;

                  if (result === RESULT_TYPE.SUCCESS)
                    return (
                      <EuiFlexItem key={group}>
                        <EuiAccordion
                          id={`${group}Accordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={groupStatus({
                            status: RESULT_TYPE.SUCCESS,
                            text: `${group} (${finalAgents.length})`,
                          })}
                        >
                          {agentsTable(finalAgents)}
                        </EuiAccordion>
                      </EuiFlexItem>
                    );

                  return (
                    <EuiFlexItem key={group}>
                      <EuiAccordion
                        id={`${group}Accordion`}
                        arrowDisplay='none'
                        paddingSize='m'
                        initialIsOpen={true}
                        buttonContent={groupStatus({
                          status: RESULT_TYPE.ERROR,
                          text: group,
                        })}
                      >
                        <EuiAccordion
                          id={`${group}Accordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={groupStatus({
                            status: RESULT_TYPE.ERROR,
                            text: `Failed agents (${totalErrorAgents})`,
                          })}
                        >
                          {errorsTable(errorAgents)}
                        </EuiAccordion>
                        {successAgents?.length ? (
                          <>
                            <EuiSpacer size='s' />
                            <EuiAccordion
                              id={`${group}Accordion`}
                              arrowDisplay='none'
                              paddingSize='m'
                              buttonContent={groupStatus({
                                status: RESULT_TYPE.SUCCESS,
                                text: `Success agents (${successAgents?.length})`,
                              })}
                            >
                              {agentsTable(
                                successAgents.map(
                                  agentId =>
                                    finalAgents.find(
                                      finalAgent => finalAgent.id === agentId,
                                    ) as Agent,
                                ),
                              )}
                            </EuiAccordion>
                          </>
                        ) : null}
                      </EuiAccordion>
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
