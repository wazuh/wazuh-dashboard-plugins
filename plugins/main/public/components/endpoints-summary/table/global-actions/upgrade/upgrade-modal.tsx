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
import { i18n } from '@osd/i18n';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { getAgentsService, upgradeAgentsService } from '../../../services';
import { Agent, ResponseUpgradeAgents } from '../../../types';
import { UpgradeAgentsModalResult } from './result';
import { ErrorAgent } from '../../../services/paginated-agents-request';
import { upgradeStatusState } from '../../../services/upgrade-status-state';

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
}

export const UpgradeAgentsModal = compose(withErrorBoundary)(
  ({
    selectedAgents,
    allAgentsSelected,
    filters,
    onClose,
    reloadAgents,
  }: UpgradeAgentsModalProps) => {
    const getUpgradeErrorMessage = (error: any) => {
      const apiMessage = error?.response?.data?.message;
      const message =
        apiMessage ||
        error?.message ||
        i18n.translate('wazuh.endpointsSummary.bulkUpgradeModal.unknownError', {
          defaultMessage: 'Unknown error',
        });

      if (/permission denied/i.test(message)) {
        return i18n.translate(
          'wazuh.endpointsSummary.bulkUpgradeModal.noPermissionsError',
          {
            defaultMessage:
              'No permissions to upgrade one or more selected agents. {message}',
            values: { message },
          },
        );
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
          context: `UpgradeAgentsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: i18n.translate(
              'wazuh.endpointsSummary.bulkUpgradeModal.getAgentsErrorTitle',
              { defaultMessage: 'Could not get agents data' },
            ),
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
        const { affected_items, failed_items, total_failed_items } = data;
        setResult({
          successAgents: affected_items,
          errorAgents: failed_items,
          errorMessage: message,
          totalErrorAgents: total_failed_items,
        });

        const acceptedIds = new Set(affected_items);
        const upgradedAgents = agents
          .filter(agent => acceptedIds.has(agent.id) && agent.version)
          .map(agent => ({ id: agent.id, version: agent.version }));
        upgradeStatusState.trackUpgrade(upgradedAgents);

        setSaveChangesStatus('complete');
      } catch (error: any) {
        const errorMessage = getUpgradeErrorMessage(error);
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
          context: `UpgradeAgentsModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: errorMessage,
            title: i18n.translate(
              'wazuh.endpointsSummary.bulkUpgradeModal.upgradeErrorTitle',
              { defaultMessage: 'Could not upgrade agents' },
            ),
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
              title={i18n.translate(
                'wazuh.endpointsSummary.bulkUpgradeModal.allAgentsWarning',
                {
                  defaultMessage:
                    'The changes will be applied to all agents that match the filters set in the list',
                },
              )}
            />
          </EuiFormRow>
        ) : (
          <EuiFormRow
            label={i18n.translate(
              'wazuh.endpointsSummary.bulkUpgradeModal.selectedAgentsLabel',
              { defaultMessage: 'Selected agents' },
            )}
          >
            <EuiText>{selectedAgents.length}</EuiText>
          </EuiFormRow>
        )}
      </EuiForm>
    );

    return (
      <EuiModal onClose={onClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            {i18n.translate('wazuh.endpointsSummary.bulkUpgradeModal.title', {
              defaultMessage: 'Upgrade agents',
            })}
          </EuiModalHeaderTitle>
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
              <EuiButtonEmpty onClick={onClose}>
                {i18n.translate(
                  'wazuh.endpointsSummary.bulkUpgradeModal.cancelButton',
                  { defaultMessage: 'Cancel' },
                )}
              </EuiButtonEmpty>
              <EuiButton onClick={handleOnSave} fill>
                {i18n.translate(
                  'wazuh.endpointsSummary.bulkUpgradeModal.upgradeButton',
                  { defaultMessage: 'Upgrade' },
                )}
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
              {i18n.translate(
                'wazuh.endpointsSummary.bulkUpgradeModal.closeButton',
                { defaultMessage: 'Close' },
              )}
            </EuiButton>
          )}
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
