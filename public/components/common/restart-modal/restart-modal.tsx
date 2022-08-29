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
import { useDispatch, useSelector } from 'react-redux';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiEmptyPromptProps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiOverlayMask,
} from '@elastic/eui';
import { RestartHandler } from '../../../react-services/wz-restart';
import {
  updateRestartStatus,
  updateUnsynchronizedNodes,
  updateSyncNodesInfo,
  updateRestartNodesInfo,
} from '../../../redux/actions/restartActions';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { RenderBodyModal } from './render-body-modal';

/**
 * The restart modal to show feedback to the user.
 * @param props component's props
 * @returns components's body
 */
export const RestartModal = (props: { isSyncCanceled?: {}; cancelSync? }) => {
  // TODO review if importing these functions in wz-restart work.
  const dispatch = useDispatch();
  const updateRedux = {
    updateRestartStatus: (restartStatus) => dispatch(updateRestartStatus(restartStatus)),
    updateSyncNodesInfo: (syncNodesInfo) => dispatch(updateSyncNodesInfo(syncNodesInfo)),
    updateUnsynchronizedNodes: (unsynchronizedNodes) =>
      dispatch(updateUnsynchronizedNodes(unsynchronizedNodes)),
    updateRestartNodesInfo: (restartNodesInfo) =>
      dispatch(updateRestartNodesInfo(restartNodesInfo)),
  };

  // Cluster nodes that did not synced
  const unsyncedNodes = useSelector((state) => state.restartWazuhReducers.unsynchronizedNodes);

  // Current status of the restarting process
  const restartStatus = useSelector((state) => state.restartWazuhReducers.restartStatus);

  // Current status of the sync process
  const syncNodesInfo = useSelector((state) => state.restartWazuhReducers.syncNodesInfo);

  // Current status of the restart process
  const restartNodesInfo = useSelector((state) => state.restartWazuhReducers.restartNodesInfo);

  // Current section
  const section = useSelector((state) => state.rulesetReducers.section);

  const [nodesNotRestartedState, setNodesNotRestartedState] = useState([]);
  
  useEffect(() => {
    const nodesNotRestarted = restartNodesInfo.flatMap((node) =>
      node.isRestarted ? [] : node.name
    );
    setNodesNotRestartedState(nodesNotRestarted);
  }, [restartNodesInfo]);

  const forceRestart = async () => {
    try {
      await RestartHandler.restartWazuh(updateRedux);
    } catch (error: any) {
      const options = {
        context: `${RestartModal.name}.forceRestart`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error || '',
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
    if (props.cancelSync) {
      props.cancelSync();
    }
  };

  // Build the modal depending on the restart state.
  let emptyPromptProps: Partial<EuiEmptyPromptProps>;
  switch (restartStatus) {
    default:
    case RestartHandler.RESTART_STATES.RESTARTED_INFO:
      emptyPromptProps = {
        title: (
          <>
            <h2 className="wz-modal-restart-title">Wazuh restarted</h2>
          </>
        ),
        body: (
          <>
            <h4 className="wz-padding-left-16">Restart completed:</h4>
            <RenderBodyModal
              nodos={restartNodesInfo}
              statusRestart={RestartHandler.RESTART_STATES.RESTARTED_INFO}
            />
          </>
        ),
        actions: (
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButton color="primary" fill onClick={abort}>
                Aceptar
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.RESTARTING:
      emptyPromptProps = {
        title: (
          <>
            <h2 className="wz-modal-restart-title">Restarting Wazuh</h2>
          </>
        ),
        body: (
          <>
            <h4 className="wz-padding-left-16">Checking restart:</h4>
            <RenderBodyModal
              nodos={restartNodesInfo}
              statusRestart={RestartHandler.RESTART_STATES.RESTARTING}
            />
          </>
        ),
        actions: (
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButton color="primary" disabled fill onClick={abort}>
                Aceptar
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.RESTART_ERROR:
      emptyPromptProps = {
        title: <h2 className="wz-modal-restart-title">Unable to connect to Wazuh.</h2>,
        body: (
          <>
            <h4 className="wz-padding-left-16 wz">Restart error:</h4>
            <RenderBodyModal
              nodos={restartNodesInfo}
              statusRestart={RestartHandler.RESTART_STATES.RESTART_ERROR}
            />
            <p>
              There was an error restarting the nodes{' '}
              <b className="wz-text-black">{nodesNotRestartedState.join(', ')}</b>.
            </p>
          </>
        ),
        actions: (
          <EuiButton color="primary" fill href="#/health-check">
            Go to Healthcheck
          </EuiButton>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.SYNC_ERROR:
      emptyPromptProps = {
        title: <h2 className="wz-modal-restart-title">Synchronization failed</h2>,
        body: (
          <>
            <RenderBodyModal
              nodos={syncNodesInfo}
              statusRestart={RestartHandler.RESTART_STATES.SYNC_ERROR}
            />
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
          <>
            <h2 className="wz-modal-restart-title">Ensuring {section} deployment</h2>
          </>
        ),
        body: (
          <>
            {syncNodesInfo.length > 0 && (
              <>
                <h4>Checking synchronization:</h4>
                <RenderBodyModal
                  nodos={syncNodesInfo}
                  statusRestart={RestartHandler.RESTART_STATES.SYNCING}
                />
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
