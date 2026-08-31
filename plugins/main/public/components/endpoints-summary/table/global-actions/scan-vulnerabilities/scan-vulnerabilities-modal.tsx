import React, { useState } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiButton,
  EuiForm,
  EuiFormRow,
  EuiText,
  EuiCallOut,
} from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import {
  getAgentsService,
  scanAgentsVulnerabilitiesService,
} from '../../../services';
import { Agent, ResponseScanAgentsVulnerabilities } from '../../../types';
import { ScanVulnerabilitiesAgentsModalResult } from './result';
import { ErrorAgent } from '../../../services/paginated-agents-request';

export type Result = {
  successAgents?: ResponseScanAgentsVulnerabilities[];
  errorMessage?: string;
  totalErrorAgents?: number;
  errorAgents?: ErrorAgent[];
};

interface ScanVulnerabilitiesAgentsModalProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  filters: any;
  onClose: () => void;
  reloadAgents: () => void;
}

export const ScanVulnerabilitiesAgentsModal = compose(withErrorBoundary)(
  ({
    selectedAgents,
    allAgentsSelected,
    filters,
    onClose,
    reloadAgents,
  }: ScanVulnerabilitiesAgentsModalProps) => {
    const getScanErrorMessage = (error: any) => {
      const apiMessage = error?.response?.data?.message;
      const message = apiMessage || error?.message || 'Unknown error';

      if (/permission denied/i.test(message)) {
        return `No permissions to scan the vulnerabilities of one or more selected agents. ${message}`;
      }

      return message;
    };

    const [finalAgents, setFinalAgents] = useState<Agent[]>([]);
    const [getAgentsStatus, setGetAgentsStatus] = useState('disabled');
    const [getAgentsError, setGetAgentsError] = useState();
    const [saveChangesStatus, setSaveChangesStatus] = useState('disabled');
    const [isResultVisible, setIsResultVisible] = useState(false);
    const [result, setResult] = useState<Result>();

    const getAgents = async () => {
      if (!allAgentsSelected) {
        setGetAgentsStatus('complete');
        return selectedAgents;
      }
      try {
        const { affected_items } = await getAgentsService({ filters });
        setGetAgentsStatus('complete');
        return affected_items;
      } catch (error) {
        setGetAgentsStatus('danger');
        setGetAgentsError(error);

        const options = {
          context: `ScanVulnerabilitiesAgentsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: `Could not get agents data`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    const handleOnSave = async () => {
      setGetAgentsStatus('loading');
      setIsResultVisible(true);

      const agents = await getAgents();

      if (!agents?.length) {
        return;
      }

      setFinalAgents(agents);

      setSaveChangesStatus('loading');

      const agentIds = agents.map(agent => agent.id);

      try {
        const response = await scanAgentsVulnerabilitiesService({ agentIds });

        const { data, message } = response.data;
        const { affected_items, failed_items, total_failed_items } = data;
        setResult({
          successAgents: affected_items,
          errorAgents: failed_items,
          errorMessage: message,
          totalErrorAgents: total_failed_items,
        });

        setSaveChangesStatus('complete');
      } catch (error: any) {
        const errorMessage = getScanErrorMessage(error);
        setResult({
          errorMessage,
          errorAgents: [
            {
              error: { message: errorMessage },
              id: agentIds,
            },
          ],
          totalErrorAgents: 1,
        });
        setSaveChangesStatus('danger');
        const options = {
          context: `ScanVulnerabilitiesAgentsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: errorMessage,
            title: `Could not request the vulnerabilities scan of the agents`,
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        reloadAgents();
      }
    };

    const form = (
      <EuiForm component='form'>
        {allAgentsSelected ? (
          <EuiFormRow>
            <EuiCallOut
              color='warning'
              iconType='alert'
              title='The scan will be requested for all agents that match the filters set in the list'
            />
          </EuiFormRow>
        ) : (
          <EuiFormRow label='Selected agents'>
            <EuiText>{selectedAgents.length}</EuiText>
          </EuiFormRow>
        )}
      </EuiForm>
    );

    return (
      <EuiModal onClose={onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            Scan vulnerabilities of agents
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          {!isResultVisible ? (
            form
          ) : (
            <ScanVulnerabilitiesAgentsModalResult
              finalAgents={finalAgents}
              getAgentsStatus={getAgentsStatus}
              getAgentsError={getAgentsError}
              saveChangesStatus={saveChangesStatus}
              result={result}
            />
          )}
        </EuiModalBody>
        <EuiModalFooter>
          {!isResultVisible ? (
            <>
              <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
              <EuiButton onClick={handleOnSave} fill>
                Scan
              </EuiButton>
            </>
          ) : (
            <EuiButton
              onClick={onClose}
              fill
              disabled={
                getAgentsStatus === 'loading' || saveChangesStatus === 'loading'
              }
            >
              Close
            </EuiButton>
          )}
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
