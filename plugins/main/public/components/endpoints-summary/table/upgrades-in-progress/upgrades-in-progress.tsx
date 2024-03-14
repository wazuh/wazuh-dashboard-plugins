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
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

interface AgentUpgradesInProgress {
  reload: any;
  setIsModalVisible: (isModalVisible: boolean) => void;
  isPanelClosed: boolean;
  setIsPanelClosed: (isPanelClosed: boolean) => void;
  allowGetTasks: boolean;
}

export const AgentUpgradesInProgress = ({
  reload,
  setIsModalVisible,
  isPanelClosed,
  setIsPanelClosed,
  allowGetTasks,
}: AgentUpgradesInProgress) => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const {
    totalInProgressTasks = 0,
    getInProgressError = undefined,
    totalSuccessTasks = 0,
    getSuccessError = undefined,
    totalErrorUpgradeTasks = 0,
    getErrorTasksError = undefined,
  } = allowGetTasks ? useGetUpgradeTasks(reload) : {};

  useEffect(() => {
    if (totalInProgressTasks > 0) {
      setIsUpgrading(true);
    }
  }, [totalInProgressTasks]);

  if (getInProgressError) {
    const options = {
      context: `AgentUpgradesInProgress.useGetUpgradeTasks`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: getInProgressError,
        message: getInProgressError.message || getInProgressError,
        title: `Could not get upgrade progress tasks`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }

  if (getSuccessError) {
    const options = {
      context: `AgentUpgradesInProgress.useGetUpgradeTasks`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: getSuccessError,
        message: getSuccessError.message || getSuccessError,
        title: `Could not get upgrade success tasks`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }

  if (getErrorTasksError) {
    const options = {
      context: `AgentUpgradesInProgress.useGetUpgradeTasks`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: getErrorTasksError,
        message: getErrorTasksError.message || getErrorTasksError,
        title: `Could not get upgrade error tasks`,
      },
    };
    getErrorOrchestrator().handleError(options);
  }

  const showTasks = isUpgrading || totalSuccessTasks || totalErrorUpgradeTasks;
  if (isPanelClosed || !showTasks) return null;

  return (
    <EuiPanel color='subdued'>
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
                {' In progress'}
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
                  {' Success '}
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
                  {' Failed '}
                  <EuiIconTip content='Last 60 minutes' color='primary' />
                </EuiText>
              </span>
            </EuiPanel>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    </EuiPanel>
  );
};
