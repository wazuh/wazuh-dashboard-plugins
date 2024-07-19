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
import { getAgentsService, upgradeAgentsService } from '../../../services';
import { Agent, ResponseUpgradeAgents } from '../../../types';
import { UpgradeAgentsModalResult } from './result';
import { ErrorAgent } from '../../../services/paginated-agents-request';

export type Result = {
  successAgents?: ResponseUpgradeAgents[];
  errorMessage?: string;
  totalErrorAgents?: number;
  errorAgents?: ErrorAgent[];
};

interface UpgradeAgentsModalProps {
  selectedAgents: Agent[];
  allAgentsSelected: boolean;
  filters: any;
  onClose: () => void;
  reloadAgents: () => void;
  setIsUpgradePanelClosed: (isUpgradePanelClosed: boolean) => void;
}

export const UpgradeAgentsModal = compose(withErrorBoundary)(
  ({
    selectedAgents,
    allAgentsSelected,
    filters,
    onClose,
    reloadAgents,
    setIsUpgradePanelClosed,
  }: UpgradeAgentsModalProps) => {
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
          context: `UpgradeAgentsModal.handleOnSave`,
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

    const getArrayByProperty = (
      array: Agent[],
      propertyName: string,
    ): string[] => {
      return array.map(element => element[propertyName]);
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

      const agentIds = getArrayByProperty(agents, 'id');

      try {
        const response = await upgradeAgentsService({ agentIds });

        const { data, message } = response.data;
        const {
          affected_items,
          failed_items,
          total_affected_items,
          total_failed_items,
        } = data;
        setResult({
          successAgents: affected_items,
          errorAgents: failed_items,
          errorMessage: message,
          totalErrorAgents: total_failed_items,
        });

        if (total_affected_items) {
          setIsUpgradePanelClosed(false);
        }

        setSaveChangesStatus('complete');
      } catch (error) {
        setResult({
          errorMessage: error.message,
          errorAgents: [
            {
              error: { message: error.message },
              id: agentIds,
            },
          ],
        });
        setSaveChangesStatus('danger');
        const options = {
          context: `UpgradeAgentsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: `Could not upgrade agents`,
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
              title='The changes will be applied to all agents that match the filters set in the list'
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
          <EuiModalHeaderTitle>Upgrade agents</EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          {!isResultVisible ? (
            form
          ) : (
            <UpgradeAgentsModalResult
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
                Upgrade
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
