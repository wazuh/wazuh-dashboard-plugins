import React, { useEffect, useRef } from 'react';
import { DeploymentStatus } from './deployment-status';
import { useAssistantInstallation } from '../common/installation-manager/hooks/use-assistant-installation';
import { StepExecutionState, StepResultState } from '../common/installation-manager/domain/types';

interface DeploymentStatusContainerProps {
  onCheckButton?: () => void;
  showCheckButton?: boolean;
  onShowToast?: (toast: {
    id: string;
    title: string;
    color: 'success' | 'danger';
    text: string;
    iconType: string;
  }) => void;
}

export const DeploymentStatusContainer = ({
  onCheckButton,
  showCheckButton,
  onShowToast,
}: DeploymentStatusContainerProps) => {
  const { progress, result, isLoading } = useAssistantInstallation();
  const previousResultRef = useRef(result);

  useEffect(() => {
    // Only show toast when installation completes (not loading and has result)
    if (!isLoading && result && result !== previousResultRef.current) {
      if (result.success) {
        onShowToast?.({
          id: `success-${Date.now()}`,
          title: 'Assistant deployed successfully',
          color: 'success',
          text: 'The dashboard assistant has been configured correctly and is ready to use.',
          iconType: 'check',
        });
      } else {
        onShowToast?.({
          id: `error-${Date.now()}`,
          title: 'Deployment failed',
          color: 'danger',
          text: result.message || 'An error occurred during deployment.',
          iconType: 'cross',
        });
      }
    }
    previousResultRef.current = result;
  }, [result, isLoading, onShowToast]);

  // Determine if button should be disabled
  const isButtonDisabled = () => {
    if (!progress) return false;
    
    // If installation is still in progress, don't disable
    if (progress.overallState !== StepExecutionState.FINISHED) {
      return false;
    }
    
    // If installation finished, check if any step failed
    const hasFailedSteps = progress.steps.some(
      step => step.resultState === StepResultState.FAIL
    );
    
    return hasFailedSteps;
  };

  return (
    <DeploymentStatus
      progress={progress}
      onCheckButton={onCheckButton}
      showCheckButton={showCheckButton}
      isButtonDisabled={isButtonDisabled()}
    />
  );
};