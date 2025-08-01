import React from 'react';
import {
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiIcon,
  EuiLoadingSpinner,
  EuiLink,
  EuiListGroup,
  EuiToolTip,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import {
  InstallationProgress,
  StepExecutionState,
  StepResultState,
} from '../common/installation-manager/domain/types';
import type { StepStatus } from '../common/installation-manager/domain/types';

type UIStepStatus = 'pending' | 'loading' | 'success' | 'error' | 'warning';

interface DeploymentStatusProps {
  progress: InstallationProgress | null;
  title?: string;
  onCheckButton?: () => void;
  showCheckButton?: boolean;
  isButtonDisabled?: boolean;
}

export const DeploymentStatus = ({
  progress,
  title = 'Deploying dashboard assistant',
  onCheckButton,
  showCheckButton = false,
  isButtonDisabled = false,
}: DeploymentStatusProps) => {
  // Helper function to map installation states to UI states
  const mapToUIStatus = (
    executionState: StepExecutionState,
    resultState?: StepResultState,
  ): UIStepStatus => {
    if (executionState === StepExecutionState.WAITING) {
      return 'pending';
    }
    if (executionState === StepExecutionState.PROCESSING) {
      return 'loading';
    }
    if (executionState === StepExecutionState.FINISHED) {
      if (resultState === StepResultState.SUCCESS) {
        return 'success';
      }
      if (resultState === StepResultState.FAIL) {
        return 'error';
      }
      if (resultState === StepResultState.WARNING) {
        return 'warning';
      }
    }
    return 'pending';
  };

  const getStepIcon = (status: UIStepStatus) => {
    switch (status) {
      case 'loading':
        return <EuiLoadingSpinner size='m' />;
      case 'success':
        return <EuiIcon type='check' color='success' />;
      case 'error':
        return <EuiIcon type='cross' color='danger' />;
      case 'warning':
        return <EuiIcon type='alert' color='warning' />;
      case 'pending':
      default:
        return <EuiIcon type='clock' color='subdued' />;
    }
  };

  const steps = progress?.steps || [];
  const allStepsCompleted =
    progress?.overallState === StepExecutionState.FINISHED;
  const allStepsSuccess = steps.every(
    step =>
      step.resultState === StepResultState.SUCCESS ||
      step.resultState === StepResultState.WARNING,
  );

  return (
    <>
      <EuiTitle size='s'>
        <h3>Assistant Setup in Progress</h3>
      </EuiTitle>

      <EuiSpacer size='s' />

      <EuiText size='s' color='subdued'>
        Installing and configuring your intelligent dashboard assistant. Please
        wait while we set up the AI components and establish model connections
        to enable natural language interactions with your data.{' '}
        <EuiLink href='#'>Learn more</EuiLink>
      </EuiText>

      <EuiSpacer size='l' />

      <EuiListGroup flush maxWidth={false}>
        {steps.map((step: StepStatus, index) => {
          const uiStatus = step
            ? mapToUIStatus(step.executionState, step.resultState)
            : 'pending';
          const key = `${step.stepName}-${index}`;

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
              }}
            >
              <EuiText size='s'>{step.stepName}</EuiText>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {uiStatus === 'error' && step?.error ? (
                  <EuiToolTip content={step.error.message}>
                    <div style={{ cursor: 'pointer' }}>
                      {getStepIcon(uiStatus)}
                    </div>
                  </EuiToolTip>
                ) : (
                  getStepIcon(uiStatus)
                )}
              </div>
            </div>
          );
        })}
      </EuiListGroup>

      {(showCheckButton || (allStepsCompleted && allStepsSuccess)) && (
        <>
          <EuiSpacer size='l' />
          <EuiFlexGroup justifyContent='center'>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                onClick={() => onCheckButton?.()}
                iconType='check'
                disabled={isButtonDisabled}
              >
                Check assistant status
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </>
  );
};
