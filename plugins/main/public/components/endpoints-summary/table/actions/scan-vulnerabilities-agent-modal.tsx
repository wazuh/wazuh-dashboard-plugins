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
import { scanAgentsVulnerabilitiesService } from '../../services';
import { useAsyncAction } from '../../../common/hooks';

interface ScanVulnerabilitiesAgentModalProps {
  agent: Agent;
  onClose: () => void;
  reloadAgents: () => void;
}

export const ScanVulnerabilitiesAgentModal = compose(withErrorBoundary)(
  ({ agent, onClose, reloadAgents }: ScanVulnerabilitiesAgentModalProps) => {
    const getScanErrorMessage = (error: any) => {
      const apiMessage = error?.response?.data?.message;
      const message = apiMessage || error?.message || 'Unknown error';

      if (/permission denied/i.test(message)) {
        return `No permissions to scan the vulnerabilities of this agent. ${message}`;
      }

      return message;
    };

    const action = useAsyncAction(async agent => {
      try {
        const response = await scanAgentsVulnerabilitiesService({
          agentIds: [agent.id],
        });
        const { affected_items: affectedItems, failed_items: failedItems } =
          response?.data?.data ?? {};

        // The scan request can be rejected by the vulnerability detection module
        if (affectedItems?.includes(agent.id)) {
          getToasts().add({
            color: 'success',
            title: 'Scan vulnerabilities',
            text: `Scan requested for agent: ${agent.name} (${agent.id})`,
            toastLifeTimeMs: 3000,
          });
        } else {
          const failedItem = failedItems?.[0];
          const errorMessage =
            failedItem?.error?.message ||
            response?.data?.message ||
            'The scan was not queued';

          throw new Error(errorMessage);
        }
        reloadAgents();
      } catch (error: any) {
        const errorMessage = getScanErrorMessage(error);

        const options = {
          context: `ScanVulnerabilitiesAgentModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: errorMessage,
            title: `Could not request the vulnerabilities scan`,
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
          <EuiModalHeaderTitle>Scan vulnerabilities</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFlexGroup direction='column' gutterSize='m'>
            <EuiFlexItem>
              <EuiFlexGroup gutterSize='m'>
                <EuiFlexItem>
                  <EuiDescriptionList compressed>
                    <EuiDescriptionListTitle>Agent ID</EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      {agent.id}
                    </EuiDescriptionListDescription>
                  </EuiDescriptionList>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiDescriptionList compressed>
                    <EuiDescriptionListTitle>
                      Agent name
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
          <EuiCallOut
            iconType='iInCircle'
            title='An on-demand vulnerability scan will be requested for this agent'
          >
            The scan uses the inventory already synchronized to the indexer, so
            it does not require the agent to be active. The request can be
            rejected if the vulnerability detection module is not ready or its
            queue is full.
          </EuiCallOut>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
          <EuiButton
            onClick={() => action.run(agent)}
            fill
            isLoading={action.running}
          >
            Scan
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  },
);
