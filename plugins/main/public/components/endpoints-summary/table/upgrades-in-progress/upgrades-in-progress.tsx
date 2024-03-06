import React, { useState, useEffect } from 'react';
import {
  EuiPanel,
  EuiProgress,
  EuiText,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiIconTip,
} from '@elastic/eui';
import { useGetUpgradeTasks } from '../../hooks';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { AgentUpgradesTable } from './table';

interface AgentUpgradesInProgress {
  reload: any;
}

export const AgentUpgradesInProgress = ({
  reload,
}: AgentUpgradesInProgress) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const {
    totalInProgressTasks = 0,
    getInProgressError,
    totalErrorUpgradeTasks = 0,
    getErrorTasksError,
  } = useGetUpgradeTasks(reload);

  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const handleOnCloseModal = () => setIsModalVisible(false);

  return isUpgrading || totalErrorUpgradeTasks ? (
    <>
      <EuiPanel paddingSize='s' style={{ position: 'relative' }}>
        {totalInProgressTasks > 0 ? (
          <EuiProgress
            size='xs'
            color={totalErrorUpgradeTasks ? 'danger' : 'primary'}
            position='absolute'
          />
        ) : (
          <EuiProgress
            value={100}
            max={100}
            size='xs'
            color={totalErrorUpgradeTasks ? 'danger' : 'success'}
            position='absolute'
          />
        )}
        <EuiFlexGroup gutterSize='s' alignItems='center'>
          {isUpgrading ? (
            <EuiFlexItem grow={false}>
              <EuiText size='s'>
                <b>{totalInProgressTasks}</b>
                {`${
                  totalInProgressTasks === 1 ? ' Upgrade' : ' Upgrades'
                } in progress`}
              </EuiText>
            </EuiFlexItem>
          ) : null}
          {isUpgrading && totalErrorUpgradeTasks ? (
            <EuiFlexItem grow={false}>/</EuiFlexItem>
          ) : null}
          {totalErrorUpgradeTasks ? (
            <EuiFlexGroup
              gutterSize='s'
              alignItems='center'
              wrap={false}
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiText size='s'>
                  <b>{totalErrorUpgradeTasks}</b>
                  {` Failed ${
                    totalErrorUpgradeTasks === 1 ? 'upgrade' : 'upgrades'
                  }`}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiIconTip content='Last 60 minutes' color='primary' />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiToolTip content={<p>Upgrade task details</p>}>
                  <EuiButtonIcon
                    color='primary'
                    onClick={() => setIsModalVisible(true)}
                    iconType='eye'
                    aria-label='Details'
                  />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : null}
        </EuiFlexGroup>
      </EuiPanel>
      {isModalVisible ? (
        <EuiModal onClose={handleOnCloseModal} maxWidth={false}>
          <EuiModalHeader />
          <EuiModalBody>
            <AgentUpgradesTable />
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButton onClick={handleOnCloseModal} fill>
              Close
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      ) : null}
    </>
  ) : null;
};
