import React, { useState, useEffect } from 'react';
import {
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiIcon,
  EuiLoadingSpinner,
  EuiLink,
  EuiListGroup,
  EuiListGroupItem,
  EuiToolTip,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

type StepStatus = 'pending' | 'loading' | 'success' | 'error';

interface DeploymentStep {
  id: string;
  label: string;
  error?: string;
}

interface DeploymentStatusProps {
  steps: DeploymentStep[];
  title?: string;
  autoStart?: boolean;
  stepDelay?: number;
  onStepComplete?: (stepId: string, status: StepStatus) => void;
  onAllComplete?: (allSuccess: boolean) => void;
  onClose?: () => void;
  onCheckButton?: () => void;
}

export const DeploymentStatus = ({
  steps,
  title = 'Deploying dashboard assistant',
  autoStart = true,
  stepDelay = 2000,
  onStepComplete,
  onAllComplete,
  onCheckButton,
  onClose,
}: DeploymentStatusProps) => {
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    () => {
      const initialStatuses: Record<string, StepStatus> = {};
      steps.forEach(step => {
        initialStatuses[step.id] = 'pending';
      });
      return initialStatuses;
    },
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const stepKeys = steps.map(step => step.id);

  useEffect(() => {
    if (!autoStart) return;

    const processSteps = async () => {
      for (let i = 0; i < stepKeys.length; i++) {
        const stepKey = stepKeys[i];
        if (stepStatuses[stepKey] !== 'pending') continue;

        setCurrentStepIndex(i);

        // Set step to loading
        setStepStatuses(prev => ({
          ...prev,
          [stepKey]: 'loading',
        }));

        await new Promise(resolve =>
          setTimeout(resolve, stepDelay + Math.random() * 1000),
        );
        const isSuccess = true;
        const newStatus: StepStatus = isSuccess ? 'success' : 'error';

        setStepStatuses(prev => ({
          ...prev,
          [stepKey]: newStatus,
        }));

        if (onStepComplete) {
          onStepComplete(stepKey, newStatus);
        }

        if (!isSuccess) {
          if (onAllComplete) {
            onAllComplete(false);
          }
          break;
        }

        if (i === stepKeys.length - 1 && isSuccess && onAllComplete) {
          onAllComplete(true);
        }
      }
    };

    processSteps();
  }, [autoStart, stepDelay, onStepComplete, onAllComplete]);

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'loading':
        return <EuiLoadingSpinner size='m' />;
      case 'success':
        return <EuiIcon type='check' color='success' />;
      case 'error':
        return <EuiIcon type='cross' color='danger' />;
      case 'pending':
      default:
        return <EuiIcon type='clock' color='subdued' />;
    }
  };

  const allStepsCompleted = Object.values(stepStatuses).every(
    status => status === 'success' || status === 'error',
  );
  const allStepsSuccess = Object.values(stepStatuses).every(
    status => status === 'success',
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
        {steps.map(step => {
          const stepStatus = stepStatuses[step.id];
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
              }}
            >
              <EuiText size='s'>{step.label}</EuiText>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {stepStatus === 'error' && step.error ? (
                  <EuiToolTip content={step.error}>
                    <div style={{ cursor: 'pointer' }}>
                      {getStepIcon(stepStatus)}
                    </div>
                  </EuiToolTip>
                ) : (
                  getStepIcon(stepStatus)
                )}
              </div>
            </div>
          );
        })}
      </EuiListGroup>

      {allStepsCompleted && allStepsSuccess && onClose && (
        <>
          <EuiSpacer size='l' />
          <EuiFlexGroup justifyContent='center'>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                onClick={() => onCheckButton?.()}
                iconType='check'
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
