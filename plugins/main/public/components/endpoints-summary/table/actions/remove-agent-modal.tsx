import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiButton,
  EuiModalBody,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiCallOut,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { Agent } from '../../types';
import { getToasts } from '../../../../kibana-services';
import { removeAgentService } from '../../services/remove-agent';
import { useAsyncAction } from '../../../common/hooks';

interface RemoveAgentModalProps {
  agent: Agent;
  onClose: () => void;
  reloadAgents: () => void;
}

export const RemoveAgentModal = compose(withErrorBoundary)(
  ({ agent, onClose, reloadAgents }: RemoveAgentModalProps) => {
    const getDeleteErrorMessage = (error: any) => {
      const apiMessage = error?.response?.data?.message;
      const message =
        apiMessage ||
        error?.message ||
        i18n.translate('wazuh.endpointsSummary.removeAgentModal.unknownError', {
          defaultMessage: 'Unknown error',
        });

      if (/permission denied/i.test(message)) {
        return i18n.translate(
          'wazuh.endpointsSummary.removeAgentModal.noPermissionsError',
          {
            defaultMessage: 'No permissions to remove this agent. {message}',
            values: { message },
          },
        );
      }

      return message;
    };

    const action = useAsyncAction(async agent => {
      try {
        const response = await removeAgentService(agent.id);
        // Ensure the agent was actually removed
        if (response?.data?.data?.affected_items.includes(agent.id)) {
          getToasts().add({
            color: 'success',
            title: i18n.translate(
              'wazuh.endpointsSummary.removeAgentModal.successToastTitle',
              { defaultMessage: 'Remove agent' },
            ),
            text: i18n.translate(
              'wazuh.endpointsSummary.removeAgentModal.successToastText',
              {
                defaultMessage: 'Removed agent: {agentName} ({agentId})',
                values: { agentName: agent.name, agentId: agent.id },
              },
            ),
            toastLifeTimeMs: 3000,
          });
        }
        reloadAgents();
      } catch (error: any) {
        const errorMessage = getDeleteErrorMessage(error);

        const options = {
          context: `RemoveAgentModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: errorMessage,
            title: i18n.translate(
              'wazuh.endpointsSummary.removeAgentModal.errorTitle',
              { defaultMessage: 'Could not remove agent' },
            ),
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        onClose();
      }
    }, []);

    return (
      <EuiModal
        onClose={onClose}
        onClick={ev => {
          ev.stopPropagation();
        }}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            {i18n.translate('wazuh.endpointsSummary.removeAgentModal.title', {
              defaultMessage: 'Remove agent',
            })}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFlexGroup direction='column' gutterSize='m'>
            <EuiFlexItem>
              <EuiFlexGroup gutterSize='m'>
                <EuiFlexItem>
                  <EuiDescriptionList compressed>
                    <EuiDescriptionListTitle>
                      {i18n.translate(
                        'wazuh.endpointsSummary.removeAgentModal.agentIdLabel',
                        { defaultMessage: 'Agent ID' },
                      )}
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {agent.id}
                    </EuiDescriptionListDescription>
                  </EuiDescriptionList>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiDescriptionList compressed>
                    <EuiDescriptionListTitle>
                      {i18n.translate(
                        'wazuh.endpointsSummary.removeAgentModal.agentNameLabel',
                        { defaultMessage: 'Agent name' },
                      )}
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {agent.name}
                    </EuiDescriptionListDescription>
                  </EuiDescriptionList>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer />
          <EuiCallOut color='warning'>
            {i18n.translate(
              'wazuh.endpointsSummary.removeAgentModal.autoEnrollmentWarning',
              {
                defaultMessage:
                  'If the selected agent is still active and auto-enrollment is enabled, they will automatically register again after deletion.',
              },
            )}
          </EuiCallOut>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>
            {i18n.translate(
              'wazuh.endpointsSummary.removeAgentModal.cancelButton',
              { defaultMessage: 'Cancel' },
            )}
          </EuiButtonEmpty>
          <EuiButton
            onClick={() => action.run(agent)}
            fill
            isLoading={action.running}
            color='danger'
          >
            {i18n.translate(
              'wazuh.endpointsSummary.removeAgentModal.removeButton',
              { defaultMessage: 'Remove' },
            )}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
