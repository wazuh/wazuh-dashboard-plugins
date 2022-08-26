/*
 * Wazuh app - React component for restart Wazuh.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiEmptyPromptProps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiOverlayMask,
  EuiProgress,
  EuiDescriptionList,
} from '@elastic/eui';
import { getHttp } from '../../../kibana-services';
import { WazuhConfig } from '../../../react-services/wazuh-config';
import { RestartHandler } from '../../../react-services/wz-restart';
import { getAssetURL, getThemeAssetURL } from '../../../utils/assets';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateRestartStatus,
  updateRestartAttempt,
  updateSyncCheckAttempt,
  updateUnsynchronizedNodes,
  updateSyncNodesInfo,
} from '../../../redux/actions/restartActions';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { RenderStatus } from './render-status';

/**
 * The restart modal to show feedback to the user.
 * @param props component's props
 * @returns components's body
 */
export const RestartModal = (props: {
  useDelay?: boolean;
  showWarningRestart?;
  isSyncCanceled?: {};
  cancelSync?;
}) => {
  // Component props
  const { useDelay = false } = props;
  // TODO review if importing these functions in wz-restart work.
  const dispatch = useDispatch();
  const updateRedux = {
    updateRestartAttempt: (restartAttempt) => dispatch(updateRestartAttempt(restartAttempt)),
    updateSyncCheckAttempt: (syncCheckAttempt) =>
      dispatch(updateSyncCheckAttempt(syncCheckAttempt)),
    updateUnsynchronizedNodes: (unsynchronizedNodes) =>
      dispatch(updateUnsynchronizedNodes(unsynchronizedNodes)),
    updateRestartStatus: (restartStatus) => dispatch(updateRestartStatus(restartStatus)),
    updateSyncNodesInfo: (syncNodesInfo) => dispatch(updateSyncNodesInfo(syncNodesInfo)),
  };

  // Use default HEALTHCHECK_DELAY
  const [timeToHC, setTimeToHC] = useState(RestartHandler.HEALTHCHECK_DELAY / 1000);

  // Restart polling counter
  const restartAttempt = useSelector((state) => state.restartWazuhReducers.restartAttempt);

  // Cluster nodes that did not synced
  const unsyncedNodes = useSelector((state) => state.restartWazuhReducers.unsynchronizedNodes);

  // Sync polling counter
  const syncPollingAttempt = useSelector((state) => state.restartWazuhReducers.syncCheckAttempt);

  // Current status of the restarting process
  const restartStatus = useSelector((state) => state.restartWazuhReducers.restartStatus);

  // Current status of the sync process
  const syncNodesInfo = useSelector((state) => state.restartWazuhReducers.syncNodesInfo);

  const section = useSelector((state) => state.rulesetReducers.section);

  // Max attempts = MAX_SYNC_POLLING_ATTEMPTS + MAX_RESTART_POLLING_ATTEMPTS
  const maxAttempts = useDelay
    ? RestartHandler.MAX_RESTART_POLLING_ATTEMPTS + RestartHandler.MAX_SYNC_POLLING_ATTEMPTS
    : RestartHandler.MAX_RESTART_POLLING_ATTEMPTS;

  // Current attempt
  const attempts = useDelay ? restartAttempt + syncPollingAttempt : restartAttempt;

  // Load Wazuh logo
  // const wzConfig = new WazuhConfig().getConfig();
  // const logotypeURL = getHttp().basePath.prepend(
  //   wzConfig['customization.logo.sidebar']
  //     ? getAssetURL(wzConfig['customization.logo.sidebar'])
  //     : getThemeAssetURL('icon.svg')
  // );

  // Apply HEALTHCHECK_DELAY when the restart has failed
  useEffect(() => {
    restartStatus === RestartHandler.RESTART_STATES.RESTART_ERROR &&
      countdown(timeToHC, setTimeToHC);

    restartStatus === RestartHandler.RESTART_STATES.RESTARTED_INFO && restartedTimeout();
  }, [restartStatus]);

  // TODO
  const countdown = (time: number, setState) => {
    let countDown = time;

    const interval = setInterval(() => {
      setState(countDown);
      if (countDown === 0 && setState === setTimeToHC) {
        clearInterval(interval);
        RestartHandler.goToHealthcheck();
      } else if (countDown === 0) {
        clearInterval(interval);
      }

      countDown--;
    }, 1000 /* 1 second */);
  };

  const restartedTimeout = () => {
    setTimeout(() => {
      dispatch(updateRestartStatus(RestartHandler.RESTART_STATES.RESTARTED));
      if (props.showWarningRestart) {
        props.showWarningRestart();
      }
    }, RestartHandler.INFO_RESTART_SUCCESS_DELAY);
  };

  const forceRestart = async () => {
    try {
      await RestartHandler.restartWazuh(updateRedux);
    } catch (error) {
      const options = {
        context: `${RestartModal.name}.forceRestart`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  const abort = () => {
    dispatch(updateRestartStatus(RestartHandler.RESTART_STATES.RESTARTED));
    dispatch(updateUnsynchronizedNodes([]));
    dispatch(updateRestartAttempt(0));
    dispatch(updateSyncCheckAttempt(0));
    props.cancelSync();
  };

  // Build the modal depending on the restart state.
  let emptyPromptProps: Partial<EuiEmptyPromptProps>;
  switch (restartStatus) {
    default:
    case RestartHandler.RESTART_STATES.RESTARTED_INFO:
      emptyPromptProps = {
        title: (
          <>
            {/* <img src={logotypeURL} className="wz-modal-restart-logo" alt=""></img> */}
            <h2 className="wz-modal-restart-title">Wazuh restarted</h2>
          </>
        ),
        body: (
          <>
            <EuiProgress value={maxAttempts} max={maxAttempts} size="s" />
          </>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.RESTARTING:
      emptyPromptProps = {
        title: (
          <>
            {/* <img src={logotypeURL} className="wz-modal-restart-logo" alt=""></img> */}
            <h2 className="wz-modal-restart-title">Restarting Wazuh</h2>
          </>
        ),
        body: (
          <>
            <EuiProgress value={attempts} max={maxAttempts} size="s" />
          </>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.RESTART_ERROR:
      emptyPromptProps = {
        iconType: 'alert',
        iconColor: 'danger',
        title: <h2 className="wz-modal-restart-title">Unable to connect to Wazuh.</h2>,
        body: <p>There was an error restarting Wazuh. The Healthcheck will run automatically.</p>,
        actions: (
          <EuiButton color="primary" fill href="#/health-check">
            Go to Healthcheck ({timeToHC} s)
          </EuiButton>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.SYNC_ERROR:
      emptyPromptProps = {
        // iconType: 'alert',
        // iconColor: 'danger',
        title: <h2 className="wz-modal-restart-title">Synchronization failed</h2>,
        body: (
          <>
            {syncNodesInfo.length > 0 && (
              <div className="wz-info-nodes-restart">
                <EuiDescriptionList textStyle="reverse" align="center" type="column">
                  {syncNodesInfo.map((node, index) => (
                    <RenderStatus
                      node={node}
                      key={index}
                      statusRestart={RestartHandler.RESTART_STATES.SYNC_ERROR}
                    />
                  ))}
                </EuiDescriptionList>
              </div>
            )}
            <p className="wz-text-justify">
              The nodes <b className="wz-text-black">{unsyncedNodes.join(', ')}</b> did not
              synchronize. Restarting Wazuh might set the cluster into an inconsistent state. Close
              and try again later.
            </p>
          </>
        ),
        actions: (
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty color="danger" flush="both" onClick={forceRestart}>
                Force restart
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="primary" fill onClick={abort}>
                Cancel
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.SYNCING:
      emptyPromptProps = {
        title: (
          // <div className='wz-modal-restart-title-box'>
          <>
            {/* <img src={logotypeURL} className="wz-modal-restart-logo" alt=""></img> */}
            <h2 className="wz-modal-restart-title">Ensuring {section} deployment</h2>
          </>
          // </div>
        ),
        body: (
          <>
            {syncNodesInfo.length > 0 && (
              <>
                <h4 className="wz-text-left wz-padding-left-16 wz">Checking synchronization:</h4>
                <div className="wz-info-nodes-restart">
                  <EuiDescriptionList
                    textStyle="reverse"
                    align="center"
                    type="column"
                    style={{ maxWidth: '20000px' }}
                  >
                    {syncNodesInfo.map((node, index) => (
                      <RenderStatus
                        node={node}
                        key={index}
                        statusRestart={RestartHandler.RESTART_STATES.SYNCING}
                      />
                    ))}
                  </EuiDescriptionList>
                </div>
              </>
            )}
          </>
        ),
        actions: (
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty disabled color="danger" flush="both" onClick={forceRestart}>
                Force restart
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="primary" fill onClick={abort}>
                Cancel
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      };
      break;
  }

  //
  return (
    <EuiOverlayMask>
      <div
        className={
          restartStatus === RestartHandler.RESTART_STATES.ERROR
            ? 'wz-modal-restart-error'
            : 'wz-modal-restart'
        }
      >
        <EuiEmptyPrompt {...emptyPromptProps} />
      </div>
    </EuiOverlayMask>
  );
};
