import React, { useState } from 'react';
import { EuiConfirmModal } from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../../../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { upgradeAgentService } from '../../services';
import { Agent } from '../../types';
import { getToasts } from '../../../../kibana-services';

interface UpgradeAgentModalProps {
  agent: Agent;
  onClose: () => void;
  reloadAgents: () => void;
  setIsUpgradePanelClosed: (isUpgradePanelClosed: boolean) => void;
}

export const UpgradeAgentModal = compose(
  withErrorBoundary,
  withReduxProvider,
)(
  ({
    agent,
    onClose,
    reloadAgents,
    setIsUpgradePanelClosed,
  }: UpgradeAgentModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const showToast = (
      color: string,
      title: string = '',
      text: string = '',
      time: number = 3000,
    ) => {
      getToasts().add({
        color: color,
        title: title,
        text: text,
        toastLifeTimeMs: time,
      });
    };

    const handleOnSave = async () => {
      setIsLoading(true);

      try {
        await upgradeAgentService(agent.id);
        showToast('success', 'Upgrade agent', 'Upgrade task in progress');
        reloadAgents();
        setIsUpgradePanelClosed(false);
      } catch (error) {
        const options = {
          context: `UpgradeAgentModal.handleOnSave`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: `Could not upgrade agent`,
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        onClose();
      }
    };

    return (
      <EuiConfirmModal
        title='Upgrade agent'
        onCancel={onClose}
        onConfirm={handleOnSave}
        cancelButtonText='Cancel'
        confirmButtonText='Upgrade'
        onClose={onClose}
        onClick={ev => {
          ev.stopPropagation();
        }}
        isLoading={isLoading}
      >
        <p>{`Upgrade agent ${agent?.name}?`}</p>
      </EuiConfirmModal>
    );
  },
);
