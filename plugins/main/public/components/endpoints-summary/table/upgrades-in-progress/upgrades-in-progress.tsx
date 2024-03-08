import React, { useState, useEffect } from 'react';
import {
  EuiPanel,
  EuiProgress,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiSpacer,
} from '@elastic/eui';
import { useGetUpgradeTasks } from '../../hooks';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { AgentUpgradesTaskDetailsButton } from './taskDetailsButton';

interface AgentUpgradesInProgress {
  reload: any;
}

export const AgentUpgradesInProgress = ({
  reload,
}: AgentUpgradesInProgress) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const {
    totalInProgressTasks,
    getInProgressError,
    totalSuccessTasks,
    getSuccessError,
    totalErrorUpgradeTasks,
    getErrorTasksError,
  } = useGetUpgradeTasks(reload);

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

  return isUpgrading || totalSuccessTasks || totalErrorUpgradeTasks ? (
    <EuiPanel color='subdued'>
      <EuiFlexGroup gutterSize='s' alignItems='center'>
        <EuiFlexItem grow={false}>
          <EuiText>Upgrade tasks</EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <AgentUpgradesTaskDetailsButton />
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
                {totalInProgressTasks === 1
                  ? ' Upgrade task in progress'
                  : ' Upgrade tasks in progress'}
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
                  {totalSuccessTasks === 1
                    ? ' Success upgrade task '
                    : ' Success upgrade tasks '}
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
                  {totalErrorUpgradeTasks === 1
                    ? ' Failed upgrade task '
                    : ' Failed upgrade tasks '}

                  <EuiIconTip content='Last 60 minutes' color='primary' />
                </EuiText>
              </span>
            </EuiPanel>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    </EuiPanel>
  ) : null;
};
