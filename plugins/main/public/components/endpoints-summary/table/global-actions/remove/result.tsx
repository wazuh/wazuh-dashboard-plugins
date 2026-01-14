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
import { Agent, AgentInfoMinimal } from '../../../types';
import { Result } from './remove-modal';
import { ErrorAgent } from '../../../services/paginated-agents-request';

export enum RESULT_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
}

interface RemoveAgentsModalResultProps {
  finalAgents: Agent[];
  getAgentsStatus: string;
  getAgentsError?: Error;
  saveChangesStatus: string;
  result?: Result;
}

export const RemoveAgentsModalResult = ({
  finalAgents,
  getAgentsStatus,
  getAgentsError,
  saveChangesStatus,
  result = {},
}: RemoveAgentsModalResultProps) => {
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

  const removedAgentsTable = (data: AgentInfoMinimal[]) => (
    <EuiInMemoryTable
      items={data}
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
          title: 'Apply agents removal',
          status: saveChangesStatus,
          children:
            getAgentsStatus === 'complete' ? (
              <EuiFlexGroup direction='column'>
                {saveChangesStatus === 'loading' ? (
                  <EuiFlexItem>
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
                        <EuiText>Removing agents</EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                ) : (
                  <>
                    {successAgents?.length ? (
                      <EuiFlexItem>
                        <EuiAccordion
                          id={`$successAccordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={resultStatus({
                            status: RESULT_TYPE.SUCCESS,
                            text: `Removed agents (${successAgents.length})`,
                          })}
                        >
                          {removedAgentsTable(successAgents)}
                        </EuiAccordion>
                      </EuiFlexItem>
                    ) : null}
                    {successAgents?.length && errorAgents?.length ? (
                      <EuiSpacer size='s' />
                    ) : null}
                    {totalErrorAgents ? (
                      <EuiFlexItem>
                        <EuiAccordion
                          id={`$errorAccordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={resultStatus({
                            status: RESULT_TYPE.ERROR,
                            text: `Errors (${totalErrorAgents})`,
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
