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
import { Agent, ResponseUpgradeAgents } from '../../../types';
import { Result } from './upgrade-modal';
import { ErrorAgent } from '../../../services/paginated-agents-request';

export enum RESULT_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
}

interface UpgradeAgentsModalResultProps {
  finalAgents: Agent[];
  getAgentsStatus: string;
  getAgentsError?: Error;
  saveChangesStatus: string;
  result?: Result;
}

export const UpgradeAgentsModalResult = ({
  finalAgents,
  getAgentsStatus,
  getAgentsError,
  saveChangesStatus,
  result = {},
}: UpgradeAgentsModalResultProps) => {
  const { successAgents, errorAgents, totalErrorAgents } = result;

  const agentsTable = (agents: Agent[]) => (
    <EuiInMemoryTable
      items={agents}
      tableLayout='auto'
      columns={[
        {
          field: 'id',
          name: i18n.translate('wazuh.endpointsSummary.table.id', {
            defaultMessage: 'ID'
          }),
          align: 'left',
          sortable: true,
        },
        {
          field: 'name',
          name: i18n.translate('wazuh.endpointsSummary.table.name', {
            defaultMessage: 'Name'
          }),
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

  const tasksTable = (tasks: ResponseUpgradeAgents[]) => (
    <EuiInMemoryTable
      items={tasks}
      tableLayout='auto'
      columns={[
        {
          field: 'agent',
          name: i18n.translate('wazuh.endpointsSummary.table.agentId', {
            defaultMessage: 'Agent ID'
          }),
          align: 'left',
          sortable: true,
        },
        {
          field: 'name',
          name: i18n.translate('wazuh.endpointsSummary.table.name', {
            defaultMessage: 'Name'
          }),
          align: 'left',
          sortable: true,
          render: (field, task) => {
            const agent = finalAgents.find(
              finalAgent => finalAgent.id === task.agent,
            ) as Agent;
            return agent.name;
          },
        },
        {
          field: 'task_id',
          name: i18n.translate('wazuh.endpointsSummary.table.taskId', {
            defaultMessage: 'Task ID'
          }),
          align: 'left',
          sortable: true,
        },
      ]}
      pagination={true}
      sorting={{
        sort: {
          field: 'agent',
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
          name: i18n.translate('wazuh.endpointsSummary.table.code', {
            defaultMessage: 'Code'
          }),
          align: 'left',
          sortable: true,
          width: '100px',
        },
        {
          field: 'error.message',
          name: i18n.translate('wazuh.endpointsSummary.table.error', {
            defaultMessage: 'Error'
          }),
          align: 'left',
          sortable: true,
        },
        {
          field: 'error.remediation',
          name: i18n.translate('wazuh.endpointsSummary.table.remediation', {
            defaultMessage: 'Remediation'
          }),
          align: 'left',
          sortable: true,
        },
        {
          field: 'id',
          name: i18n.translate('wazuh.endpointsSummary.table.agentIds', {
            defaultMessage: 'Agent IDs'
          }),
          align: 'left',
          render: ids => ids.join(', '),
        },
      ]}
      pagination={true}
    />
  );

  const resultStatus = (options: { status: RESULT_TYPE; text: string }) => {
    const { status, text } = options;

    return (
      <EuiFlexGroup
        alignItems='center'
        responsive={false}
        wrap={false}
        gutterSize='s'
      >
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={status === RESULT_TYPE.SUCCESS ? 'check' : 'alert'}
            color={status === RESULT_TYPE.SUCCESS ? 'success' : 'danger'}
          />
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
          title: i18n.translate('wazuh.endpointsSummary.upgrade.retrieveAgentsData', {
            defaultMessage: 'Retrieve agents data'
          }),
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
                title={i18n.translate('wazuh.endpointsSummary.upgrade.couldNotGetAgentsData', {
                  defaultMessage: 'Could not get agents data'
                })}
              >
                <EuiText>{getAgentsError?.message}</EuiText>
              </EuiCallOut>
            ),
        },
        {
          step: 2,
          title: i18n.translate('wazuh.endpointsSummary.upgrade.upgradeAgentTasks', {
            defaultMessage: 'Upgrade agent tasks'
          }),
          status: saveChangesStatus,
          children:
            getAgentsStatus === 'complete' ? (
              <EuiFlexGroup direction='column'>
                {saveChangesStatus === 'loading' ? (
                  <EuiFlexItem key='upgrade-tasks-loading'>
                    <EuiFlexGroup
                      alignItems='center'
                      responsive={false}
                      wrap={false}
                      gutterSize='s'
                    >
                      <EuiFlexItem grow={false}>
                        <EuiLoadingSpinner size='m' />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText>{i18n.translate('wazuh.endpointsSummary.upgrade.creatingUpgradeTasks', {
                          defaultMessage: 'Creating upgrade agent tasks'
                        })}</EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                ) : (
                  <>
                    {successAgents?.length ? (
                      <EuiFlexItem key='upgrade-tasks-success'>
                        <EuiAccordion
                          id={`$successAccordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={resultStatus({
                            status: RESULT_TYPE.SUCCESS,
                            text: `Upgrade agent tasks created (${successAgents.length})`,
                          })}
                        >
                          {tasksTable(successAgents)}
                        </EuiAccordion>
                      </EuiFlexItem>
                    ) : null}
                    {successAgents?.length && errorAgents?.length ? (
                      <EuiSpacer size='s' />
                    ) : null}
                    {totalErrorAgents ? (
                      <EuiFlexItem key='upgrade-tasks-error'>
                        <EuiAccordion
                          id={`$errorAccordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={resultStatus({
                            status: RESULT_TYPE.ERROR,
                            text: `Upgrade agent tasks not created (${totalErrorAgents})`,
                          })}
                        >
                          {errorsTable(errorAgents)}
                        </EuiAccordion>
                      </EuiFlexItem>
                    ) : null}
                  </>
                )}
              </EuiFlexGroup>
            ) : null,
        },
      ]}
    />
  );
};
