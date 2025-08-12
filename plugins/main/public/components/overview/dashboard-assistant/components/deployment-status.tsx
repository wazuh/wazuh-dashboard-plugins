import React from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiListGroup,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import {
  InstallationProgress,
  ExecutionState,
  StepState,
} from '../modules/installation-manager/domain';
import RegisterAgentCommand from './register-agent-command';
import StepIcon from './step-icon';
import { StepStatus } from './types';

interface DeploymentStatusProps {
  progress?: InstallationProgress;
  agentId?: string;
  title?: string;
  onCheckButton?: () => void;
  showCheckButton?: boolean;
  isButtonDisabled?: boolean;
}

export const DeploymentStatus = ({
  progress,
  agentId,
  onCheckButton,
  showCheckButton = false,
  isButtonDisabled = false,
}: DeploymentStatusProps) => {
  // Helper function to map installation states to UI states
  const mapToUIStatus = (executionState: ExecutionState): StepStatus => {
    if (executionState === ExecutionState.PENDING) {
      return StepStatus.PENDING;
    }
    if (executionState === ExecutionState.RUNNING) {
      return StepStatus.LOADING;
    }
    if (executionState === ExecutionState.FINISHED_SUCCESSFULLY) {
      return StepStatus.SUCCESS;
    }
    if (executionState === ExecutionState.FINISHED_WITH_WARNINGS) {
      return StepStatus.WARNING;
    }
    if (executionState === ExecutionState.FAILED) {
      return StepStatus.ERROR;
    }
    return StepStatus.PENDING;
  };

  const steps = progress?.getSteps() || [];

  return (
    <>
      <EuiTitle size='s'>
        <h3>Assistant setup in progress</h3>
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
        {steps.map((step: StepState, index) => {
          const uiStatus = step
            ? mapToUIStatus(step.state)
            : StepStatus.PENDING;
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
                {uiStatus === StepStatus.ERROR && step?.error ? (
                  <EuiToolTip content={step.error.message}>
                    <div style={{ cursor: 'pointer' }}>
                      <StepIcon status={uiStatus} />
                    </div>
                  </EuiToolTip>
                ) : (
                  <StepIcon status={uiStatus} />
                )}
              </div>
            </div>
          );
        })}
      </EuiListGroup>

      {progress?.isFinished() && agentId && (
        <>
          <EuiSpacer size='l' />
          <RegisterAgentCommand entityId={agentId} targetEntity='agent' />
        </>
      )}

      {(showCheckButton || progress?.isFinished()) && (
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
                Go to model assistants
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </>
  );
};
