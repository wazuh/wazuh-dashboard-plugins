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
import { compose } from 'redux';
import { withErrorBoundary } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { Agent } from '../../types';
import { getToasts } from '../../../../kibana-services';
import { removeAgentService } from '../../services/remove-agent';
import { useAsyncAction } from '../../../common/hooks';
import { endpointsSummaryI18n } from '../../i18n';

interface RemoveAgentModalProps {
  agent: Agent;
  onClose: () => void;
  reloadAgents: () => void;
}

export const RemoveAgentModal = compose(withErrorBoundary)(
  ({ agent, onClose, reloadAgents }: RemoveAgentModalProps) => {
    const getDeleteErrorMessage = (error: any) => {
      const apiMessage = error?.response?.data?.message;
      const message = apiMessage || error?.message || endpointsSummaryI18n.unknownError;

      if (/permission denied/i.test(message)) {
        return endpointsSummaryI18n.noPermissionRemoveAgent(message);
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
            title: endpointsSummaryI18n.removeAgentSuccess,
            text: endpointsSummaryI18n.removedAgent(agent.name, agent.id),
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
            title: endpointsSummaryI18n.couldNotRemoveAgent,
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
            {endpointsSummaryI18n.removeAgentTitle}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFlexGroup direction='column' gutterSize='m'>
            <EuiFlexItem>
              <EuiFlexGroup gutterSize='m'>
                <EuiFlexItem>
                  <EuiDescriptionList compressed>
                    <EuiDescriptionListTitle>
                      {endpointsSummaryI18n.agentId}
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {agent.id}
                    </EuiDescriptionListDescription>
                  </EuiDescriptionList>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiDescriptionList compressed>
                    <EuiDescriptionListTitle>
                      {endpointsSummaryI18n.agentName}
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
            {endpointsSummaryI18n.removeAgentWarning}
          </EuiCallOut>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>
            {endpointsSummaryI18n.cancel}
          </EuiButtonEmpty>
          <EuiButton
            onClick={() => action.run(agent)}
            fill
            isLoading={action.running}
            color='danger'
          >
            {endpointsSummaryI18n.remove}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
