import React from 'react';
import {
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
  EuiCard,
  EuiAccordion,
  EuiInMemoryTable,
} from '@elastic/eui';
import { Agent } from '../../types';

export enum RESULT_TYPE {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export type Result = {
  type: RESULT_TYPE;
  agent: Agent;
  group?: string;
  message?: string;
};

interface AgentsGlobalActionsResultModalProps {
  title: string;
  isLoading: boolean;
  results: Result[];
  onClose: () => void;
  loadingMessage?: string;
  successMessage?: string;
  warningMessage?: string;
  errorMessage?: string;
}

export const AgentsGlobalActionsResultModal = ({
  title,
  isLoading,
  results,
  loadingMessage = 'Appliyng changes...',
  successMessage = 'Changes successfully applied',
  warningMessage = 'There have been some warnings',
  errorMessage = 'There have been some errors',
  onClose,
}: AgentsGlobalActionsResultModalProps) => {
  const detailResultRenderer = (
    type: RESULT_TYPE,
    buttonContent: string,
    details: Result[],
  ) => (
    <EuiFlexItem>
      <EuiCard
        display={
          type === RESULT_TYPE.SUCCESS
            ? 'success'
            : type === RESULT_TYPE.WARNING
            ? 'warning'
            : 'danger'
        }
        paddingSize='s'
      >
        <EuiAccordion buttonContent={buttonContent} paddingSize='s'>
          <EuiInMemoryTable
            items={details}
            tableLayout='auto'
            columns={[
              {
                field: 'agent.id',
                name: 'ID',
                align: 'left',
                sortable: true,
                truncateText: true,
              },
              {
                field: 'agent.name',
                name: 'Name',
                align: 'left',
                sortable: true,
                truncateText: true,
              },
              {
                field: 'group',
                name: 'Group',
                align: 'left',
                sortable: true,
                truncateText: true,
              },
              {
                field: 'message',
                name: 'Message',
                align: 'left',
              },
            ].filter(
              column =>
                !(column.field === 'message' && type === RESULT_TYPE.SUCCESS),
            )}
            pagination={true}
            sorting={{
              sort: {
                field: 'agent.id',
                direction: 'asc',
              },
            }}
          />
        </EuiAccordion>
      </EuiCard>
    </EuiFlexItem>
  );

  const errorResults = results.filter(
    result => result.type === RESULT_TYPE.ERROR,
  );
  const warningResults = results.filter(
    result => result.type === RESULT_TYPE.WARNING,
  );
  const successResults = results.filter(
    result => result.type === RESULT_TYPE.SUCCESS,
  );

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiFlexGroup direction='column' gutterSize='s'>
          <EuiFlexItem>
            {isLoading ? (
              <EuiEmptyPrompt
                icon={<EuiLoadingSpinner size='xl' />}
                title={<h2>{loadingMessage}</h2>}
              />
            ) : errorResults.length ? (
              <EuiEmptyPrompt
                iconType='alert'
                iconColor='danger'
                title={<h2>{errorMessage}</h2>}
              />
            ) : warningResults.length ? (
              <EuiEmptyPrompt
                iconType='alert'
                iconColor='warning'
                title={<h2>{warningMessage}</h2>}
              />
            ) : (
              <EuiEmptyPrompt
                iconType='check'
                iconColor='success'
                title={<h2>{successMessage}</h2>}
              />
            )}
          </EuiFlexItem>
          {successResults.length
            ? detailResultRenderer(
                RESULT_TYPE.SUCCESS,
                `Success (${successResults.length})`,
                successResults,
              )
            : null}
          {warningResults.length
            ? detailResultRenderer(
                RESULT_TYPE.WARNING,
                `Warning (${warningResults.length})`,
                warningResults,
              )
            : null}
          {errorResults?.length
            ? detailResultRenderer(
                RESULT_TYPE.ERROR,
                `Error (${errorResults.length})`,
                errorResults,
              )
            : null}
        </EuiFlexGroup>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButton onClick={onClose} fill disabled={isLoading}>
          Close
        </EuiButton>
      </EuiModalFooter>
    </>
  );
};
