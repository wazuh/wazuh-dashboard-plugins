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
import { Agent } from '../../../../../../common/types';
import { ResponseUpgradeAgents } from '../../../../../application/types';
import { Result } from './upgrade-modal';

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
          name: 'ID',
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
  const tasksTable = (tasks: ResponseUpgradeAgents[]) => (
    <EuiInMemoryTable
      items={tasks}
      tableLayout='auto'
      columns={[
        {
          field: '_id',
          name: 'Agent ID',
          align: 'left',
          sortable: true,
          render: ({ agentIds }: { agentIds: string[] }) => agentIds.join(', '),
        },
        {
          field: 'agent.name',
          name: 'Name',
          align: 'left',
          sortable: true,
        },
        {
          field: 'task_id',
          name: 'Task ID',
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
  const errorsTable = (errors: [] = []) => (
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
          field: '_id',
          name: 'Agent IDs',
          align: 'left',
          width: '200px',
          render: ({ agentIds }: { agentIds: string[] }) => agentIds.join(', '),
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

  const AgentsDataStep = () => {
    if (getAgentsStatus === 'loading') {
      return null;
    }

    if (getAgentsStatus === 'complete') {
      return (
        <EuiAccordion
          id='agentsAccordion'
          arrowDisplay='none'
          paddingSize='m'
          buttonContent={`Agents details (${finalAgents.length})`}
        >
          {agentsTable(finalAgents)}
        </EuiAccordion>
      );
    }

    return (
      <EuiCallOut
        color='danger'
        iconType='alert'
        title='Could not get agents data'
      >
        <EuiText>{getAgentsError?.message}</EuiText>
      </EuiCallOut>
    );
  };

  const UpgradeTasksLoading = () => (
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
          <EuiText>Creating upgrade agent tasks</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlexItem>
  );
  const UpgradeTasksComplete = () => (
    <>
      {successAgents?.length ? (
        <EuiFlexItem key='upgrade-tasks-success'>
          <EuiAccordion
            id='successAccordion'
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
            id='errorAccordion'
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
  );

  const UpgradeTasksStep = () => {
    if (getAgentsStatus !== 'complete') {
      return null;
    }

    return (
      <EuiFlexGroup direction='column'>
        {saveChangesStatus === 'loading' ? (
          <UpgradeTasksLoading />
        ) : (
          <UpgradeTasksComplete />
        )}
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
          children: <AgentsDataStep />,
        },
        {
          step: 2,
          title: 'Upgrade agent tasks',
          status: saveChangesStatus,
          children: <UpgradeTasksStep />,
        },
      ]}
    />
  );
};
