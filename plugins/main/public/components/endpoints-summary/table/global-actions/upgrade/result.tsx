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
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.agentsTable.columns.id',
            { defaultMessage: 'ID' },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'name',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.agentsTable.columns.name',
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

  const upgradedAgentsTable = (agentIds: ResponseUpgradeAgents[]) => (
    <EuiInMemoryTable
      items={agentIds.map(id => ({
        id,
        name: finalAgents.find(agent => agent.id === id)?.name,
      }))}
      tableLayout='auto'
      columns={[
        {
          field: 'id',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.upgradedAgentsTable.columns.agentId',
            { defaultMessage: 'Agent ID' },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'name',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.upgradedAgentsTable.columns.name',
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
            'wazuh.endpointsSummary.bulkUpgradeResult.errorsTable.columns.code',
            { defaultMessage: 'Code' },
          ),
          align: 'left',
          sortable: true,
          width: '100px',
        },
        {
          field: 'error.message',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.errorsTable.columns.error',
            { defaultMessage: 'Error' },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'error.remediation',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.errorsTable.columns.remediation',
            { defaultMessage: 'Remediation' },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'id',
          name: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.errorsTable.columns.agentIds',
            { defaultMessage: 'Agent IDs' },
          ),
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
          title: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.retrieveAgentsStep',
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
                  'wazuh.endpointsSummary.bulkUpgradeResult.agentsDetails',
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
                  'wazuh.endpointsSummary.bulkUpgradeResult.getAgentsError',
                  { defaultMessage: 'Could not get agents data' },
                )}
              >
                <EuiText>{getAgentsError?.message}</EuiText>
              </EuiCallOut>
            ),
        },
        {
          step: 2,
          title: i18n.translate(
            'wazuh.endpointsSummary.bulkUpgradeResult.upgradeStatusStep',
            { defaultMessage: 'Upgrade status' },
          ),
          status: saveChangesStatus,
          children:
            getAgentsStatus === 'complete' ? (
              <EuiFlexGroup direction='column'>
                {saveChangesStatus === 'loading' ? (
                  <EuiFlexItem key='upgrade-agents-loading'>
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
                        <EuiText>
                          {i18n.translate(
                            'wazuh.endpointsSummary.bulkUpgradeResult.sendingRequest',
                            { defaultMessage: 'Sending upgrade request' },
                          )}
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                ) : (
                  <>
                    {successAgents?.length ? (
                      <EuiFlexItem key='upgrade-agents-success'>
                        <EuiAccordion
                          id={`$successAccordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={resultStatus({
                            status: RESULT_TYPE.SUCCESS,
                            text: i18n.translate(
                              'wazuh.endpointsSummary.bulkUpgradeResult.queuedAgents',
                              {
                                defaultMessage:
                                  'Agents queued for upgrade ({count})',
                                values: { count: successAgents.length },
                              },
                            ),
                          })}
                        >
                          {upgradedAgentsTable(successAgents)}
                        </EuiAccordion>
                      </EuiFlexItem>
                    ) : null}
                    {successAgents?.length && errorAgents?.length ? (
                      <EuiSpacer size='s' />
                    ) : null}
                    {totalErrorAgents ? (
                      <EuiFlexItem key='upgrade-agents-error'>
                        <EuiAccordion
                          id={`$errorAccordion`}
                          arrowDisplay='none'
                          paddingSize='m'
                          buttonContent={resultStatus({
                            status: RESULT_TYPE.ERROR,
                            text: i18n.translate(
                              'wazuh.endpointsSummary.bulkUpgradeResult.notQueuedAgents',
                              {
                                defaultMessage:
                                  'Agents not queued for upgrade ({totalErrorAgents})',
                                values: { totalErrorAgents },
                              },
                            ),
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
