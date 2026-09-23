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
import { i18n } from '@osd/i18n';
import { Agent } from '../../../types';
import { GroupResult, RESULT_TYPE } from './edit-groups-modal';
import { ErrorAgent } from '../../../services/paginated-agents-request';

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
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkEditGroupsResult.agentsTable.columns.id',
            { defaultMessage: 'Id' },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'name',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkEditGroupsResult.agentsTable.columns.name',
            { defaultMessage: 'Name' },
          ),
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
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkEditGroupsResult.errorsTable.columns.code',
            { defaultMessage: 'Code' },
          ),
          align: 'left',
          sortable: true,
          width: '100px',
        },
        {
          field: 'error.message',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkEditGroupsResult.errorsTable.columns.error',
            { defaultMessage: 'Error' },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'error.remediation',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkEditGroupsResult.errorsTable.columns.remediation',
            { defaultMessage: 'Remediation' },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'id',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkEditGroupsResult.errorsTable.columns.agentIds',
            { defaultMessage: 'Agent IDs' },
          ),
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
          title: i18n.translate(
            'wazuh.endpointsSummary.bulkEditGroupsResult.retrieveAgentsStep',
            { defaultMessage: 'Retrieve agents data' },
          ),
          status: getAgentsStatus,
          children:
            getAgentsStatus === 'loading' ? null : getAgentsStatus ===
              'complete' ? (
              <EuiAccordion
                id='agentsAccordion'
                arrowDisplay='none'
                paddingSize='m'
                buttonContent={i18n.translate(
                  'wazuh.endpointsSummary.bulkEditGroupsResult.agentsDetails',
                  {
                    defaultMessage: 'Agents details ({count})',
                    values: { count: finalAgents.length },
                  },
                )}
              >
                {agentsTable(finalAgents)}
              </EuiAccordion>
            ) : (
              <EuiCallOut
                color='danger'
                iconType='alert'
                title={i18n.translate(
                  'wazuh.endpointsSummary.bulkEditGroupsResult.getAgentsError',
                  { defaultMessage: 'Could not get agents data' },
                )}
              >
                <EuiText>{getAgentsError?.message}</EuiText>
              </EuiCallOut>
            ),
        },
        {
          step: 2,
          title:
            addOrRemove === 'add'
              ? i18n.translate(
                  'wazuh.endpointsSummary.bulkEditGroupsResult.addGroupsStep',
                  { defaultMessage: 'Add groups' },
                )
              : i18n.translate(
                  'wazuh.endpointsSummary.bulkEditGroupsResult.removeGroupsStep',
                  { defaultMessage: 'Remove groups' },
                ),
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
                            text: i18n.translate(
                              'wazuh.endpointsSummary.bulkEditGroupsResult.groupWithCount',
                              {
                                defaultMessage: '{group} ({count})',
                                values: { group, count: finalAgents.length },
                              },
                            ),
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
                            text: i18n.translate(
                              'wazuh.endpointsSummary.bulkEditGroupsResult.failedAgents',
                              {
                                defaultMessage:
                                  'Failed agents ({totalErrorAgents})',
                                values: { totalErrorAgents },
                              },
                            ),
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
                                text: i18n.translate(
                                  'wazuh.endpointsSummary.bulkEditGroupsResult.successAgents',
                                  {
                                    defaultMessage: 'Success agents ({count})',
                                    values: { count: successAgents?.length },
                                  },
                                ),
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
