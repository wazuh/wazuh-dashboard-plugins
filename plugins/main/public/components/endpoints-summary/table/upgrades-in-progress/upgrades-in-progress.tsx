import React, { useState, useEffect } from 'react';
import {
  EuiPanel,
  EuiProgress,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiSpacer,
  EuiButtonEmpty,
  EuiButtonIcon,
} from '@elastic/eui';
import { useGetUpgradeTasks } from '../../hooks';
import {
  API_NAME_TASK_STATUS,
  UI_LOGGER_LEVELS,
} from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { isPermissionError } from '../../services';

interface AgentUpgradesInProgress {
  reload: any;
  setIsModalVisible: (isModalVisible: boolean) => void;
  isPanelClosed: boolean;
  setIsPanelClosed: (isPanelClosed: boolean) => void;
}

export const AgentUpgradesInProgress = ({
  reload,
  setIsModalVisible,
  isPanelClosed,
  setIsPanelClosed,
}: AgentUpgradesInProgress) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorShown, setErrorShown] = useState(false);

  const {
    totalInProgressTasks = 0,
    getInProgressError = undefined,
    totalSuccessTasks = 0,
    getSuccessError = undefined,
    totalErrorUpgradeTasks = 0,
    getErrorTasksError = undefined,
    totalTimeoutUpgradeTasks = 0,
    getTimeoutError = undefined,
  } = useGetUpgradeTasks(reload);

  useEffect(() => {
    if (totalInProgressTasks > 0) {
      setIsUpgrading(true);
    }
  }, [totalInProgressTasks]);

  const anyError =
    getInProgressError ||
    getSuccessError ||
    getErrorTasksError ||
    getTimeoutError;
  // Show error toast only once per error
  useEffect(() => {
    if (!anyError || errorShown) return;

    const showErrorToast = (status: string, error: any) => {
      const options = {
        context: `AgentUpgradesInProgress.useGetUpgradeTasks`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error,
          message: error.message || error,
          title: `Could not get upgrade tasks: ${status}`,
        },
      };
      getErrorOrchestrator().handleError(options);
    };

    if (isPermissionError(anyError)) {
      const permissionMessage =
        'Your role does not have permission to view upgrade tasks (task:status).';

      getErrorOrchestrator().handleError({
        context: `AgentUpgradesInProgress.useGetUpgradeTasks`,
        level: UI_LOGGER_LEVELS.WARNING,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: permissionMessage,
          message: permissionMessage,
          title: 'No permissions to view upgrade tasks',
        },
      });
      setErrorShown(true);
      return;
    }

    if (getInProgressError) {
      showErrorToast(API_NAME_TASK_STATUS.IN_PROGRESS, getInProgressError);
    } else if (getSuccessError) {
      showErrorToast(API_NAME_TASK_STATUS.DONE, getSuccessError);
    } else if (getErrorTasksError) {
      showErrorToast(API_NAME_TASK_STATUS.FAILED, getErrorTasksError);
    } else if (getTimeoutError) {
      showErrorToast(API_NAME_TASK_STATUS.TIMEOUT, getTimeoutError);
    }

    setErrorShown(true);
  }, [
    anyError,
    errorShown,
    getInProgressError,
    getSuccessError,
    getErrorTasksError,
    getTimeoutError,
  ]);

  const showTasks = isUpgrading || totalSuccessTasks || totalErrorUpgradeTasks;
  if (isPanelClosed || !showTasks) return null;

  return (
    <>
      <EuiPanel color='plain'>
        <EuiFlexGroup
          gutterSize='s'
          alignItems='flexStart'
          wrap={false}
          responsive={false}
        >
          <EuiFlexGroup
            gutterSize='s'
            alignItems='center'
            wrap={false}
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiText>Upgrade tasks</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                color='primary'
                onClick={() => setIsModalVisible(true)}
                iconType='eye'
              >
                Task details
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              onClick={() => setIsPanelClosed(true)}
              color='text'
              iconType='cross'
              aria-label='Close'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s' />
        <EuiFlexGroup gutterSize='s' alignItems='center'>
          {totalInProgressTasks > 0 ? (
            <EuiFlexItem grow={false}>
              <EuiPanel paddingSize='s' style={{ position: 'relative' }}>
                <EuiProgress size='xs' color='warning' position='absolute' />
                <EuiText size='s'>
                  <b>{totalInProgressTasks}</b>
                  {` ${API_NAME_TASK_STATUS.IN_PROGRESS}`}
                </EuiText>
              </EuiPanel>
            </EuiFlexItem>
          ) : null}
          {totalSuccessTasks > 0 ? (
            <EuiFlexItem grow={false}>
              <EuiPanel paddingSize='s' style={{ position: 'relative' }}>
                <EuiProgress
                  value={100}
                  max={100}
                  size='xs'
                  color='success'
                  position='absolute'
                />
                <span>
                  <EuiText size='s'>
                    <b>{totalSuccessTasks}</b>
                    {` ${API_NAME_TASK_STATUS.DONE} `}
                    <EuiIconTip content='Last 60 minutes' color='primary' />
                  </EuiText>
                </span>
              </EuiPanel>
            </EuiFlexItem>
          ) : null}
          {totalErrorUpgradeTasks > 0 ? (
            <EuiFlexItem grow={false}>
              <EuiPanel paddingSize='s' style={{ position: 'relative' }}>
                <EuiProgress
                  value={100}
                  max={100}
                  size='xs'
                  color='danger'
                  position='absolute'
                />
                <span>
                  <EuiText size='s'>
                    <b>{totalErrorUpgradeTasks}</b>
                    {` ${API_NAME_TASK_STATUS.FAILED} `}
                    <EuiIconTip content='Last 60 minutes' color='primary' />
                  </EuiText>
                </span>
              </EuiPanel>
            </EuiFlexItem>
          ) : null}
          {totalTimeoutUpgradeTasks > 0 ? (
            <EuiFlexItem grow={false}>
              <EuiPanel paddingSize='s' style={{ position: 'relative' }}>
                <EuiProgress
                  value={100}
                  max={100}
                  size='xs'
                  color='subdued'
                  position='absolute'
                />
                <span>
                  <EuiText size='s'>
                    <b>{totalTimeoutUpgradeTasks}</b>
                    {` ${API_NAME_TASK_STATUS.TIMEOUT} `}
                    <EuiIconTip content='Last 60 minutes' color='primary' />
                  </EuiText>
                </span>
              </EuiPanel>
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size='s' />
    </>
  );
};
